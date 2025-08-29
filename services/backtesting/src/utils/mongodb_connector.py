# dependencies.py
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI, server_api=ServerApi("1"))


def get_database():
    """Returns the MongoDB database instance."""
    return client.Backtests
