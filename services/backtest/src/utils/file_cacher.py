from .mongodb_connector import client
from typing import Optional
import datetime
import os


class FileCacher:
    # Singleton instance
    _instance = None
    _initialized = False

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(FileCacher, cls).__new__(cls)
        return cls._instance

    def __init__(self, collection_name: str = "file_cache"):
        if self._initialized:
            return
        self.client = client
        self.collection = self.client.Backtests[collection_name]
        self._initialized = True

    async def cache_file(self, file_id: str, file_path: str):
        """Cache a file path with a unique file ID."""
        await self.collection.update_one(
            {"file_id": file_id},
            {"$set": {"file_path": file_path, "last_used": datetime.datetime.utcnow()}},
            upsert=True,
        )

    async def get_cached_file(self, file_id: str) -> Optional[str]:
        """Retrieve a cached file path by its file ID."""
        document = await self.collection.find_one({"file_id": file_id})
        return document["file_path"] if document else None

    async def remove_unused_caches(self):
        """Remove all cached files not used in the last 24 hours."""
        cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
        files_to_delete = await self.collection.find(
            {"last_used": {"$lt": cutoff_time}}
        ).to_list(length=None)
        await self.collection.delete_many({"last_used": {"$lt": cutoff_time}})
        for file in files_to_delete:
            try:
                os.remove(file["file_path"])
            except FileNotFoundError:
                pass


# Singleton global instance
file_cacher = FileCacher()
