from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from libsql_client import create_client
from dotenv import load_dotenv
import os
from src.lib.auth.routes import router as auth_router

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
        # Get Turso credentials from environment
        db_url = os.getenv('VITE_LIBSQL_DB_URL')
        auth_token = os.getenv('VITE_LIBSQL_DB_AUTH_TOKEN')

        if not db_url or not auth_token:
            raise ValueError("Database URL and auth token must be set in environment variables")

        # Create database client
        request.app.state.db = create_client(
            url=db_url,
            auth_token=auth_token
        )

    response = await call_next(request)
    return response

# Include routers
app.include_router(auth_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}
