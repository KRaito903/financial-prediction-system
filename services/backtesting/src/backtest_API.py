from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from .models.backtest_schema import schema

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5050", # development
    "http://127.0.0.1:5050", # production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


# Add GraphQL endpoint
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

# To run the FastAPI server, use the command: uvicorn src.services.backtestAPI:app --reload --port 5050
# Or use the run.py script for more options