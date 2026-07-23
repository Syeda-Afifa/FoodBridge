"""
Generic JSON-file repository.

The repository layer is the ONLY code in this project that knows how data is
physically stored. Services talk to repositories through plain method calls
(get, create, update, delete), so replacing these files with PostgreSQL or
DynamoDB later means rewriting this folder and nothing else.

Storage format: one JSON array per entity, e.g. backend/data/listings.json

  [
    { "id": "…", "title": "…", ... },
    { "id": "…", "title": "…", ... }
  ]

A threading.Lock serialises reads and writes so two concurrent requests
cannot interleave a read-modify-write and lose data. This is adequate for a
single-process development server; it is NOT a substitute for a real database
under concurrent production load, and docs/26-risk-analysis.md records that.
"""
import json
from pathlib import Path
from threading import Lock
from typing import Generic, TypeVar

from pydantic import BaseModel

ModelT = TypeVar("ModelT", bound=BaseModel)


class JSONRepository(Generic[ModelT]):
    def __init__(self, path: str | Path, model: type[ModelT]):
        self.path = Path(path)
        self.model = model
        self.lock = Lock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("[]", encoding="utf-8")

    # ── low-level file access ────────────────────────────────────────────────

    def _read_all(self) -> list[dict]:
        with self.lock:
            try:
                with self.path.open("r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                # A truncated or missing file should not take the API down.
                return []

    def _write_all(self, rows: list[dict]) -> None:
        with self.lock:
            with self.path.open("w", encoding="utf-8") as f:
                json.dump(rows, f, ensure_ascii=False, indent=2, default=str)

    def _to_model(self, row: dict) -> ModelT:
        return self.model(**row)

    # ── CRUD ─────────────────────────────────────────────────────────────────

    def list_all(self) -> list[ModelT]:
        return [self._to_model(r) for r in self._read_all()]

    def get(self, item_id: str) -> ModelT | None:
        for row in self._read_all():
            if row.get("id") == item_id:
                return self._to_model(row)
        return None

    def find_by(self, **filters) -> list[ModelT]:
        """
        Return every row whose fields all match the given values.

        Example:  repo.find_by(donor_id="abc", status="AVAILABLE")
        """
        rows = self._read_all()
        matches = [
            r for r in rows
            if all(r.get(key) == value for key, value in filters.items())
        ]
        return [self._to_model(r) for r in matches]

    def create(self, item: ModelT) -> ModelT:
        rows = self._read_all()
        rows.append(json.loads(item.model_dump_json()))
        self._write_all(rows)
        return item

    def update(self, item_id: str, patch: dict) -> ModelT | None:
        rows = self._read_all()
        for index, row in enumerate(rows):
            if row.get("id") == item_id:
                # json round-trip keeps datetimes and enums serialisable
                clean_patch = json.loads(json.dumps(patch, default=str))
                row.update(clean_patch)
                rows[index] = row
                self._write_all(rows)
                return self._to_model(row)
        return None

    def delete(self, item_id: str) -> bool:
        rows = self._read_all()
        remaining = [r for r in rows if r.get("id") != item_id]
        changed = len(remaining) != len(rows)
        if changed:
            self._write_all(remaining)
        return changed
