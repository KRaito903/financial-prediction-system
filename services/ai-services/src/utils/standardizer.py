import pandas as pd

STANDARD_COLUMNS = ["timestamp", "open", "high", "low", "close", "volume"]

def standardize_schema(df: pd.DataFrame, source: str) -> pd.DataFrame:
    if df.empty:
        return df

    if source == "binance":
        df = df[STANDARD_COLUMNS]

    elif source == "yahoo":
        df = df.rename(columns={
            "Date":"timestamp","Open":"open","High":"high","Low":"low",
            "Close":"close","Volume":"volume"
        })
        df = df[STANDARD_COLUMNS]

    # ép kiểu
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit="ms")
    df.set_index('timestamp', inplace=True)
    df = df.astype(float)
    return df
