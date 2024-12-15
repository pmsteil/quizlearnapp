from fastapi import Request
from fastapi.responses import JSONResponse
from .db import DatabaseError

async def database_error_handler(request: Request, exc: DatabaseError):
    """Handle database errors with a user-friendly message"""
    return JSONResponse(
        status_code=503,  # Service Unavailable
        content={
            "error": "DATABASE_ERROR",
            "message": "Data currently unavailable, please try again later"
        }
    )
