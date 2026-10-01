"""Reproduce the pinned C-only browser toolchain; no compiler service is used."""
import gzip
import hashlib
import io
import json
import pathlib
import tarfile
import urllib.request
import subprocess

root = pathlib.Path(__file__).resolve().parent.parent
target = root / "public/academy/runtime/c"
target.mkdir(parents=True, exist_ok=True)
release = "https://github.com/cppstudio-io/wasm-clang-runtime/releases/download/v0.1.0/"
cache = pathlib.Path("/tmp/graaly-academy-clang-downloads")
files = []
upstream_hashes = {
    "clang22-noeh": "e01346e33b31a3b3359a317450502bd4feb78cd6ca7fed08aca8601f9ff8834d",
    "lld22-noeh": "63c397c582e193aacd96fbdeb04b1bd32f47ae505f6dc4a569ed08a80ddfeff7",
    "sysroot22.tar": "d991c621cdf9b4640c2cd4aa21abb08491c2ae6ef9917cac5c6065553604bcec",
}
# Build the tiny filesystem reactor from the attributed upstream sources.
compiler = root / "runtime/academy/compiler"
subprocess.run(["zig", "cc", "-target", "wasm32-wasi", "-O2", "-c", str(compiler / "memfs.c"), "-o", "/tmp/graaly-memfs.o"], check=True)
subprocess.run(["zig", "cc", "-target", "wasm32-wasi", "-O2", "-DSTB_SPRINTF_IMPLEMENTATION", "-x", "c", "-c", str(compiler / "stb_sprintf.h"), "-o", "/tmp/graaly-stb.o"], check=True)
subprocess.run(["zig", "build-exe", "-target", "wasm32-wasi", "-fno-entry", "-rdynamic", "--import-symbols", "--initial-memory=33554432", "/tmp/graaly-memfs.o", "/tmp/graaly-stb.o", "-lc", "-femit-bin=" + str(target / "memfs.wasm")], check=True)
for source, output in [("clang22-noeh", "clang.wasm.gz"), ("lld22-noeh", "lld.wasm.gz"), ("sysroot22.tar", "sysroot.tar.gz")]:
    cached = cache / source
    data = cached.read_bytes() if cached.exists() else urllib.request.urlopen(release + source).read()
    upstream_sha = hashlib.sha256(data).hexdigest()
    if upstream_sha != upstream_hashes[source]:
        raise ValueError("Unexpected upstream toolchain checksum: " + source)
    if source.startswith("sysroot"):
        buffer = io.BytesIO()
        with tarfile.open(fileobj=io.BytesIO(data)) as archive, tarfile.open(fileobj=buffer, mode="w", format=tarfile.USTAR_FORMAT) as dest:
            directories = set()
            for member in archive:
                name = member.name.removeprefix("./")
                if "/._" in "/" + name or "/c++/" in name or "/noeh/" in name:
                    continue
                keep = name.startswith("include/") or name.startswith("lib/clang/22/include/") or name in ["lib/wasm32-wasip1/" + f for f in ["libc.a", "libm.a", "libclang_rt.builtins.a", "crt1.o"]]
                if not keep or not member.isfile():
                    continue
                parts = name.split("/")[:-1]
                for index in range(1, len(parts) + 1):
                    directory = "/".join(parts[:index]) + "/"
                    if directory not in directories:
                        entry = tarfile.TarInfo(directory)
                        entry.type = tarfile.DIRTYPE
                        entry.mode = 0o755
                        dest.addfile(entry)
                        directories.add(directory)
                content = archive.extractfile(member).read()
                entry = tarfile.TarInfo(name)
                entry.size = len(content)
                entry.mode = 0o644
                dest.addfile(entry, io.BytesIO(content))
        data = buffer.getvalue()
    packed = gzip.compress(data, compresslevel=9, mtime=0)
    (target / output).write_bytes(packed)
    files.append({"file": output, "sha256": hashlib.sha256(packed).hexdigest(), "uncompressedSha256": hashlib.sha256(data).hexdigest(), "upstreamSha256": upstream_sha, "source": release + source, "bytes": len(packed)})
memfs = (target / "memfs.wasm").read_bytes()
files.append({"file": "memfs.wasm", "sha256": hashlib.sha256(memfs).hexdigest(), "bytes": len(memfs)})
bits = (root / "runtime/sdk/c/include/graaly/bits.h").read_bytes()
(target / "bits.h").write_bytes(bits)
files.append({"file": "bits.h", "sha256": hashlib.sha256(bits).hexdigest(), "bytes": len(bits), "source": "runtime/sdk/c/include/graaly/bits.h"})
(target / "manifest.json").write_text(json.dumps({"clang": "22.1.8", "standard": "C17", "target": "wasm32-wasip1", "files": files}, indent=2) + "\n")
print("Vendored C17 compiler, linker, and C-only sysroot: " + str(sum(f["bytes"] for f in files)) + " bytes.")

subprocess.run(["node", str(root / "scripts/stage-academy-libraries.mjs")], cwd=root, check=True)
