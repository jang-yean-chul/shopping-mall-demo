import os
from motor.motor_asyncio import AsyncIOMotorClient

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/shopping-mall"))
    db = client.get_default_database()
    print(f"MongoDB connected (Python service)")


async def disconnect_db():
    if client:
        client.close()


def get_db():
    return db
