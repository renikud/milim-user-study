# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "google-cloud-firestore==2.19.0",
#     "pandas==2.2.3",
# ]
# ///
"""Fetch ReNikud submissions from Firestore and evaluate preferences.

Only includes participants who completed their assigned group.
Normalizes preference so positive = informal pronunciation is preferred.

Usage:
    1. Place service-account.json in the repo root
    2. uv run scripts/evaluate.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import os

import pandas as pd

os.environ.setdefault(
    "GOOGLE_APPLICATION_CREDENTIALS",
    str(Path(__file__).resolve().parent.parent / "service-account.json"),
)
from google.cloud import firestore

PROJECT_ID = "phonikud-user-study"
COLLECTION = "renikud_submissions"
EXPECTED_RATINGS_PER_PARTICIPANT = 50


def count_expected_sentences() -> int:
    """Return the number of assigned items in each study group."""
    return EXPECTED_RATINGS_PER_PARTICIPANT


def fetch_submissions() -> pd.DataFrame:
    """Pull all submissions from Firestore into a DataFrame."""
    db = firestore.Client(project=PROJECT_ID)
    docs = db.collection(COLLECTION).stream()

    rows = []
    for doc in docs:
        d = doc.to_dict()
        rows.append({
            "email": d.get("email"),
            "study_group": d.get("study_group"),
            "sentence_id": d.get("sentence_id"),
            "variant_a": d.get("variant_a"),
            "variant_b": d.get("variant_b"),
            "preference": d.get("preference"),
            "timestamp": d.get("timestamp"),
        })

    return pd.DataFrame(rows)


def filter_complete_participants(df: pd.DataFrame, expected: int) -> pd.DataFrame:
    """Keep participants who have `expected` unique items after latest-row dedupe."""
    if "timestamp" in df:
        df = df.sort_values("timestamp", na_position="first")
    df = df.drop_duplicates(["email", "sentence_id"], keep="last")
    counts = df.groupby("email")["sentence_id"].nunique()
    complete_emails = counts[counts == expected].index
    return df[df["email"].isin(complete_emails)].copy()


def normalize_scores(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize so positive score = informal pronunciation is preferred.

    preference is relative to A/B:
      positive = A preferred
      negative = B preferred

    When variant_a is informal, keep sign as-is.
    When variant_b is informal, flip the sign.
    """
    df = df.copy()
    df["preference"] = pd.to_numeric(df["preference"], errors="coerce")
    df = df.dropna(subset=["preference", "variant_a", "variant_b"])
    sign = (df["variant_a"] == "informal").astype(int) * 2 - 1
    df["informal_preference"] = df["preference"] * sign
    df["preferred_variant"] = "similar"
    df.loc[df["preference"] > 0, "preferred_variant"] = df.loc[df["preference"] > 0, "variant_a"]
    df.loc[df["preference"] < 0, "preferred_variant"] = df.loc[df["preference"] < 0, "variant_b"]
    return df


def compute_stats(df: pd.DataFrame) -> dict:
    """Compute mean and 95% CI for normalized informal preference."""
    n = len(df)
    if n == 0:
        return {}

    def ci95(series: pd.Series) -> float:
        return 1.96 * series.std() / (n ** 0.5)

    return {
        "n_ratings": n,
        "informal_preference_mean": df["informal_preference"].mean(),
        "informal_preference_ci95": ci95(df["informal_preference"]),
    }


def print_report(df: pd.DataFrame, expected: int) -> None:
    """Print a summary report."""
    n_participants = df["email"].nunique()
    stats = compute_stats(df)

    print("=== ReNikud Preference Analysis ===")
    print("Scale: positive = informal preferred, negative = formal preferred")
    print(f"Expected items per participant: {expected}")
    print(f"Complete participants: {n_participants}")
    print(f"Total ratings: {stats['n_ratings']}")
    print("Complete participants by group:")
    print(df.groupby("study_group")["email"].nunique().to_string())
    print()

    def winner(val: float) -> str:
        if val > 0.1:
            return "-> informal preferred"
        elif val < -0.1:
            return "-> formal preferred"
        return "-> variants are similar"

    mean = stats["informal_preference_mean"]
    ci95 = stats["informal_preference_ci95"]
    print(f"Preference: {mean:+.3f}  (95% CI +/-{ci95:.3f})  {winner(mean)}")
    print()

    # Per-sentence breakdown
    rename = {"informal_preference": "informal_preference"}
    per_sentence = (
        df.rename(columns=rename)
        .groupby("sentence_id")[[*rename.values()]]
        .agg(["mean", "count"])
    )
    print("Per-sentence breakdown:")
    print(per_sentence.to_string())


def main() -> None:
    expected = count_expected_sentences()
    print(f"Fetching submissions from Firestore...")

    df = fetch_submissions()
    if df.empty:
        print("No submissions found.")
        sys.exit(0)

    required = {"email", "study_group", "sentence_id", "variant_a", "variant_b", "preference"}
    missing = required - set(df.columns)
    if missing:
        print(f"Missing expected fields: {', '.join(sorted(missing))}")
        sys.exit(1)

    total_participants = df["email"].nunique()
    print(f"Found {len(df)} total ratings from {total_participants} participants.")

    df = filter_complete_participants(df, expected)
    if df.empty:
        print(f"No participants completed all {expected} sentences.")
        sys.exit(0)

    df = normalize_scores(df)
    print()
    print_report(df, expected)


if __name__ == "__main__":
    main()
