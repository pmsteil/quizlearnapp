from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional
from .service import AuthService, get_current_user, require_admin, AuthenticationError, row_to_dict, verify_password
from .jwt import create_access_token, decode_access_token
from datetime import timedelta
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Token expiration settings
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 30

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user: dict

class TokenData(BaseModel):
    username: Optional[str] = None

class LogoutRequest(BaseModel):
    refresh_token: str

@router.options("/login")
async def login_options():
    """Handle preflight requests for the login endpoint."""
    return {}

@router.post("/login", response_model=Token)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint that returns an access token."""
    try:
        logger.info(f"Login attempt for username: {form_data.username}")
        logger.info(f"Raw form data: username={form_data.username}, password length={len(form_data.password)}")
        auth_service = AuthService(request.app.state.db)
        
        # Log form data for debugging
        logger.info(f"Form data - username: {form_data.username}, password length: {len(form_data.password)}")
        
        user = await auth_service.authenticate_user(form_data.username, form_data.password)
        
        if not user:
            logger.warning(f"Authentication failed: user not found or invalid password for {form_data.username}")
            raise HTTPException(
                status_code=401,
                detail={
                    "error_code": "INVALID_CREDENTIALS",
                    "message": "Incorrect username or password"
                },
                headers={"WWW-Authenticate": "Bearer"},
            )

        logger.info(f"Authentication successful for user: {user['email']}")

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["user_id"], "user": user},
            expires_delta=access_token_expires
        )

        # Create refresh token
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_access_token(
            data={"sub": user["user_id"], "type": "refresh"},
            expires_delta=refresh_token_expires
        )

        response_data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
            "user": user
        }
        logger.info(f"Login successful for user: {user['email']}")
        return response_data

    except AuthenticationError as e:
        logger.warning(f"Authentication failed: {e.message} (code: {e.error_code})")
        raise HTTPException(
            status_code=401,
            detail={
                "error_code": e.error_code,
                "message": e.message
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error during login for {form_data.username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": "LOGIN_FAILED",
                "message": str(e)
            }
        )

@router.post("/register", response_model=Token)
async def register(username: str, password: str, name: str):
    """Register a new user."""
    auth_service = AuthService()
    user = await auth_service.register_user(username, password, name)
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="User registration failed",
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["user_id"], "user": user},
        expires_delta=access_token_expires
    )

    # Create refresh token
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_access_token(
        data={"sub": user["user_id"], "type": "refresh"},
        expires_delta=refresh_token_expires
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        "user": user
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str):
    """Get a new access token using a refresh token."""
    try:
        payload = decode_access_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token",
            )

        auth_service = AuthService()
        user = await auth_service.get_user_by_id(payload["sub"])
        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found",
            )

        # Create new access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["user_id"], "user": user},
            expires_delta=access_token_expires
        )

        # Create new refresh token
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        new_refresh_token = create_access_token(
            data={"sub": user["user_id"], "type": "refresh"},
            expires_delta=refresh_token_expires
        )

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
            "user": user
        }

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
        )

@router.post("/logout")
async def logout(request: LogoutRequest):
    """Logout a user by invalidating their refresh token."""
    # In a production system, you would want to blacklist the refresh token
    return {"message": "Successfully logged out"}

@router.get("/users")
async def list_users(request: Request):
    """List all users (for debugging)."""
    try:
        result = request.app.state.db.execute(
            "SELECT user_id, email, name, roles FROM users"
        )
        users = [row_to_dict(row) for row in result.rows]
        return {"users": users}
    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": "DATABASE_ERROR",
                "message": str(e)
            }
        )

@router.get("/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get the current user's information."""
    return current_user

@router.get("/debug/user/{email}")
async def get_user_debug(email: str, request: Request):
    """Get user details for debugging."""
    try:
        result = request.app.state.db.execute(
            "SELECT user_id, email, name, password_hash, roles FROM users WHERE email = ?",
            [email]
        )
        if not result.rows:
            raise HTTPException(status_code=404, detail="User not found")
        user = row_to_dict(result.rows[0])
        return user
    except Exception as e:
        logger.error(f"Error getting user debug info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": "DATABASE_ERROR",
                "message": str(e)
            }
        )

@router.get("/debug/verify/{email}/{password}")
async def verify_password_debug(email: str, password: str, request: Request):
    """Verify password for debugging."""
    try:
        result = request.app.state.db.execute(
            "SELECT password_hash FROM users WHERE email = ?",
            [email]
        )
        if not result.rows:
            return {"verified": False, "error": "User not found"}
        
        password_hash = result.rows[0][0]
        verified = verify_password(password, password_hash)
        return {
            "verified": verified,
            "password": password,
            "hash": password_hash
        }
    except Exception as e:
        logger.error(f"Error verifying password: {str(e)}")
        return {"verified": False, "error": str(e)}
