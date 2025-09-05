import strawberry
import typing
from graphql_api.resolvers import resolve_train_model, resolve_predict_model
from graphql_api.types import PredictionRow, TrainResult

# ==== Root Schema ====
@strawberry.type
class Mutation:
    train_model: TrainResult = strawberry.mutation(resolver=resolve_train_model)

@strawberry.type
class Query:
    health_check: str = strawberry.field(resolver=lambda: "OK")
    predict_model: typing.List[PredictionRow] = strawberry.field(resolver=resolve_predict_model)

schema = strawberry.federation.Schema(
    query=Query, mutation=Mutation, types=[PredictionRow, TrainResult], enable_federation_2=True
)
