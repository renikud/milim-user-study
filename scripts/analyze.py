# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "google-cloud-firestore==2.19.0",
#     "pandas==2.2.3",
# ]
# ///
"""Fetch submissions from Firestore and compute CMOS analysis.

Only includes participants who completed all sentences (exactly N ratings).
Normalizes scores so positive = styletts2 is better.

Usage:
    1. Place service-account.json in the repo root
    2. uv run scripts/analyze.py
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
COLLECTION = "submissions"
SENTENCES_CSV = Path(__file__).resolve().parent.parent / "web" / "public" / "sentences.csv"


def count_expected_sentences() -> int:
    """Read sentences.csv to determine how many sentences each participant should have."""
    lines = SENTENCES_CSV.read_text().strip().splitlines()
    return len(lines)


def fetch_submissions() -> pd.DataFrame:
    """Pull all submissions from Firestore into a DataFrame."""
    db = firestore.Client(project=PROJECT_ID)
    docs = db.collection(COLLECTION).stream()

    rows = []
    for doc in docs:
        d = doc.to_dict()
        rows.append({
            "name": d.get("name"),
            "email": d.get("email"),
            "sentence_id": d.get("sentence_id"),
            "model_a": d.get("model_a"),
            "model_b": d.get("model_b"),
            "naturalness_cmos": d.get("naturalness_cmos"),
            "accuracy_cmos": d.get("accuracy_cmos"),
            "timestamp": d.get("timestamp"),
        })

    return pd.DataFrame(rows)


def filter_complete_participants(df: pd.DataFrame, expected: int) -> pd.DataFrame:
    """Keep only participants who submitted exactly `expected` ratings."""
    counts = df.groupby("email").size()
    complete_emails = counts[counts == expected].index
    return df[df["email"].isin(complete_emails)].copy()


def normalize_scores(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize so positive score = styletts2 is better.

    When model_a is styletts2, keep sign as-is.
    When model_b is styletts2, flip the sign.
    """
    sign = (df["model_a"] == "styletts2").astype(int) * 2 - 1
    df["naturalness"] = df["naturalness_cmos"] * sign
    df["accuracy"] = df["accuracy_cmos"] * sign
    return df


def compute_stats(df: pd.DataFrame) -> dict:
    """Compute mean and 95% CI for naturalness and accuracy."""
    n = len(df)
    if n == 0:
        return {}

    def ci95(series: pd.Series) -> float:
        return 1.96 * series.std() / (n ** 0.5)

    return {
        "n_ratings": n,
        "naturalness_mean": df["naturalness"].mean(),
        "naturalness_ci95": ci95(df["naturalness"]),
        "accuracy_mean": df["accuracy"].mean(),
        "accuracy_ci95": ci95(df["accuracy"]),
    }


def print_report(df: pd.DataFrame, expected: int) -> None:
    """Print a summary report."""
    n_participants = df["email"].nunique()
    stats = compute_stats(df)

    print(f"=== CMOS Analysis ===")
    print(f"Scale: positive = styletts2 better, negative = roboshaul better")
    print(f"Expected sentences per participant: {expected}")
    print(f"Complete participants: {n_participants}")
    print(f"Total ratings: {stats['n_ratings']}")
    print()

    def winner(val: float) -> str:
        if val > 0.1:
            return "→ styletts2 is better"
        elif val < -0.1:
            return "→ roboshaul is better"
        return "→ models are similar"

    nat, acc = stats["naturalness_mean"], stats["accuracy_mean"]
    print(f"Naturalness:  {nat:+.3f}  (95% CI ±{stats['naturalness_ci95']:.3f})  {winner(nat)}")
    print(f"Accuracy:     {acc:+.3f}  (95% CI ±{stats['accuracy_ci95']:.3f})  {winner(acc)}")
    print()

    # Per-sentence breakdown
    rename = {"naturalness": "nat (sty−robo)", "accuracy": "acc (sty−robo)"}
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
