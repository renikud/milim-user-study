# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "google-cloud-firestore==2.19.0",
# ]
# ///
"""Export ReNikud participant comments from Firestore.

Usage:
    1. Place service-account.json in the repo root
    2. uv run scripts/export_comments.py
"""

from __future__ import annotations

import csv
import os
from datetime import datetime, timezone
from pathlib import Path

os.environ.setdefault(
    "GOOGLE_APPLICATION_CREDENTIALS",
    str(Path(__file__).resolve().parent.parent / "service-account.json"),
)

from google.cloud import firestore

PROJECT_ID = "phonikud-user-study"
COLLECTION = "renikud_comments"
EXPORTS_DIR = Path(__file__).resolve().parent.parent / "exports"
CSV_FIELDS = ["timestamp", "name", "email", "comments"]


def main() -> None:
    db = firestore.Client(project=PROJECT_ID)
    docs = db.collection(COLLECTION).stream()

    rows = []
    for doc in docs:
        data = doc.to_dict()
        ts = data.get("timestamp")
        timestamp = ts.isoformat() if hasattr(ts, "isoformat") else str(ts or "")
        rows.append({
            "name": data.get("name", ""),
            "email": data.get("email", ""),
            "comments": data.get("comments", ""),
            "timestamp": timestamp,
        })

    rows.sort(key=lambda row: row["timestamp"], reverse=True)

    if not rows:
        print("No comments found.")
        return

    EXPORTS_DIR.mkdir(exist_ok=True)
    output_path = EXPORTS_DIR / (
        f"renikud_comments_{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}.csv"
    )
    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} comments to {output_path}\n")
    for i, row in enumerate(rows, start=1):
        print(f"[{i}] {row['name']} <{row['email']}>")
        if row["timestamp"]:
            print(f"    {row['timestamp']}")
        print("    ---")
        for line in str(row["comments"]).splitlines() or [""]:
            print(f"    {line}")
        print()


if __name__ == "__main__":
    main()
