#!/usr/bin/env python3
"""Boot one isolated Spigot server and exercise both Graaly languages."""

from __future__ import annotations

import argparse
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


ROOT = Path(__file__).resolve().parents[1]
JAVA = Path(os.environ.get("GRAALY_JAVA") or shutil.which("java") or "java")
RUNTIME = Path(os.environ.get(
    "GRAALY_RUNTIME_JAR",
    ROOT / "target" / "Graaly-1.0.0.jar",
))
LEGACY_AGENT = Path(
    os.environ.get("GRAALY_LEGACY_AGENT")
    or os.environ.get("GRAALY_JAVA25_AGENT")
    or ROOT / "target" / "graaly-1.0.0-legacy-launcher-agent.jar"
)
SHARED_RUNTIME_CACHE = (
    Path(os.environ["GRAALY_RUNTIME_CACHE"]).expanduser().resolve()
    if os.environ.get("GRAALY_RUNTIME_CACHE") else None
)
REQUIRED = {
    "GRAALY_MATRIX_JS_LOAD",
    "GRAALY_MATRIX_JS_ENABLE",
    "GRAALY_MATRIX_JS_COMPAT",
    "GRAALY_MATRIX_JS_CONSTANTS",
    "GRAALY_MATRIX_JS_LEGACY_ADAPTERS",
    "GRAALY_MATRIX_JS_UNSUPPORTED",
    "GRAALY_MATRIX_JS_MEMBER",
    "GRAALY_MATRIX_JS_TASK",
    "GRAALY_MATRIX_JS_COMMAND",
    "GRAALY_MATRIX_JS_ENTITY",
    "GRAALY_MATRIX_JS_ATTRIBUTE",
    "GRAALY_MATRIX_PY_LOAD",
    "GRAALY_MATRIX_PY_ENABLE",
    "GRAALY_MATRIX_PY_COMPAT",
    "GRAALY_MATRIX_PY_CONSTANTS",
    "GRAALY_MATRIX_PY_LEGACY_ADAPTERS",
    "GRAALY_MATRIX_PY_UNSUPPORTED",
    "GRAALY_MATRIX_PY_MEMBER",
    "GRAALY_MATRIX_PY_TASK",
    "GRAALY_MATRIX_PY_COMMAND",
    "GRAALY_MATRIX_PY_ENTITY",
    "GRAALY_MATRIX_PY_ATTRIBUTE",
}
FATAL_SIGNALS = (
    "Fatal error trying to convert",
    "Graaly requires Java",
    "Could not prepare Graal language runtimes",
    "Could not link the downloaded Graal language runtimes",
    "Unsupported Java detected",
    "Unsupported class file major version",
    "Error enabling GraalyMatrix",
    "Could not load 'plugins/Graaly",
    "InvalidPluginException",
    "PolyglotException",
    "VerifyError",
    "NoClassDefFoundError",
    "Unhandled exception in Python task",
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("version")
    parser.add_argument("server", type=Path)
    parser.add_argument("--timeout", type=int, default=240)
    parser.add_argument("--quiet", action="store_true")
    parser.add_argument("--languages", choices=("both", "javascript", "python"), default="both")
    args = parser.parse_args()

    for path, label in ((args.server, "server"), (RUNTIME, "Graaly runtime"),
                        (LEGACY_AGENT, "legacy launcher agent"), (JAVA, "Java executable")):
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

    work = ROOT / ".matrix-work" / args.version
    if work.exists():
        shutil.rmtree(work)
    (work / "plugins" / "Graaly" / "scripts").mkdir(parents=True)
    shutil.copy2(args.server, work / "server.jar")
    shutil.copy2(RUNTIME, work / "plugins" / RUNTIME.name)
    enabled_javascript = args.languages in ("both", "javascript")
    enabled_python = args.languages in ("both", "python")
    bundles = []
    if enabled_javascript:
        bundles.append("MatrixJavaScript.jsplugin")
    if enabled_python:
        bundles.append("MatrixPython.pyplugin")
    required = {
        marker for marker in REQUIRED
        if (enabled_javascript and "_JS_" in marker)
        or (enabled_python and "_PY_" in marker)
    }
    for bundle in bundles:
        shutil.copytree(ROOT / "examples" / bundle,
                        work / "plugins" / "Graaly" / "scripts" / bundle)
    seeded_cache = None
    if SHARED_RUNTIME_CACHE is not None:
        candidate = SHARED_RUNTIME_CACHE / "25.2.4"
        seeded_cache = candidate if candidate.is_dir() else SHARED_RUNTIME_CACHE
        if not seeded_cache.is_dir():
            parser.error(f"runtime cache does not exist: {seeded_cache}")
        destination = work / "plugins" / "Graaly" / "runtime" / "25.2.4"
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(seeded_cache, destination, copy_function=os.link)
    if SHARED_RUNTIME_CACHE is not None or args.languages != "both":
        (work / "plugins" / "Graaly" / "config.yml").write_text(
            "runtime:\n"
            f"  auto-download: {'false' if seeded_cache else 'true'}\n"
            "  languages:\n"
            f"    javascript: {str(enabled_javascript).lower()}\n"
            f"    python: {str(enabled_python).lower()}\n"
            "  connect-timeout-seconds: 20\n"
            "  request-timeout-seconds: 180\n"
            "  retry-attempts: 2\n",
            encoding="utf-8",
        )
    (work / "eula.txt").write_text("eula=true\n", encoding="utf-8")
    (work / "server.properties").write_text(
        "online-mode=false\n"
        "server-port=0\n"
        "level-name=matrix-world\n"
        "level-type=FLAT\n"
        "generate-structures=false\n"
        "spawn-animals=false\n"
        "spawn-monsters=false\n"
        "spawn-npcs=false\n"
        "view-distance=2\n"
        "simulation-distance=2\n"
        "max-players=1\n",
        encoding="utf-8",
    )

    command = [
        str(JAVA), "-Xms256M", "-Xmx1200M", "-XX:+UseG1GC",
        "--add-opens=java.base/java.lang=ALL-UNNAMED",
        "--add-opens=java.base/java.io=ALL-UNNAMED",
        "--add-opens=java.base/java.util=ALL-UNNAMED",
        "-Dfile.encoding=UTF-8", f"-javaagent:{LEGACY_AGENT}",
        "-jar", "server.jar", "nogui",
    ]
    process = subprocess.Popen(
        command,
        cwd=work,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
    )
    lines: list[str] = []
    output: queue.Queue[str] = queue.Queue()

    def collect() -> None:
        assert process.stdout is not None
        for line in process.stdout:
            lines.append(line)
            output.put(line)
            if not args.quiet:
                sys.stdout.write(line)
                sys.stdout.flush()

    reader = threading.Thread(target=collect, daemon=True)
    reader.start()
    latest_log = work / "logs" / "latest.log"

    def observed_log() -> str:
        observed = "".join(lines)
        if latest_log.is_file():
            observed += "\n" + latest_log.read_text(encoding="utf-8", errors="replace")
        return observed

    deadline = time.monotonic() + args.timeout
    completed_at: float | None = None
    probes_sent = False
    reload_sent = False
    stopped = False
    try:
        while time.monotonic() < deadline:
            if process.poll() is not None:
                break
            joined = observed_log()
            if "Truffle could not be initialized" in joined or any(
                    signal in joined for signal in FATAL_SIGNALS):
                assert process.stdin is not None
                process.stdin.write("stop\n")
                process.stdin.flush()
                stopped = True
                break
            observed_markers = {marker for marker in required if marker in joined}
            non_command_markers = {marker for marker in required if not marker.endswith("_COMMAND")}
            if non_command_markers.issubset(observed_markers) and not probes_sent:
                assert process.stdin is not None
                if enabled_javascript:
                    process.stdin.write("graalyjsprobe\n")
                if enabled_python:
                    process.stdin.write("graalypyprobe\n")
                process.stdin.flush()
                probes_sent = True
            elif required.issubset(observed_markers) and probes_sent and not reload_sent:
                assert process.stdin is not None
                process.stdin.write("graaly reload\n")
                process.stdin.flush()
                reload_sent = True
            elif reload_sent and "Graaly script plugin(s)." in joined and "Reloaded " in joined:
                if completed_at is None:
                    completed_at = time.monotonic()
                elif time.monotonic() - completed_at > 2:
                    assert process.stdin is not None
                    process.stdin.write("stop\n")
                    process.stdin.flush()
                    stopped = True
                    break
            time.sleep(0.1)
        if not stopped and process.poll() is None and process.stdin is not None:
            process.stdin.write("stop\n")
            process.stdin.flush()
        try:
            exit_code = process.wait(timeout=45)
        except subprocess.TimeoutExpired:
            process.terminate()
            try:
                exit_code = process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                exit_code = process.wait(timeout=10)
    finally:
        reader.join(timeout=3)

    # Very old launchers route server-thread messages exclusively through
    # Log4j instead of the process pipe.  Merge both channels so the same
    # assertions observe the same runtime evidence on every release.
    log = observed_log()
    found = sorted(marker for marker in required if marker in log)
    missing = sorted(required.difference(found))
    fatal_signals = sorted(signal for signal in FATAL_SIGNALS if signal in log)
    result = {
        "version": args.version,
        "server": str(args.server),
        "java": java_feature,
        "runtimeMode": "preseeded-offline" if seeded_cache else "first-start-download",
        "downloadCount": sum("Downloading " in line for line in lines),
        "reloadCommandCompleted": "Graaly script plugin(s)." in log and "Reloaded " in log,
        "exitCode": exit_code,
        "found": found,
        "missing": missing,
        "reloadCount": min(
            count for count in (
                log.count("GRAALY_MATRIX_JS_ENABLE") if enabled_javascript else None,
                log.count("GRAALY_MATRIX_PY_ENABLE") if enabled_python else None,
            ) if count is not None
        ),
        "fatalSignals": fatal_signals,
        "passed": exit_code == 0 and not missing
                  and (not enabled_javascript or log.count("GRAALY_MATRIX_JS_ENABLE") >= 2)
                  and (not enabled_python or log.count("GRAALY_MATRIX_PY_ENABLE") >= 2)
                  and "Graaly script plugin(s)." in log and "Reloaded " in log
                  and not fatal_signals,
    }
    (work / "graaly-test.log").write_text(log, encoding="utf-8")
    (work / "result.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
