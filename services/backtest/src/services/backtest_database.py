from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Protocol
from bson import ObjectId
from datetime import datetime
from pymongo import DESCENDING

from ..models.backtest_model import (
    BacktestPydanticResult,
    BacktestResponse,
)

# Repository Design Pattern for Backtest storage/retrieval
# Apparently, this pattern is often considered a higher-level architectural pattern, not one of the fundamental "Gang of Four" (GoF) design patterns.
# It focuses on abstracting the data layer and providing a collection-like interface for accessing domain objects, which is more about structuring code and managing data access than about solving specific object-oriented design problems.
# To be simpler and more pragmatic, GoF Patterns are about managing the relationships and responsibilities of individual classes and objects within an application's code.
# While Repository Pattern is about a larger, more abstract problem: how to separate the business logic from the data access logic.
# So after all, this is a design pattern, but not a GoF one.


# Helper protocol class to map Mongo documents to Pydantic models
# Responsibility: Mapping raw MongoDB documents to Pydantic models
# Protocol allows custom mappers to be used if needed, only requirement is to implement _doc_to_response
# Can't be instantiated directly, must be subclassed or replaced with custom implementation
class DocumentMapper(Protocol):
    def _doc_to_model(self, doc: dict) -> BacktestPydanticResult:
        """Protocol for a document mapper. Defines the interface for a class responsible for mapping raw MongoDB documents to Pydantic models."""
        return BacktestPydanticResult(**doc)
    
    def _doc_to_response(self, doc: dict) -> BacktestResponse:
        """Protocol for a document mapper. Defines the interface for a class responsible for mapping raw MongoDB documents to Pydantic models."""
        return BacktestResponse(**doc)


class BacktestMapper:
    def _doc_to_model(self, doc: dict) -> BacktestPydanticResult:
        """Map a raw Mongo document to the BacktestPydanticResult Pydantic model."""
        if not doc:
            raise ValueError("Document not found")

        # Convert ObjectId to string for the id field
        if "_id" in doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]

        return BacktestPydanticResult(**doc)

    def _doc_to_response(self, doc: dict) -> BacktestResponse:
        """Map a raw Mongo document to the BacktestResponse Pydantic model."""
        if not doc:
            raise ValueError("Document not found")

        resp = {
            "id": str(doc.get("_id")),
            "symbol": doc.get("symbol"),
            "status": doc.get("status", "success"),
            "strategy": doc.get("strategy"),
            "data": doc.get("data", []),
            "metrics": doc.get("metrics", {}),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
            "total_trades": doc.get("total_trades", 0),
            "winning_trades": doc.get("winning_trades", 0),
            "losing_trades": doc.get("losing_trades", 0),
            "profit_factor": doc.get("profit_factor"),
        }
        return BacktestResponse(**resp)


# Database access layer for Backtest results
# Responsibility: CRUD operations for Backtest results in MongoDB
class BacktestDatabase:
    def __init__(self, database: AsyncIOMotorDatabase, mapper: DocumentMapper):
        self.db = database
        self.collection = self.db.backtest_data  # Collection name
        self.mapper = mapper

    async def insert_backtest(
        self, result: BacktestPydanticResult, user_id: str
    ) -> BacktestResponse:
        """
        Insert a BacktestPydanticResult instance and attach the provided user_id.
        Returns a BacktestResponse built from the stored document.

        `result` is expected to be a BacktestPydanticResult Pydantic model (the full
        backtest result produced by the backtesting run).
        """
        # prepare dict for Mongo (use alias so _id is present if available)
        doc = result.dict(by_alias=True, exclude_none=True)

        # Do not trust client-supplied _id - let Mongo generate one
        doc.pop("_id", None)

        doc["user_id"] = str(user_id)

        now = datetime.utcnow()
        doc.setdefault("created_at", now)
        doc.setdefault("updated_at", now)

        # insert and re-fetch to get canonical stored document
        insert_result = await self.collection.insert_one(doc)
        stored = await self.collection.find_one({"_id": insert_result.inserted_id})
        if not stored:
            raise ValueError("Failed to fetch stored backtest after insert")
        return self.mapper._doc_to_response(stored)

    async def delete_backtest(self, id: str, user_id: Optional[str] = None) -> bool:
        """
        Delete a backtest by its string id.

        If user_id is provided, deletion will only occur when the document's
        user_id matches (prevents deleting another user's backtest).
        Returns True when a document was deleted, False otherwise.
        """
        if not ObjectId.is_valid(id):
            return False

        query = {}
        query["_id"] = ObjectId(id)
        if user_id:
            query["user_id"] = user_id

        delete_result = await self.collection.delete_one(query)
        return delete_result.deleted_count > 0

    async def get_backtest_by_id(
        self, id: str, user_id: Optional[str] = None
    ) -> Optional[BacktestResponse]:
        """
        Fetch a single backtest by id and optionally enforce ownership by user_id.
        Returns BacktestResponse or None.
        """
        if not ObjectId.is_valid(id):
            return None
        query = {}
        query["_id"] = ObjectId(id)
        if user_id:
            # ensure provided user_id is a valid ObjectId before using it in the query
            query["user_id"] = user_id
            query["user_id"] = user_id

        doc = await self.collection.find_one(query)
        if not doc:
            return None
        return self.mapper._doc_to_response(doc)

    async def get_backtest_model_by_id(self, backtest_id: str) -> Optional[BacktestPydanticResult]:
        """Get a specific backtest by ID returning BacktestPydanticResult."""
        try:
            result = await self.collection.find_one({"_id": ObjectId(backtest_id)})
            if result:
                return self.mapper._doc_to_model(result)
            return None
        except Exception as e:
            print(f"Error fetching backtest by ID: {e}")
            return None

    async def list_backtests_for_user(self, user_id: str) -> List[BacktestResponse]:
        """
        List all backtests for a given user_id, sorted by creation date descending.
        Returns a list of BacktestResponse instances.
        """
        cursor = self.collection.find({"user_id": user_id}).sort(
            "created_at", DESCENDING
        )
        results = []
        async for doc in cursor:
            results.append(self.mapper._doc_to_response(doc))
        return results
