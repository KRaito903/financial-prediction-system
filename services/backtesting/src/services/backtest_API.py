from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
from ..models.backtest_schema import schema

app = FastAPI()

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


# Add GraphQL endpoint
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

# To run the FastAPI server, use the command: uvicorn src.services.backtestAPI:app --reload --port 5050
# Or use the run.py script for more options