import numpy as np

class ForecastEnsemble:
    def __init__(self, method="mean", weights=None):
        """
        method: str, phương pháp kết hợp: "mean", "geometric_mean", "weighted_avg"
        weights: list hoặc np.array, trọng số cho weighted_avg
        """
        self.method = method
        self.weights = weights

    def fit(self, forecasts, y_true=None):
        """
        forecasts: list hoặc np.array các forecast từ các model, shape: (n_samples, n_models)
        y_true: giá trị thật, cần để tối ưu weighted_avg
        """
        forecasts = np.array(forecasts)
        n_models = forecasts.shape[1]
        
        if self.method == "weighted_avg":
            if self.weights is not None:
                self.weights = np.array(self.weights)
            else:
                # tối ưu trọng số dựa trên y_true, đơn giản theo MAE ngược
                if y_true is None:
                    raise ValueError("y_true must be provided to optimize weights")
                
                maes = []
                for i in range(n_models):
                    mae = np.mean(np.abs(forecasts[:, i] - y_true))
                    maes.append(mae)
                maes = np.array(maes)
                total = np.sum(1 / maes)  # trọng số ngược MAE
                self.weights = (1 / maes) / total  # chuẩn hóa
        return self

    def predict(self, forecasts):
        """
        forecasts: list hoặc np.array các forecast từ các model, shape: (n_samples, n_models)
        return: np.array, forecast tổng hợp
        """
        forecasts = np.array(forecasts)
        if self.method == "mean":
            return np.mean(forecasts, axis=1)
        elif self.method == "geometric_mean":
            return np.prod(forecasts, axis=1) ** (1 / forecasts.shape[1])
        elif self.method == "weighted_avg":
            if self.weights is None:
                raise ValueError("Weights not defined. Call fit() first or provide weights.")
            return np.sum(forecasts * self.weights, axis=1)
        else:
            raise ValueError(f"Unknown method: {self.method}")
