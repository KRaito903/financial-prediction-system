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
    def _doc_to_response(self, doc: dict) -> BacktestResponse:
        """Protocol for a document mapper. Defines the interface for a class responsible for mapping raw MongoDB documents to Pydantic models."""
        return BacktestResponse(**doc)

class BacktestMapper:
    def _doc_to_response(self, doc: dict) -> BacktestResponse:
        """Map a raw Mongo document to the BacktestResponse Pydantic model."""
        if not doc:
            raise ValueError("Document not found")

        resp = {
            "id": str(doc.get("_id")),
            "name": doc.get("name"),
            "symbol": doc.get("symbol"),
            "strategy": doc.get("strategy"),
            "trades": doc.get("trades", []),
            "total_return": doc.get("total_return"),
            "total_trades": doc.get("total_trades", 0),
            "winning_trades": doc.get("winning_trades", 0),
            "losing_trades": doc.get("losing_trades", 0),
            "win_rate": doc.get("result", {}).get("win_rate"),
            "result": doc.get("result", {}),
            "portfolio_values": doc.get("portfolio_values"),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
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

        # Attach/normalize user_id (store as ObjectId when possible)
        doc["user_id"] = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

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

        query = {"_id": ObjectId(id)}
        if user_id:
            # ensure provided user_id is a valid ObjectId before using it in the query
            if not ObjectId.is_valid(user_id):
                return False
            query["user_id"] = ObjectId(user_id)

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

        query = {"_id": ObjectId(id)}
        if user_id:
            # ensure provided user_id is a valid ObjectId before using it in the query
            if not ObjectId.is_valid(user_id):
                return None
            query["user_id"] = ObjectId(user_id)

        doc = await self.collection.find_one(query)
        if not doc:
            return None
        return self.mapper._doc_to_response(doc)

    async def list_backtests_for_user(
        self, user_id: str, limit: int = 50, startIdx: int = 0
    ) -> List[BacktestResponse]:
        """
        Return all backtests of a specific user.
        """
        # validate user_id and query using an ObjectId to match stored type
        if not ObjectId.is_valid(user_id):
            return []
        cursor = self.collection.find({"user_id": ObjectId(user_id)}).sort(
            "created_at", DESCENDING
        )
        if startIdx:
            cursor = cursor.skip(startIdx)
        if limit:
            cursor = cursor.limit(limit)
        docs = await cursor.to_list(
            length=limit or 100
        )  # default max length if limit is None/0
        result = [self.mapper._doc_to_response(doc) for doc in docs]
        return result
