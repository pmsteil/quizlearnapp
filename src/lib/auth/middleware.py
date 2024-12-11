from functools import wraps
from typing import Optional, List
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from .jwt import decode_token
import json

security = HTTPBearer()

def get_current_user(token: str) -> Optional[dict]:
    """Get the current user from a JWT token."""
    try:
        print("\n🔍 Debug: get_current_user")
        print(f"Input token (first 30 chars): {token[:30]}...")

        payload = decode_token(token)
        print(f"Decoded payload: {json.dumps(payload, indent=2)}")

        if not payload:
            print("❌ No payload found in token")
            return None

        # Get user ID from subject
        user_id = payload.get("sub")
        print(f"User ID from subject: {user_id}")

        # Get full user data from user claim
        user_data = payload.get("user")
        print(f"User data from claim: {json.dumps(user_data, indent=2) if user_data else None}")

        if user_data and user_id == user_data.get("id"):
            print("✅ Successfully extracted user data")
            return user_data
        else:
            print("❌ User data validation failed")
            return None

    except JWTError as e:
        print(f"❌ JWT Error in get_current_user: {str(e)}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error in get_current_user: {str(e)}")
        return None

def require_auth(roles: List[str] = None):
    """Decorator to require authentication and optionally specific roles."""
    async def dependency(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> None:
        print("\n🔒 Debug: require_auth")

        # Get the token from the credentials
        token = credentials.credentials
        print(f"Received token (first 30 chars): {token[:30]}...")
        print(f"Token scheme: {credentials.scheme}")

        try:
            # Decode and verify the token
            print("Attempting to get user from token...")
            user = get_current_user(token)
            print(f"User from token: {json.dumps(user, indent=2) if user else None}")

            if not user:
                print("❌ No user found from token")
                raise HTTPException(
                    status_code=401,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Check roles if specified
            if roles:
                user_roles = user.get("roles", [])
                print(f"Checking roles - User has: {user_roles}, Required: {roles}")
                if not any(role in user_roles for role in roles):
                    print("❌ User does not have required roles")
                    raise HTTPException(
                        status_code=403,
                        detail="Not enough permissions",
                    )
                print("✅ Role check passed")

            # Set the user in request state
            request.state.user = user
            print("✅ User set in request state")
            print(f"Final user state: {json.dumps(user, indent=2)}")

        except JWTError as e:
            print(f"❌ JWT validation error: {str(e)}")
            raise HTTPException(
                status_code=401,
                detail=f"Token validation failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            print(f"❌ Unexpected error in require_auth: {str(e)}")
            raise HTTPException(
                status_code=401,
                detail=f"Authentication error: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return Depends(dependency)
