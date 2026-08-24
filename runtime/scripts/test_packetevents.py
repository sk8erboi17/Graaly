#!/usr/bin/env python3
"""Exercise Graaly's JS, TS, and Python PacketEvents surfaces on one real server."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import queue
import re
import shutil
import subprocess
import sys
import threading
import time
import zipfile


ROOT = Path(__file__).resolve().parents[1]
JAVA = Path(os.environ.get("GRAALY_JAVA") or shutil.which("java") or "java")
RUNTIME = Path(os.environ.get(
    "GRAALY_RUNTIME_JAR", ROOT / "target" / "Graaly-1.0.0.jar"))
AGENT = Path(
    os.environ.get("GRAALY_LEGACY_AGENT")
    or os.environ.get("GRAALY_JAVA25_AGENT")
    or ROOT / "target" / "graaly-1.0.0-legacy-launcher-agent.jar")
SHARED_RUNTIME_CACHE = (
    Path(os.environ["GRAALY_RUNTIME_CACHE"]).expanduser().resolve()
    if os.environ.get("GRAALY_RUNTIME_CACHE") else None
)
BUNDLES = (
    "PacketEventsJavaScript.jsplugin",
    "PacketEventsTypeScript.jsplugin",
    "PacketEventsPython.pyplugin",
    "PortingSurfaceJavaScript.jsplugin",
    "PortingSurfaceTypeScript.jsplugin",
    "PortingSurfacePython.pyplugin",
)
REQUIRED = {
    "ready for JavaScript",
    "ready for TypeScript",
    "ready for Python",
    "PORTING-JS SURFACE PASS",
    "PORTING-TS SURFACE PASS",
    "PORTING-PY SURFACE PASS",
}
FATAL = (
    "PORTING-JS FAIL",
    "PORTING-TS FAIL",
    "PORTING-PY FAIL",
    "PacketEvents wrapper self-test failed",
    "Error enabling",
    "InvalidPluginException",
    "NoClassDefFoundError",
    "PolyglotException",
    "VerifyError",
    "Graaly requires Java",
    "Could not prepare Graal language runtimes",
    "Could not link the downloaded Graal language runtimes",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def plugin_version(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        manifest = archive.read("plugin.yml").decode("utf-8", errors="replace")
    return next(
        (line.split(":", 1)[1].strip().strip("'\"")
         for line in manifest.splitlines() if line.startswith("version:")),
        "unknown",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("version")
    parser.add_argument("server", type=Path)
    parser.add_argument("packetevents", type=Path)
    parser.add_argument("--timeout", type=int, default=240)
    parser.add_argument("--keep-work", action="store_true")
    args = parser.parse_args()
    for path, label in ((args.server, "server"), (args.packetevents, "PacketEvents"),
                        (RUNTIME, "Graaly runtime"), (AGENT, "legacy launcher agent"),
                        (JAVA, "Java executable")):
        if not path.is_file():
            parser.error(f"{label} does not exist: {path}")
    java_check = subprocess.run(
        [str(JAVA), "-version"], text=True, capture_output=True,
        encoding="utf-8", errors="replace",
    )
    java_output = (java_check.stderr or java_check.stdout).strip()
    match = re.search(r'version "(?:1\.)?(\d+)', java_output)
    if java_check.returncode != 0 or not match:
        parser.error(f"cannot identify Java runtime from: {java_output}")
    java_feature = int(match.group(1))
    if java_feature < 17:
        parser.error(f"Graaly requires Java 17 or newer; found Java {java_feature}")

    work = ROOT / ".packetevents-work"
    if work.exists():
        shutil.rmtree(work)
    scripts = work / "plugins" / "Graaly" / "scripts"
    scripts.mkdir(parents=True)
    shutil.copy2(args.server, work / "server.jar")
    shutil.copy2(RUNTIME, work / "plugins" / RUNTIME.name)
    shutil.copy2(args.packetevents, work / "plugins" / args.packetevents.name)
    seeded_cache = None
    if SHARED_RUNTIME_CACHE is not None:
        candidate = SHARED_RUNTIME_CACHE / "25.2.4"
        seeded_cache = candidate if candidate.is_dir() else SHARED_RUNTIME_CACHE
        if not seeded_cache.is_dir():
            parser.error(f"runtime cache does not exist: {seeded_cache}")
        destination = work / "plugins" / "Graaly" / "runtime" / "25.2.4"
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(seeded_cache, destination, copy_function=os.link)
        (work / "plugins" / "Graaly" / "config.yml").write_text(
            "runtime:\n"
            "  auto-download: false\n"
            "  languages:\n"
            "    javascript: true\n"
            "    python: true\n"
            "  connect-timeout-seconds: 20\n"
            "  request-timeout-seconds: 180\n"
            "  retry-attempts: 2\n",
            encoding="utf-8",
        )
    for name in BUNDLES:
        source = ROOT / "examples" / name
        manifest = source / "plugin.yml"
        entry = next(
            (line.split(":", 1)[1].strip() for line in manifest.read_text().splitlines()
             if line.startswith("main:")),
            "",
        )
        if not entry or not (source / entry).is_file():
            parser.error(f"{name} has no built entry file: {entry or '<missing main>'}")
        shutil.copytree(source, scripts / name, ignore=shutil.ignore_patterns(
            "node_modules", ".venv", ".pytest_cache", "__pycache__", "*.pyc", "*.db"))
    (work / "eula.txt").write_text("eula=true\n", encoding="utf-8")
    (work / "server.properties").write_text(
        "online-mode=false\nserver-port=0\nlevel-name=packetevents-world\n"
        "level-type=FLAT\ngenerate-structures=false\nspawn-animals=false\n"
        "spawn-monsters=false\nspawn-npcs=false\nview-distance=2\n"
        "simulation-distance=2\nmax-players=1\n",
        encoding="utf-8",
    )

    command = [
        str(JAVA), "-Xms256M", "-Xmx1400M", "-XX:+UseG1GC",
        "--add-opens=java.base/java.lang=ALL-UNNAMED",
        "--add-opens=java.base/java.io=ALL-UNNAMED",
        "--add-opens=java.base/java.util=ALL-UNNAMED",
        "-Dfile.encoding=UTF-8", f"-javaagent:{AGENT}",
        "-jar", "server.jar", "nogui",
    ]
    process = subprocess.Popen(
        command, cwd=work, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace", bufsize=1,
    )
    lines: list[str] = []
    updates: queue.Queue[str] = queue.Queue()

    def collect() -> None:
        assert process.stdout is not None
        for line in process.stdout:
            lines.append(line)
            updates.put(line)
            sys.stdout.write(line)
            sys.stdout.flush()

    reader = threading.Thread(target=collect, daemon=True)
    reader.start()
    deadline = time.monotonic() + args.timeout
    completed_at: float | None = None
    while time.monotonic() < deadline and process.poll() is None:
        observed = "".join(lines)
        if REQUIRED.issubset({marker for marker in REQUIRED if marker in observed}):
            completed_at = completed_at or time.monotonic()
            if time.monotonic() - completed_at >= 2:
                break
        if any(signal in observed for signal in FATAL):
            break
        try:
            updates.get(timeout=0.2)
        except queue.Empty:
            pass
    if process.poll() is None and process.stdin is not None:
        process.stdin.write("stop\n")
        process.stdin.flush()
    try:
        exit_code = process.wait(timeout=60)
    except subprocess.TimeoutExpired:
        process.terminate()
        exit_code = process.wait(timeout=15)
    reader.join(timeout=3)

    latest_log = work / "logs" / "latest.log"
    log = "".join(lines)
    if latest_log.is_file():
        log += "\n" + latest_log.read_text(encoding="utf-8", errors="replace")
    found = sorted(marker for marker in REQUIRED if marker in log)
    fatal = sorted(signal for signal in FATAL if signal in log)
    result = {
        "version": args.version,
        "server": args.server.name,
        "packetevents": args.packetevents.name,
        "packeteventsVersion": plugin_version(args.packetevents),
        "packeteventsSha256": sha256(args.packetevents),
        "graalySha256": sha256(RUNTIME),
        "java": java_feature,
        "runtimeMode": "preseeded-offline" if seeded_cache else "first-start-download",
        "downloadCount": sum("Downloading " in line for line in lines),
        "found": found,
        "missing": sorted(REQUIRED.difference(found)),
        "fatalSignals": fatal,
        "exitCode": exit_code,
        "passed": exit_code == 0 and len(found) == len(REQUIRED) and not fatal,
    }
    report = ROOT / "reports" / "compatibility" / f"packetevents-{args.version}.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    if not args.keep_work:
        shutil.rmtree(work)
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
