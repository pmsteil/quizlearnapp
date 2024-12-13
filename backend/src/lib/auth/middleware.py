from functools import wraps
from typing import Optional, List
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from .jwt import decode_token

security = HTTPBearer()

def get_current_user(token: str) -> Optional[dict]:
    """Get the current user from a JWT token."""
    try:
        payload = decode_token(token)

        if not payload:
            return None

        # Get user ID from subject
        user_id = payload.get("sub")

        # Get full user data from user claim
        user_data = payload.get("user")

        if user_data and user_id == user_data.get("id"):
            return user_data
        else:
            return None

    except JWTError:
        return None
    except Exception:
        return None

def require_auth(roles: List[str] = None):
    """Decorator to require authentication and optionally specific roles."""
    async def dependency(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> None:
        # Get the token from the credentials
        token = credentials.credentials

        try:
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

            # Set the user in request state
            request.state.user = user

        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=401,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return Depends(dependency)
