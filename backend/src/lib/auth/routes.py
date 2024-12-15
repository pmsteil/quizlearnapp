from fastapi import APIRouter, Depends, HTTPException, Request, Body, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional, List
from .service import AuthService, get_current_user, require_admin, AuthenticationError, row_to_dict, verify_password, get_password_hash
from .jwt import create_access_token, decode_access_token
from ..db import DatabaseError
from datetime import timedelta
from pydantic import BaseModel
import logging
import json
import traceback

# Configure route-specific logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Suppress bcrypt warning
logging.getLogger("passlib.handlers.bcrypt").setLevel(logging.ERROR)

# Create router with prefix
router = APIRouter(prefix="/auth", tags=["auth"])

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Token expiration settings
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Pydantic models
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

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str  # Changed from int to str to handle UUID
    email: str
    name: str
    roles: List[str]

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

@router.options("/login")
async def login_options():
    """Handle preflight requests for the login endpoint."""
    return {}

@router.post("/login", response_model=LoginResponse)
async def login(request: Request, credentials: LoginRequest = Body(...)):
    """Login endpoint that authenticates a user and returns a session token."""
    # Log request details
    logger.info(f"Login attempt received")
    logger.debug(f"Login credentials: email={credentials.email}")
    logger.debug(f"Request method: {request.method}")
    logger.debug(f"Request URL: {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}")
    
    try:
        # Check database connection
        logger.debug("Checking database connection")
        if not hasattr(request.app.state, "db"):
            logger.error("Database connection not initialized in app state")
            logger.debug(f"Available app state attributes: {dir(request.app.state)}")
            raise DatabaseError("Database not initialized")
        
        logger.debug("Creating AuthService instance")
        auth_service = AuthService(request.app.state.db)
        
        # Authenticate user
        logger.info(f"Attempting to authenticate user: {credentials.email}")
        user = await auth_service.authenticate_user(credentials.email, credentials.password)
        logger.debug(f"User authenticated successfully: {json.dumps({k: v for k, v in user.items() if k != 'password_hash'})}")
        
        # Create session
        logger.info(f"Creating session for user: {credentials.email}")
        session = auth_service.create_session(user["user_id"])
        
        # Create token
        token = create_access_token(
            data={"user": user},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Prepare response
        response_data = LoginResponse(
            token=token,
            user=UserResponse(
                id=user["user_id"],
                email=user["email"],
                name=user["name"],
                roles=user["roles"] if isinstance(user["roles"], list) else user["roles"].split(",")
            )
        )
        logger.info(f"Login successful for user: {credentials.email}")
        logger.debug(f"Response data: {json.dumps({k: v for k, v in response_data.dict().items() if k != 'token'})}")
        return response_data
        
    except AuthenticationError as e:
        logger.warning(f"Authentication failed for user {credentials.email}")
        logger.debug(f"Authentication error details: {str(e)}")
        logger.debug(f"Error traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except DatabaseError as e:
        logger.error(f"Database error during login")
        logger.debug(f"Database error details: {str(e)}")
        logger.debug(f"Error traceback:\n{traceback.format_exc()}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login")
        logger.debug(f"Error type: {type(e)}")
        logger.debug(f"Error details: {str(e)}")
        logger.debug(f"Error traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.post("/register", response_model=Token)
async def register(
    request: Request,
    data: RegisterRequest = None,
    email: str = None,
    password: str = None,
    name: str = None,
):
    """Register a new user."""
    logger.info("=== Register attempt ===")
    logger.info(f"Request headers: {request.headers}")
    
    # Log request body
    try:
        body = await request.body()
        logger.info(f"Raw request body: {body}")
    except Exception as e:
        logger.error(f"Error reading body: {e}")

    # Log query parameters
    logger.info(f"Query params: {request.query_params}")
    
    # Handle both form data and JSON
    if data is None:
        if not all([email, password, name]):
            logger.error("Missing required fields")
            logger.error(f"Email: {email}, Password: {'*' * len(password) if password else None}, Name: {name}")
            raise HTTPException(
                status_code=400,
                detail={
                    "error_code": "INVALID_REQUEST",
                    "message": "Missing required fields"
                }
            )
        data = RegisterRequest(email=email, password=password, name=name)
    
    logger.info(f"Processed data: {data}")

    try:
        # Get database connection from request state
        if not hasattr(request.app.state, "db"):
            logger.error("Database connection not initialized")
            raise DatabaseError("Database not initialized")
            
        auth_service = AuthService(request.app.state.db)
        user = await auth_service.register_user(
            email=data.email,
            name=data.name,
            password=data.password
        )
        
        # Create tokens
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        access_token = create_access_token(
            data={"user": {
                "user_id": user["user_id"],
                "email": user["email"],
                "name": user["name"],
                "roles": user["roles"]  # Already a list from register_user
            }},
            expires_delta=access_token_expires
        )
        refresh_token = create_access_token(
            data={"user": {
                "user_id": user["user_id"],
                "email": user["email"],
                "name": user["name"],
                "roles": user["roles"]  # Already a list from register_user
            }, "refresh": True},
            expires_delta=refresh_token_expires
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": user
        }
    except AuthenticationError as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": e.error_code,
                "message": str(e)
            }
        )
    except DatabaseError:
        # Let the global error handler handle database errors
        raise
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": "REGISTRATION_FAILED",
                "message": "An unexpected error occurred during registration"
            }
        )

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

        # Get database connection from request state
        if not hasattr(refresh_token, "app"):
            logger.error("Request object not found")
            raise Exception("Request object not found")
        if not hasattr(refresh_token.app.state, "db"):
            logger.error("Database connection not initialized")
            raise DatabaseError("Database not initialized")
            
        auth_service = AuthService(refresh_token.app.state.db)
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
        # Get database connection from request state
        if not hasattr(request.app.state, "db"):
            logger.error("Database connection not initialized")
            raise DatabaseError("Database not initialized")
            
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
            "SELECT * FROM users WHERE email = ?",
            [email]
        )
        user = result.fetchone()
        if not user:
            return {"message": "User not found"}
        
        user_dict = row_to_dict(user)
        return {
            "user": {
                "email": user_dict["email"],
                "name": user_dict["name"],
                "roles": user_dict["roles"],
                "password_hash": user_dict["password_hash"][:20] + "..."  # Only show start of hash
            }
        }
    except Exception as e:
        logger.error(f"Error in get_user_debug: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug/verify/{email}/{password}")
async def verify_password_debug(email: str, password: str, request: Request):
    """Verify password for debugging."""
    try:
        cursor = request.app.state.db.cursor()
        cursor.execute(
            "SELECT password_hash FROM users WHERE email = ?",
            [email]
        )
        user = cursor.fetchone()
        if not user:
            return {"message": "User not found"}
        
        password_hash = user[0]  # Get first column
        is_valid = verify_password(password, password_hash)
        new_hash = get_password_hash(password)  # Generate new hash for comparison
        return {
            "email": email,
            "stored_hash": password_hash,
            "new_hash": new_hash,
            "password": password,
            "is_valid": is_valid
        }
    except Exception as e:
        logger.error(f"Error in verify_password_debug: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.exception(e)
        return {
            "error": str(e),
            "type": str(type(e))
        }
