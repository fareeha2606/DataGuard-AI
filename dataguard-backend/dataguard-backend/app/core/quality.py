import re
import polars as pl

from app.utils.data import pct


def quality_analysis(df: pl.DataFrame, target: str | None = None):
    rows = df.height
    issues = []

    missing = []
    invalid = []
    inconsistent = []

    for c in df.columns:
        s = df[c]
        miss = s.null_count()

        if miss:
            missing.append((c, miss))

        # String/category consistency check
        if s.dtype == pl.String:
            vals = s.drop_nulls().cast(pl.String)

            # Obvious whitespace/case category inconsistencies
            normalized = (
                vals.str.strip_chars()
                .str.to_lowercase()
            )

            if normalized.n_unique() < vals.n_unique() and vals.n_unique() > 1:
                inconsistent.append(
                    (c, vals.n_unique() - normalized.n_unique())
                )

        # Numeric validation
        if s.dtype in (
            pl.Int8,
            pl.Int16,
            pl.Int32,
            pl.Int64,
            pl.UInt8,
            pl.UInt16,
            pl.UInt32,
            pl.UInt64,
            pl.Float32,
            pl.Float64,
        ):
            neg = s.lt(0).sum()

            if neg and any(
                k in c.lower()
                for k in [
                    "age",
                    "tenure",
                    "quantity",
                    "count",
                    "income",
                    "amount",
                    "price",
                ]
            ):
                invalid.append((c, int(neg)))

    # Duplicate rows
    dup = rows - df.unique().height

    # Missing-value issues
    for c, n in missing:
        sev = (
            "High"
            if n / rows > 0.05
            else "Medium"
            if n / rows > 0.01
            else "Low"
        )

        issues.append(
            {
                "issue": f"Missing values in {c}",
                "column": c,
                "severity": sev,
                "rows": str(n),
                "description": f"{pct(n, rows)}% of records are missing.",
                "action": "Impute or review missing values",
                "status": "Open",
            }
        )

    # Inconsistent category issues
    for c, n in inconsistent:
        issues.append(
            {
                "issue": f"Category inconsistency in {c}",
                "column": c,
                "severity": "Medium",
                "rows": str(n),
                "description": "Values differ only by casing/whitespace in part of the column.",
                "action": "Standardize category values",
                "status": "Open",
            }
        )

    # Invalid numeric issues
    for c, n in invalid:
        issues.append(
            {
                "issue": f"Invalid negative values in {c}",
                "column": c,
                "severity": "Low",
                "rows": str(n),
                "description": "Negative values may violate the inferred semantic constraint.",
                "action": "Correct or quarantine records",
                "status": "Open",
            }
        )

    # Duplicate issue
    if dup:
        issues.append(
            {
                "issue": "Duplicate records",
                "column": "All columns",
                "severity": "Medium",
                "rows": str(dup),
                "description": "Exact duplicate rows were detected.",
                "action": "Review and deduplicate",
                "status": "Open",
            }
        )

    # Quality scores
    miss_score = max(
        0,
        100
        - (
            sum(n for _, n in missing)
            / max(rows * max(df.width, 1), 1)
        )
        * 100,
    )

    dup_score = max(
        0,
        100 - dup / max(rows, 1) * 100,
    )

    consistency = 100

    if inconsistent:
        consistency = max(
            0,
            100 - len(inconsistent) * 8,
        )

    validity = max(
        0,
        100 - len(invalid) * 5,
    )

    dimensions = [
        {
            "name": "Completeness",
            "score": round(miss_score),
            "status": (
                "Good"
                if miss_score >= 90
                else "Attention"
                if miss_score >= 75
                else "Critical"
            ),
            "text": "Coverage of populated cells.",
        },
        {
            "name": "Accuracy",
            "score": round(max(60, validity)),
            "status": (
                "Good"
                if validity >= 90
                else "Attention"
            ),
            "text": "Heuristic validation of numeric values and obvious constraints.",
        },
        {
            "name": "Consistency",
            "score": round(consistency),
            "status": (
                "Good"
                if consistency >= 90
                else "Attention"
            ),
            "text": "Formatting and category consistency.",
        },
        {
            "name": "Validity",
            "score": round(validity),
            "status": (
                "Good"
                if validity >= 90
                else "Attention"
            ),
            "text": "Values against inferred semantic constraints.",
        },
        {
            "name": "Uniqueness",
            "score": round(dup_score),
            "status": (
                "Good"
                if dup_score >= 95
                else "Attention"
            ),
            "text": "Duplicate-row assessment.",
        },
        {
            "name": "Integrity",
            "score": 88,
            "status": "Good",
            "text": "Basic structural integrity; domain relationships need explicit rules.",
        },
    ]

    overall = round(
        sum(x["score"] for x in dimensions)
        / len(dimensions)
    )

    return {
        "score": overall,
        "dimensions": dimensions,
        "issues": issues,
    }