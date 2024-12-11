from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from libsql_client import create_client_sync
from dotenv import load_dotenv
import os
from src.lib.auth.routes import router as auth_router
from src.lib.users.routes import router as users_router
from src.lib.auth.service import AuthService
from src.lib.db import get_db, get_test_db

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(title="QuizLearn API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection middleware
@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    if not hasattr(request.app.state, "db"):
        # Use test database if it's set in dependency overrides
        db_func = app.dependency_overrides.get(get_db, get_db)
        request.app.state.db = db_func()
        request.app.state.auth_service = AuthService(request.app.state.db)

    response = await call_next(request)
    return response

# Include routers
app.include_router(auth_router)
app.include_router(users_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}
