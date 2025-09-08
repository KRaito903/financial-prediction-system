# ==== Types ====
import strawberry


@strawberry.federation.type
class TrainResult:
    model_name: str
    status: str

@strawberry.federation.type
class PredictionRow:
    timestamp: str
    close: float
    symbol: str
