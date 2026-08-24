"""Export the authoritative Pydantic/FastAPI contract for TypeScript."""

from __future__ import annotations

import json
import sys
from pathlib import Path


BACKEND = Path(__file__).resolve().parents[1]
OUTPUT = BACKEND / "openapi.json"
sys.path.insert(0, str(BACKEND))

from app.main import create_app  # noqa: E402


schema = create_app().openapi()
OUTPUT.write_text(json.dumps(schema, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"Wrote {OUTPUT.relative_to(BACKEND.parent)}")
