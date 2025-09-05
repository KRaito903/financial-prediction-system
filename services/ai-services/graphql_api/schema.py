import strawberry
import typing
from graphql_api.resolvers import resolve_train_model, resolve_predict_model
from graphql_api.types import PredictionRow, TrainResult

# ==== Root Schema ====
@strawberry.type
class Mutation:
    train_model: TrainResult = strawberry.mutation(resolver=resolve_train_model)
    predict_model: typing.List[PredictionRow] = strawberry.mutation(resolver=resolve_predict_model)

@strawberry.type
class Query:
    health_check: str = strawberry.field(resolver=lambda: "OK")

schema = strawberry.Schema(query=Query, mutation=Mutation)
