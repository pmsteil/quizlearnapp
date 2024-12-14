from datetime import timedelta
from typing import Optional, Dict, Any
from libsql_client import Client, LibsqlError
from .jwt import verify_password, create_access_token, get_password_hash, decode_access_token
from ..db import row_to_dict
import uuid
import time
from functools import wraps
from fastapi import HTTPException, Request, Depends
import logging

logger = logging.getLogger(__name__)

class AuthenticationError(Exception):
    """Custom exception for authentication errors"""
    def __init__(self, message: str, error_code: str):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

async def get_current_user(request: Request):
    """Get the current authenticated user from the request."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.split(" ")[1]
    try:
        payload = decode_access_token(token)
        return payload["user"]
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

async def require_admin(request: Request):
    """Require that the current user has admin role."""
    user = await get_current_user(request)
    logger.info(f"Checking admin access for user: {user}")
    if "role_admin" not in user.get("roles", []):
        logger.warning(f"User {user.get('email')} attempted admin access without role_admin")
        logger.warning(f"User roles: {user.get('roles', [])}")
        raise HTTPException(status_code=403, detail="Admin role required")
    return user

def requires_auth(roles=None):
    """Decorator for endpoints that require authentication and specific roles."""
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

            token = auth_header.split(" ")[1]
            try:
                payload = decode_access_token(token)
                user = payload["user"]
                user_roles = user.get("roles", [])
                if isinstance(user_roles, str):
                    user_roles = user_roles.split(",")

                if roles and not any(role in user_roles for role in roles):
                    raise HTTPException(
                        status_code=403,
                        detail={"error_code": "FORBIDDEN", "message": "Insufficient permissions"}
                    )

                # Verify session is still valid
                session_id = user.get("session_id")
                if session_id:
                    result = request.app.state.db.execute(
                        """
                        SELECT * FROM sessions
                        WHERE id = ? AND expires_at > ?
                        """,
                        [session_id, int(time.time())]
                    )
                    if not result.rows:
                        raise HTTPException(
                            status_code=401,
                            detail="Session expired"
                        )

                return await func(request, *args, **kwargs)
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=401, detail="Invalid token")
        return wrapper
    return decorator

class AuthService:
    def __init__(self, db_client: Client):
        self.db = db_client
        self.session_timeout = timedelta(hours=24)  # Default session timeout

    async def authenticate_user(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate a user with username and password."""
        try:
            logger.info(f"Authenticating user: {username}")
            # Get user from database
            result = self.db.execute(
                """
                SELECT 
                    user_id,
                    email,
                    name,
                    password_hash,
                    roles
                FROM users
                WHERE email = ?
                """,
                [username]
            )
            logger.info(f"Database query result: {result.rows}")
            if not result.rows:
                logger.warning(f"User not found: {username}")
                raise AuthenticationError("Invalid credentials", "INVALID_CREDENTIALS")

            user = row_to_dict(result.rows[0])
            logger.info(f"Found user: {user}")
            logger.info(f"Password hash from DB: {user['password_hash']}")
            logger.info(f"Input password: {password}")

            # Verify password
            is_valid = verify_password(password, user["password_hash"])
            logger.info(f"Password verification result: {is_valid}")
            if not is_valid:
                logger.warning(f"Invalid password for user: {username}")
                # Update failed attempts
                current_time = int(time.time())
                self.db.execute(
                    """
                    UPDATE users
                    SET failed_attempts = failed_attempts + 1,
                        last_failed_attempt = ?
                    WHERE email = ?
                    """,
                    [current_time, username]
                )
                raise AuthenticationError("Invalid credentials", "INVALID_CREDENTIALS")

            logger.info(f"Password verified successfully for user: {username}")

            # Clean user object - ensure we use user_id consistently
            clean_user = {
                "user_id": user["user_id"],  
                "email": user["email"],
                "name": user["name"],
                "roles": user["roles"].split(",") if user["roles"] else []
            }

            logger.info(f"Authentication successful for user: {username}")
            return clean_user

        except AuthenticationError:
            raise
        except Exception as e:
            logger.error(f"Authentication error for user {username}: {str(e)}")
            raise AuthenticationError(str(e), "AUTHENTICATION_ERROR")

    def _create_session(self, user: Dict[str, Any]) -> dict:
        """Create a new session for the user"""
        try:
            session_id = str(uuid.uuid4())
            current_time = int(time.time())

            # Store session in database
            self.db.execute("""
                INSERT INTO sessions (id, user_id, created_at, expires_at)
                VALUES (?, ?, ?, ?)
            """, [
                session_id,
                user["user_id"],
                current_time,
                current_time + int(self.session_timeout.total_seconds())
            ])

            # Create access token
            user_data = {
                "user_id": user["user_id"],
                "email": user["email"],
                "name": user["name"],
                "roles": user["roles"].split(","),
                "session_id": session_id
            }

            access_token = create_access_token(
                data={
                    "sub": user["user_id"],
                    "user": user_data,
                    "session_id": session_id
                },
                expires_delta=self.session_timeout
            )

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user_data,
                "expires_in": int(self.session_timeout.total_seconds())
            }
        except LibsqlError as e:
            raise AuthenticationError("Failed to create session", "SESSION_ERROR")

    def invalidate_session(self, session_id: str) -> None:
        """Invalidate a user session (logout)"""
        try:
            self.db.execute("""
                DELETE FROM sessions
                WHERE id = ?
            """, [session_id])
        except LibsqlError as e:
            raise AuthenticationError("Failed to invalidate session", "SESSION_ERROR")

    def verify_session(self, session_id: str) -> bool:
        """Verify if a session is valid and not expired"""
        try:
            result = self.db.execute("""
                SELECT * FROM sessions
                WHERE id = ? AND expires_at > ?
            """, [session_id, int(time.time())])
            return bool(result.rows)
        except LibsqlError as e:
            return False

    def register_user(self, username: str, password: str, name: str) -> dict:
        """Register a new user."""
        try:
            # Check if user exists
            result = self.db.execute("SELECT user_id FROM users WHERE email = ?", [username])
            if result.rows:
                logger.warning(f"User already exists: {username}")
                raise AuthenticationError("User already exists", "USER_EXISTS")

            # Hash password
            try:
                password_hash = get_password_hash(password)
            except Exception as e:
                logger.error(f"Password hashing failed: {str(e)}")
                raise AuthenticationError("Invalid password", "INVALID_PASSWORD")

            # Generate user ID and timestamps
            user_id = str(uuid.uuid4())
            current_time = int(time.time())

            # Insert user with clean slate (remove failed attempts fields)
            try:
                self.db.execute("""
                    INSERT INTO users (
                        user_id, email, name, password_hash, roles,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, [user_id, username, name, password_hash, "role_user", current_time, current_time])
            except LibsqlError as e:
                logger.error(f"Database insert failed: {str(e)}")
                raise AuthenticationError("Failed to create user", "DATABASE_ERROR")

            # Get the created user
            try:
                result = self.db.execute("SELECT * FROM users WHERE user_id = ?", [user_id])
                if not result.rows:
                    logger.error("User not found after creation")
                    raise AuthenticationError("Failed to create user", "USER_NOT_FOUND")

                user = row_to_dict(result.rows[0])
                if not user:
                    logger.error("Failed to convert user row to dict")
                    raise AuthenticationError("Failed to create user", "DATA_CONVERSION_ERROR")

                # Create session and return token
                return self._create_session(user)
            except LibsqlError as e:
                logger.error(f"Database select failed: {str(e)}")
                raise AuthenticationError("Failed to retrieve user", "DATABASE_ERROR")

        except AuthenticationError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in register_user: {str(e)}")
            raise AuthenticationError("Internal server error", "INTERNAL_ERROR")

    def list_users(self) -> list:
        """List all users."""
        try:
            result = self.db.execute("SELECT * FROM users")
            users = [row_to_dict(row) for row in result.rows]

            # Convert to API format
            return [{
                "user_id": user["user_id"],
                "email": user["email"],
                "name": user["name"],
                "roles": user["roles"].split(","),
                "created_at": user["created_at"],
                "updated_at": user["updated_at"]
            } for user in users]
        except LibsqlError as e:
            raise AuthenticationError("Failed to list users", "DATABASE_ERROR")
        except Exception as e:
            raise AuthenticationError("Internal server error", "INTERNAL_ERROR")
