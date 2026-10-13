import polars as pl
import numpy as np

from sklearn.ensemble import IsolationForest


def detect(df: pl.DataFrame, max_rows=100000):
    n = df.height

    # For large datasets, take a distributed sample instead of only
    # the first 100K rows. This gives better coverage across the file.
    if n > max_rows:
        step = max(1, n // max_rows)
        sample = df.gather_every(step).head(max_rows)
        sampled_from_full_dataset = True
    else:
        sample = df
        sampled_from_full_dataset = False

    numeric = [
        c
        for c, t in zip(sample.columns, sample.dtypes)
        if t.is_numeric()
    ]

    if not numeric or sample.height < 20:
        return {
            "count": 0,
            "records": [],
            "method": "Isolation Forest",
            "sampled_rows": sample.height,
            "total_rows": n,
            "sampled_from_full_dataset": sampled_from_full_dataset,
        }

    # Keep only numeric columns for Isolation Forest.
    X = (
        sample
        .select(numeric)
        .fill_null(0)
        .to_numpy()
    )

    model = IsolationForest(
        n_estimators=150,
        contamination="auto",
        random_state=42,
        n_jobs=-1,
    )

    labels = model.fit_predict(X)
    scores = -model.score_samples(X)

    # Return the top 100 most unusual records.
    idx = np.argsort(scores)[::-1][:min(100, len(scores))]

    records = []

    for i in idx:
        sev = (
            "High"
            if scores[i] >= 0.65
            else "Medium"
            if scores[i] >= 0.55
            else "Low"
        )

        records.append(
            {
                "id": f"REC-{i + 1:06d}",
                "row_index": int(i),
                "score": round(float(scores[i]), 4),
                "severity": sev,
                "reason": "Unusual multivariate numeric pattern",
            }
        )

    return {
        "count": int((labels == -1).sum()),
        "records": records,
        "method": "Isolation Forest",
        "sampled_rows": sample.height,
        "total_rows": n,
        "sampled_from_full_dataset": sampled_from_full_dataset,
        "note": (
            "Anomalies are potentially unusual records, "
            "not automatically bad data."
        ),
    }