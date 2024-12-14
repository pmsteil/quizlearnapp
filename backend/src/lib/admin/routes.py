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
        result = db.execute(
            query.sql,
            query.params or []
        )
        
        # Convert rows to list of dicts for JSON serialization
        rows = []
        if result.rows:
            columns = [desc[0] for desc in result.columns]
            logger.info(f"Query returned columns: {columns}")
            for row in result.rows:
                row_dict = dict(zip(columns, row))
                logger.info(f"Row before processing: {row_dict}")
                
                # Map abbreviated column names to full names for users table
                if 'i' in row_dict:
                    row_dict['id'] = row_dict.pop('i')
                if 'e' in row_dict:
                    row_dict['email'] = row_dict.pop('e')
                if 'n' in row_dict:
                    row_dict['name'] = row_dict.pop('n')
                if 'r' in row_dict:
                    row_dict['roles'] = row_dict.pop('r').split(',')
                
                rows.append(row_dict)
                logger.info(f"Row after processing: {row_dict}")
                
        logger.info(f"Returning data: {rows}")
        return {"data": rows}
    except Exception as e:
        logger.error(f"Database query error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute query: {str(e)}"
        )
