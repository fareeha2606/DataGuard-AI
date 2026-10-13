from datetime import datetime, timezone
from typing import Any
from app.config import settings

try:
    from pymongo import MongoClient
except Exception:
    MongoClient = None

class Store:
    def __init__(self):
        self.client = None
        self.db = None
        self.mem = {"datasets": {}, "events": []}
        if settings.mongo_uri and MongoClient:
            try:
                self.client = MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=3000)
                self.client.admin.command("ping")
                self.db = self.client[settings.mongo_db]
            except Exception:
                self.client = self.db = None

    def put_dataset(self, doc: dict):
        if self.db is not None:
            self.db.datasets.replace_one({"_id": doc["id"]}, {**doc, "_id": doc["id"]}, upsert=True)
        self.mem["datasets"][doc["id"]] = doc

    def get_dataset(self, did: str):
        if self.db is not None:
            x = self.db.datasets.find_one({"_id": did}, {"_id": 0})
            if x: return x
        return self.mem["datasets"].get(did)

    def all_datasets(self):
        if self.db is not None:
            return list(self.db.datasets.find({}, {"_id": 0}).sort("created_at", -1))
        return sorted(self.mem["datasets"].values(), key=lambda x:x.get("created_at", ""), reverse=True)

    def event(self, did: str, kind: str, payload: dict):
        e={"dataset_id":did,"kind":kind,"payload":payload,"created_at":datetime.now(timezone.utc).isoformat()}
        if self.db is not None: self.db.events.insert_one(e)
        self.mem["events"].append(e)

store=Store()
