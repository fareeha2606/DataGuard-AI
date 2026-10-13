from pathlib import Path

import json
import math
import re

import polars as pl


def safe_json(x):
    if x is None or isinstance(x, (str, int, bool)):
        return x

    if isinstance(x, float):
        return None if math.isnan(x) or math.isinf(x) else x

    if isinstance(x, (list, tuple)):
        return [safe_json(v) for v in x]

    if isinstance(x, dict):
        return {str(k): safe_json(v) for k, v in x.items()}
    return str(x)


def read_csv(path: str, sample_rows: int | None = None):
    df = pl.read_csv(
        path,
        infer_schema_length=10000,
        try_parse_dates=True,
        ignore_errors=True,
        truncate_ragged_lines=True,
    )

    if sample_rows is not None and sample_rows > 0:
        return df.head(sample_rows)

    return df


def profile(df):
    total_cells = df.height * df.width

    missing_by_column = {
        col: df[col].null_count()
        for col in df.columns
    }

    missing_total = sum(missing_by_column.values())

    return {
        "rows": df.height,
        "columns": df.width,
        "column_names": df.columns,
        "missing_values": missing_by_column,
        "missing_total": missing_total,
        "missing_percentage": round(
            (missing_total / total_cells) * 100, 2
        ) if total_cells else 0,
        "duplicate_rows": int(df.is_duplicated().sum()),
        "dtypes": {
            col: str(df[col].dtype)
            for col in df.columns
        },
    }


def pct(a, b):
    return round((a / b * 100) if b else 0, 2)


def clean_name(s):
    return re.sub(r'[^A-Za-z0-9_.-]+', '_', s)


def dataframe_to_records(df):
    return [
        {
            str(k): safe_json(v)
            for k, v in row.items()
        }
        for row in df.to_dicts()
    ]


def ensure_directory(path):
    Path(path).mkdir(parents=True, exist_ok=True)
    return path