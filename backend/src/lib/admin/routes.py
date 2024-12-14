from fastapi import APIRouter, Depends, HTTPException
from src.lib.auth.service import get_current_user, require_admin
from pydantic import BaseModel
from typing import Optional, List, Any
import logging
from src.lib.db import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

class DatabaseQuery(BaseModel):
    sql: str
    params: Optional[List[Any]] = None

@router.post("/db/query")
async def execute_query(query: DatabaseQuery, current_user = Depends(require_admin)):
    """Execute a database query. Only accessible by admin users."""
    try:
        db = get_db()
        
        logger.info(f"Executing query: {query.sql} with params: {query.params}")
        try:
            result = db.execute(
                query.sql,
                query.params or []
            )
        except Exception as e:
            logger.error(f"Error executing query: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        # Convert rows to list of dicts for JSON serialization
        rows = []
        if result.rows:
            columns = [desc[0] for desc in result.columns]
            logger.info(f"Query returned columns: {columns}")
            for row in result.rows:
                row_dict = dict(zip(columns, row))
                logger.info(f"Row before processing: {row_dict}")
                
                # Map abbreviated column names to full names
                column_map = {
                    'i': 'id',
                    'u': 'updated_at',
                    't': 'title',
                    'd': 'description',
                    'p': 'progress',
                    'l': 'lesson_plan',
                    'c': 'created_at',
                    'ui': 'user_id',
                    'e': 'email',
                    'n': 'name',
                    'r': 'roles',
                    'ph': 'password_hash',
                    'fa': 'failed_attempts',
                    'lf': 'last_failed_attempt',
                    'ti': 'topic_id',
                    'qi': 'question_id',
                    'ic': 'is_correct'
                }
                
                # Create a new dict with mapped column names
                mapped_dict = {}
                for key, value in row_dict.items():
                    new_key = column_map.get(key, key)  # Use original key if no mapping exists
                    mapped_dict[new_key] = value
                
                # Convert roles string to array if present
                if 'roles' in mapped_dict and isinstance(mapped_dict['roles'], str):
                    mapped_dict['roles'] = mapped_dict['roles'].split(',')
                
                rows.append(mapped_dict)
                logger.info(f"Row after processing: {mapped_dict}")
                
        logger.info(f"Returning data: {rows}")
        return {"data": rows}
    except Exception as e:
        logger.error(f"Database query error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute query: {str(e)}"
        )
