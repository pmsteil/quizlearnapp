from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..services.log_service import log_message

router = APIRouter()

class LogEntry(BaseModel):
    level: str
    message: str
    timestamp: Optional[str] = None

@router.post("/api/log")
async def log_frontend_message(entry: LogEntry):
    """Endpoint to receive and log frontend messages"""
    try:
        log_message(entry.level, entry.message, entry.timestamp)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
