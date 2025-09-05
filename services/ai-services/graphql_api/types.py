# ==== Types ====
import strawberry


@strawberry.type
class TrainResult:
    model_name: str
    status: str

@strawberry.type
class PredictionRow:
    timestamp: str
    close: float
    symbol: str
