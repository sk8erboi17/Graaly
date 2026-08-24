#!/usr/bin/env python3
"""Run Graaly's real-server smoke suite across every supplied server release."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SERVERS = Path(os.environ.get("GRAALY_SERVER_ROOT", ROOT / "servers"))


def version_key(value: str) -> tuple[int, ...]:
    return tuple(int(part) for part in re.findall(r"\d+", value))


def tested_java_feature() -> int | str:
    java = os.environ.get("GRAALY_JAVA") or shutil.which("java") or "java"
    completed = subprocess.run(
        [java, "-version"], text=True, capture_output=True,
        encoding="utf-8", errors="replace",
    )
    output = (completed.stderr or completed.stdout).strip()
    match = re.search(r'version "(?:1\.)?(\d+)', output)
    return int(match.group(1)) if completed.returncode == 0 and match else "unknown"


def run_one(version: str, server: Path, timeout: int) -> dict[str, object]:
    command = [
        sys.executable, str(ROOT / "scripts" / "test_one.py"),
        version, str(server), "--timeout", str(timeout), "--quiet",
    ]
    completed = subprocess.run(
        command, cwd=ROOT, text=True, capture_output=True,
        encoding="utf-8", errors="replace",
    )
    result_file = ROOT / ".matrix-work" / version / "result.json"
    if result_file.is_file():
        result = json.loads(result_file.read_text(encoding="utf-8"))
    else:
        result = {
            "version": version,
            "server": str(server),
            "passed": False,
            "exitCode": completed.returncode,
            "fatalSignals": ["test harness did not produce result.json"],
        }
    # Reports are published with the source. Keep them reproducible and avoid
    # leaking a contributor's absolute workstation path.
    result["server"] = server.name
    result["harnessExitCode"] = completed.returncode
    if completed.stderr.strip():
        result["harnessStderr"] = completed.stderr[-4000:]
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--servers", type=Path, default=DEFAULT_SERVERS)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--timeout", type=int, default=300)
    parser.add_argument("--keep-work", action="store_true")
    parser.add_argument("--version", action="append", dest="versions")
    args = parser.parse_args()

    selected = set(args.versions or ())
    servers: list[tuple[str, Path]] = []
    for server in args.servers.glob("spigot-*.jar"):
        version = server.stem.removeprefix("spigot-")
        if not selected or version in selected:
            servers.append((version, server.resolve()))
    servers.sort(key=lambda pair: version_key(pair[0]))

    report_dir = ROOT / "reports" / "compatibility"
    report_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, object]] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        pending = {
            pool.submit(run_one, version, server, args.timeout): (version, server)
            for version, server in servers
        }
        for future in as_completed(pending):
            version, _server = pending[future]
            try:
                result = future.result()
            except BaseException as failure:
                result = {
                    "version": version,
                    "passed": False,
                    "fatalSignals": [f"harness exception: {failure}"],
                }
            results.append(result)
            status = "PASS" if result.get("passed") else "FAIL"
            print(f"[{len(results):02d}/{len(servers):02d}] {version}: {status}", flush=True)

            work = ROOT / ".matrix-work" / version
            for filename in ("result.json", "graaly-test.log"):
                source = work / filename
                if source.is_file():
                    shutil.copy2(source, report_dir / f"{version}-{filename}")
            if not args.keep_work and work.is_dir():
                shutil.rmtree(work)

    results.sort(key=lambda value: version_key(str(value["version"])))
    vanilla = []
    if not selected:
        for server in sorted(args.servers.glob("vanilla-1.7*.jar"), key=lambda p: version_key(p.stem)):
            vanilla.append({
                "version": server.stem.removeprefix("vanilla-"),
                "server": server.name,
                "status": "not-applicable",
                "reason": "Vanilla has no plugin loader; a CraftBukkit/Spigot server is required.",
            })
    summary = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "java": tested_java_feature(),
        "tested": len(results),
        "passed": sum(bool(result.get("passed")) for result in results),
        "failed": sum(not bool(result.get("passed")) for result in results),
        "results": results,
        "nonPluginServers": vanilla,
    }
    (report_dir / "matrix.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    rows = [
        "# Graaly real-server compatibility matrix",
        "",
        f"Generated: {summary['generatedAt']}",
        "",
        "| Version | Result | JS | Python | Reloads | Fatal signals |",
        "|---|---:|---:|---:|---:|---|",
    ]
    for result in results:
        found = set(result.get("found", ()))
        rows.append(
            f"| {result['version']} | {'PASS' if result.get('passed') else 'FAIL'} "
            f"| {'PASS' if 'GRAALY_MATRIX_JS_COMPAT' in found else 'FAIL'} "
            f"| {'PASS' if 'GRAALY_MATRIX_PY_COMPAT' in found else 'FAIL'} "
            f"| {result.get('reloadCount', 0)} "
            f"| {', '.join(result.get('fatalSignals', ())) or 'none'} |"
        )
    rows.extend(("", "Vanilla 1.7.x jars are listed as not applicable because they cannot load plugins."))
    (report_dir / "MATRIX.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
    print(f"Summary: {summary['passed']}/{summary['tested']} passed")
    return 0 if summary["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
