from functools import wraps
from typing import Optional, List
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .jwt import decode_token

security = HTTPBearer()

def get_current_user(token: str) -> Optional[dict]:
    """Get the current user from a JWT token."""
    payload = decode_token(token)
    if payload is None:
        return None
    return payload.get("sub")

def require_auth(roles: List[str] = None):
    """Decorator to require authentication and optionally specific roles."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = next((arg for arg in args if isinstance(arg, Request)), None)
            if not request:
                raise HTTPException(status_code=500, detail="Request object not found")

            # Get the token from the request
            try:
                credentials: HTTPAuthorizationCredentials = await security(request)
                token = credentials.credentials
            except:
                raise HTTPException(
                    status_code=401,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Decode and verify the token
            user = get_current_user(token)
            if not user:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Check roles if specified
            if roles:
                user_roles = user.get("roles", [])
                if not any(role in user_roles for role in roles):
                    raise HTTPException(
                        status_code=403,
                        detail="Not enough permissions",
                    )

            # Add user to request state
            request.state.user = user
            return await func(*args, **kwargs)
        return wrapper
    return decorator
