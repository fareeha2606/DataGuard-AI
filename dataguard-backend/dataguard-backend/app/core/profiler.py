import polars as pl
from app.utils.data import pct, safe_json

def profile(df: pl.DataFrame):
    rows, cols = df.height, df.width
    columns=[]; missing_total=0
    for c,t in zip(df.columns, df.dtypes):
        miss=df[c].null_count(); missing_total += miss
        unique=df[c].n_unique()
        columns.append({"name":c,"dtype":str(t),"missing":miss,"missing_pct":pct(miss,rows),"unique":unique,"unique_pct":pct(unique,rows)})
    duplicates=rows-df.unique().height
    return {"rows":rows,"columns":cols,"column_details":columns,"missing_cells":missing_total,"missing_pct":pct(missing_total,rows*cols),"duplicates":duplicates}
