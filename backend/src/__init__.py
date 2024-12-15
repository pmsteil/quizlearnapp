from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from src.lib.auth.routes import router as auth_router
from src.lib.topics.routes import router as topics_router
from src.lib.admin import admin_router
from src.lib.db import DatabaseError, get_db
from src.lib.error_handlers import database_error_handler
import logging
from contextlib import asynccontextmanager
import sqlite3
import traceback

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG level for detailed logging
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

logger = logging.getLogger(__name__)

# Global database connection
_db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI application"""
    global _db
    # Startup
    try:
        logger.info("Starting FastAPI application lifecycle")
        logger.debug("Initializing database connection")
        
        _db = get_db()
        logger.debug("Database connection obtained successfully")
        
        # Store in app state
        app.state.db = _db
        logger.debug("Database connection stored in app state")
        
        # Log app state for debugging
        logger.debug(f"Current app state attributes: {dir(app.state)}")
        logger.info("Application startup complete")
        
        yield
        
    except Exception as e:
        logger.error("Failed to initialize application")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        logger.debug(f"Full traceback:\n{traceback.format_exc()}")
        
        if _db:
            logger.info("Cleaning up database connection after startup error")
            try:
                _db.close()
                logger.debug("Database connection closed successfully after error")
            except Exception as close_error:
                logger.error(f"Error closing database after startup failure: {str(close_error)}")
        raise
        
    finally:
        # Shutdown
        logger.info("Application shutdown initiated")
        if _db:
            try:
                logger.debug("Attempting to close database connection")
                _db.close()
                logger.info("Database connection closed successfully")
            except Exception as e:
                logger.error(f"Error closing database connection: {str(e)}")
                logger.debug(f"Close error details:\n{traceback.format_exc()}")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register error handlers
app.add_exception_handler(DatabaseError, database_error_handler)

# Include routers
logger.debug("Registering API routers")
app.include_router(auth_router)  # Removed prefix as it's now in the router
app.include_router(topics_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
logger.debug("API routers registered successfully")

@app.get("/")
async def root():
    return {"message": "QuizLearn API is running"}