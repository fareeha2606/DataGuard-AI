import polars as pl


def recommend(df: pl.DataFrame):
    actions = []

    # -----------------------------
    # Missing value recommendations
    # -----------------------------
    for c in df.columns:
        null_count = df[c].null_count()

        if null_count:
            if df[c].dtype.is_numeric():
                action = "Impute numerical missing values with median"
            else:
                action = "Impute/flag categorical missing values"

            actions.append(
                {
                    "id": f"missing:{c}",
                    "issue": "Missing values",
                    "action": action,
                    "impact": "Improves completeness",
                    "risk": "Low",
                    "rows": str(null_count),
                    "column": c,
                }
            )

    # --------------------------------
    # Category inconsistency detection
    # --------------------------------
    for c in df.columns:
        if df[c].dtype == pl.String:
            s = df[c].drop_nulls()

            if s.len() == 0:
                continue

            normalized = (
                s.str.strip_chars()
                .str.to_lowercase()
            )

            original_unique = s.n_unique()
            normalized_unique = normalized.n_unique()

            if normalized_unique < original_unique:
                actions.append(
                    {
                        "id": f"category:{c}",
                        "issue": "Category inconsistency",
                        "action": "Standardize whitespace and casing",
                        "impact": "Improves consistency",
                        "risk": "Low",
                        "rows": "unknown",
                        "column": c,
                    }
                )

    # -----------------------------
    # Duplicate row recommendation
    # -----------------------------
    duplicate_count = df.height - df.unique().height

    if duplicate_count:
        actions.append(
            {
                "id": "duplicates",
                "issue": "Duplicate rows",
                "action": "Remove exact duplicates",
                "impact": "Improves uniqueness",
                "risk": "Medium",
                "rows": str(duplicate_count),
            }
        )

    # --------------------------------
    # Numeric outlier recommendation
    # --------------------------------
    numeric_columns = [
        c
        for c, dtype in zip(df.columns, df.dtypes)
        if dtype.is_numeric()
    ]

    for c in numeric_columns:
        series = df[c].drop_nulls()

        if series.len() < 20:
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)

        if q1 is None or q3 is None:
            continue

        iqr = q3 - q1

        if iqr == 0:
            continue

        lower = q1 - (1.5 * iqr)
        upper = q3 + (1.5 * iqr)

        outlier_count = df.select(
            (
                (pl.col(c) < lower)
                | (pl.col(c) > upper)
            )
            .fill_null(False)
            .sum()
        ).item()

        if outlier_count:
            actions.append(
                {
                    "id": f"outlier:{c}",
                    "issue": "Potential outliers",
                    "action": "Review or cap extreme numeric values",
                    "impact": "Reduces extreme-value risk",
                    "risk": "Medium",
                    "rows": str(outlier_count),
                    "column": c,
                }
            )

    return actions


def apply_actions(df: pl.DataFrame, actions):
    """
    Apply cleaning actions.

    Supports both:
    1. String action IDs:
       "missing:Age"
       "category:City"
       "duplicates"
       "outlier:Salary"

    2. Dictionary actions:
       {"id": "missing:Age", ...}
    """

    out = df

    for action in actions:

        # --------------------------------
        # Support string and dictionary
        # --------------------------------
        if isinstance(action, str):
            action_id = action
        elif isinstance(action, dict):
            action_id = action.get("id", "")
        else:
            continue

        # Make sure action_id is a string
        if not isinstance(action_id, str):
            continue

        # -----------------------------
        # Missing values
        # -----------------------------
        if action_id.startswith("missing:"):
            c = action_id.split(":", 1)[1]

            if c not in out.columns:
                continue

            if out[c].dtype.is_numeric():
                median_value = out[c].median()

                if median_value is not None:
                    out = out.with_columns(
                        pl.col(c).fill_null(median_value)
                    )
            else:
                out = out.with_columns(
                    pl.col(c).fill_null("Unknown")
                )

        # -----------------------------
        # Category standardization
        # -----------------------------
        elif action_id.startswith("category:"):
            c = action_id.split(":", 1)[1]

            if c in out.columns and out[c].dtype == pl.String:
                out = out.with_columns(
                    pl.col(c)
                    .str.strip_chars()
                    .str.to_lowercase()
                )

        # -----------------------------
        # Duplicate removal
        # -----------------------------
        elif action_id == "duplicates":
            out = out.unique(
                maintain_order=True
            )

        # -----------------------------
        # Outlier handling
        # -----------------------------
        elif action_id.startswith("outlier:"):
            c = action_id.split(":", 1)[1]

            if c not in out.columns:
                continue

            if not out[c].dtype.is_numeric():
                continue

            series = out[c].drop_nulls()

            if series.len() < 20:
                continue

            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)

            if q1 is None or q3 is None:
                continue

            iqr = q3 - q1

            if iqr == 0:
                continue

            lower = q1 - (1.5 * iqr)
            upper = q3 + (1.5 * iqr)

            out = out.with_columns(
                pl.col(c).clip(
                    lower_bound=lower,
                    upper_bound=upper
                )
            )

    return out