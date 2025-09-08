import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler

class Normalizer:
    def __init__(self, method="standard", per_symbol=True, columns=None):
        """
        Parameters
        ----------
        method : str, "standard" | "minmax"
            Loại scaler dùng để chuẩn hóa.
        per_symbol : bool
            Nếu True: scale theo từng symbol riêng biệt.
            Nếu False: scale toàn bộ dataset.
        columns : list[str] | None
            Các cột numeric cần scale.
        """
        self.method = method
        self.per_symbol = per_symbol
        self.columns = columns
        self.scalers = {}

    def _get_scaler(self):
        if self.method == "standard":
            return StandardScaler()
        elif self.method == "minmax":
            return MinMaxScaler()
        else:
            raise ValueError(f"Unsupported normalization method: {self.method}")

    def fit_transform(self, df, group_col="symbol"):
        df = df.copy()
        if self.per_symbol and group_col in df.columns:
            self.scalers = {}
            for key, sub_df in df.groupby(group_col):
                self.scalers[key] = {}
                for col in self.columns:
                    if col in sub_df.columns:
                        scaler = self._get_scaler()
                        values = scaler.fit_transform(sub_df[[col]]).ravel()
                        df.loc[sub_df.index, col] = pd.Series(values, index=sub_df.index)
                        self.scalers[key][col] = scaler
        else:
            scaler = self._get_scaler()
            values = scaler.fit_transform(df[self.columns])
            df[self.columns] = values
            self.scalers["global"] = scaler
        return df

    def transform(self, df, group_col="symbol"):
        df = df.copy()
        if self.per_symbol and group_col in df.columns:
            for key, sub_df in df.groupby(group_col):
                scalers_for_symbol = self.scalers.get(key)
                if scalers_for_symbol:
                    for col in self.columns:
                        if col in sub_df.columns and col in scalers_for_symbol:
                            scaler = scalers_for_symbol[col]
                            values = scaler.transform(sub_df[[col]]).ravel()
                            df.loc[sub_df.index, col] = pd.Series(values, index=sub_df.index)
        else:
            scaler = self.scalers.get("global")
            if scaler:
                values = scaler.transform(df[self.columns])
                df[self.columns] = values
        return df

    def inverse_transform(self, df, group_col="symbol"):
        df = df.copy()
        available_cols = [c for c in self.columns if c in df.columns]

        if self.per_symbol and group_col in df.columns:
            for key, sub_df in df.groupby(group_col):
                scalers_for_symbol = self.scalers.get(key)
                if scalers_for_symbol:
                    for col in available_cols:
                        if col in scalers_for_symbol:
                            scaler = scalers_for_symbol[col]
                            values = scaler.inverse_transform(sub_df[[col]]).ravel()
                            df.loc[sub_df.index, col] = pd.Series(values, index=sub_df.index)
        else:
            scaler = self.scalers.get("global")
            if scaler:
                values = scaler.inverse_transform(df[available_cols])
                df[available_cols] = values
        return df
