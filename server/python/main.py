from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import connect_db, disconnect_db
from routers import recommendations, analytics

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(title="Shopping Mall Python Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/health")
async def health():
    return {"status": "ok"}
