from typing import Dict, Tuple
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
import time

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = {}  # user_id -> list of timestamps
    
    def _cleanup_old_requests(self, user_id: str):
        """Remove requests older than 1 minute"""
        now = time.time()
        self.requests[user_id] = [
            ts for ts in self.requests[user_id]
            if now - ts < 60
        ]
    
    def check_rate_limit(self, user_id: str) -> bool:
        """Check if user has exceeded rate limit"""
        now = time.time()
        
        if user_id not in self.requests:
            self.requests[user_id] = []
        
        self._cleanup_old_requests(user_id)
        
        # Check if user has exceeded rate limit
        if len(self.requests[user_id]) >= self.requests_per_minute:
            return False
        
        # Add new request
        self.requests[user_id].append(now)
        return True

# Global rate limiter instance
rate_limiter = RateLimiter()

async def check_rate_limit(request: Request, user_id: str):
    """Rate limiting middleware"""
    if not rate_limiter.check_rate_limit(user_id):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )
