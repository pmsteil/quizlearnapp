from datetime import timedelta
from typing import Optional, Dict, Any
import sqlite3
import uuid
import time
from functools import wraps
from fastapi import HTTPException, Request, Depends
import logging
import json
from ..db import get_db, row_to_dict, DatabaseError
from .jwt import verify_password, create_access_token, get_password_hash, decode_access_token

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
    logger.info(f"Authorization header: {auth_header}")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Missing or invalid authorization header")
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.split(" ")[1]
    try:
        logger.info("Decoding token...")
        payload = decode_access_token(token)
        logger.info(f"Token payload: {payload}")
        user = payload.get("user", {})
        logger.info(f"User from token: {user}")
        return user
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.exception(e)
        raise HTTPException(status_code=401, detail="Invalid authentication token")

async def require_admin(request: Request):
    """Require that the current user has admin role."""
    user = await get_current_user(request)
    logger.info(f"Checking admin access for user: {user}")
    if not user or "role_admin" not in user.get("roles", []):
        logger.warning(f"User {user.get('email') if user else 'unknown'} attempted admin access without role_admin")
        logger.warning(f"User roles: {user.get('roles', []) if user else []}")
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
                user = payload.get("user", {})
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
    def __init__(self, db_client: sqlite3.Connection = None):
        if db_client is None:
            raise DatabaseError("Database connection required")
        self.db = db_client
        self.session_timeout = timedelta(hours=24)  # Default session timeout

    async def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate a user with email and password."""
        try:
            logger.info(f"Looking up user with email: {email}")
            user = self._find_user(email)
            logger.info(f"Found user: {bool(user)}")
            if user:
                logger.info(f"User data: {json.dumps({k:v for k,v in user.items() if k != 'password_hash'})}")
                logger.info(f"Stored password hash: {user['password_hash']}")
            
            if not user:
                logger.warning(f"User not found: {email}")
                raise AuthenticationError("Invalid email or password", "INVALID_CREDENTIALS")

            logger.info(f"Verifying password (hash: {user['password_hash']})")
            if not verify_password(password, user["password_hash"]):  # Use the JWT module's verify_password
                logger.warning(f"Invalid password for user: {email}")
                raise AuthenticationError("Invalid email or password", "INVALID_CREDENTIALS")

            # Don't include password hash in response
            user.pop("password_hash", None)
            if isinstance(user["roles"], str):
                user["roles"] = user["roles"].split(",") if user["roles"] else []
                
            return user

        except sqlite3.Error as e:
            logger.error(f"Database error in authenticate_user: {str(e)}")
            raise DatabaseError("Database error occurred")

    async def login(self, email: str, password: str) -> dict:
        """Login a user and return a JWT token."""
        try:
            db = get_db()
            cursor = db.cursor()

            # Get user from database
            cursor.execute(
                "SELECT * FROM users WHERE email = ?",
                (email,)
            )
            user = cursor.fetchone()

            if not user or not verify_password(password, user['password_hash']):
                raise AuthenticationError("Invalid email or password", "INVALID_CREDENTIALS")

            # Create session
            session_id = str(uuid.uuid4())
            expires_at = int(time.time()) + (24 * 60 * 60)  # 24 hours from now

            cursor.execute(
                "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                (session_id, user['user_id'], int(time.time()), expires_at)
            )
            db.commit()

            return {
                'session_id': session_id,
                'user': row_to_dict(user)
            }
        except sqlite3.Error as e:
            # Re-raise database errors to be caught by global handler
            raise
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            raise AuthenticationError("Invalid email or password", "INVALID_CREDENTIALS")
        finally:
            if 'db' in locals():
                db.close()

    def _find_user(self, email: str) -> Dict[str, Any]:
        """Find a user by email."""
        try:
            logger.debug(f"Looking up user with email: {email}")
            cursor = self.db.cursor()
            cursor.execute(
                "SELECT * FROM users WHERE email = ?",
                (email,)
            )
            user = cursor.fetchone()
            logger.debug(f"Found user: {user is not None}")
            if user:
                user_dict = row_to_dict(user)
                logger.debug(f"User data: {json.dumps({k: v for k, v in user_dict.items() if k != 'password_hash'})}")
                return user_dict
            return None
        except sqlite3.Error as e:
            logger.error(f"Database error in _find_user: {str(e)}")
            raise DatabaseError("Database error occurred")

    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against a password hash."""
        try:
            logger.debug(f"Verifying password (hash: {password_hash[:10]}...)")
            result = verify_password(password, password_hash)
            logger.debug(f"Password verification result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error in verify_password: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

    def _record_failed_attempt(self, user: Dict[str, Any]) -> None:
        """Record a failed login attempt."""
        try:
            # TO DO: implement recording failed login attempts
            pass

        except Exception as e:
            logger.error(f"Error in record_failed_attempt: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

    def create_session(self, user_id: str) -> Dict[str, Any]:
        """Create a new session for a user."""
        try:
            session_id = str(uuid.uuid4())
            expires_at = int(time.time()) + int(self.session_timeout.total_seconds())

            self.db.execute(
                "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                (session_id, user_id, int(time.time()), expires_at)
            )
            self.db.commit()

            return {
                'session_id': session_id,
                'expires_at': expires_at
            }
        except sqlite3.Error as e:
            logger.error(f"Database error in create_session: {str(e)}")
            raise DatabaseError("Failed to create session")

    def _generate_token(self, session: Dict[str, Any]) -> str:
        """Generate a JWT token for a session."""
        try:
            return create_access_token(
                data={"user": {
                    "user_id": session["user_id"],
                    "email": session["email"],
                    "name": session["name"],
                    "roles": session["roles"],
                    "session_id": session["id"]
                }},
                expires_delta=self.session_timeout
            )

        except Exception as e:
            logger.error(f"Error in generate_token: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

    def invalidate_session(self, session_id: str) -> None:
        """Invalidate a user session (logout)"""
        try:
            self.db.execute("""
                DELETE FROM sessions
                WHERE id = ?
            """, [session_id])
            self.db.commit()
        except sqlite3.Error as e:
            raise AuthenticationError("Failed to invalidate session", "SESSION_ERROR")

    def verify_session(self, session_id: str) -> bool:
        """Verify if a session is valid and not expired"""
        try:
            cursor = self.db.execute("""
                SELECT * FROM sessions
                WHERE id = ? AND expires_at > ?
            """, [session_id, int(time.time())])
            return bool(cursor.fetchone())
        except sqlite3.Error as e:
            return False

    async def register_user(self, email: str, name: str, password: str, roles: str = "role_user") -> Dict[str, Any]:
        """Register a new user."""
        try:
            logger.info(f"Registering user: {email}, password")
            # Check if user already exists
            existing_users = self.db.execute(
                "SELECT COUNT(*) as count FROM users WHERE email = ?", (email,)
            ).fetchone()
            logger.info(f"Existing users with email {email}: {existing_users['count']}")

            if existing_users["count"] > 0:
                raise AuthenticationError("User already exists", "USER_EXISTS")

            user_id = str(uuid.uuid4())
            password_hash = get_password_hash(password)
            logger.info(f"Generated user_id: {user_id}, password_hash: {password_hash[:20]}...")

            logger.info("Inserting user into database")
            self.db.execute(
                """
                INSERT INTO users (user_id, email, name, password_hash, roles)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, email, name, password_hash, roles),
            )
            self.db.commit()
            logger.info("User inserted successfully")

            # Return the user data without password hash
            user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "roles": roles.split(",") if isinstance(roles, str) else roles
            }
            return user

        except sqlite3.Error as e:
            logger.error(f"Database error in register_user: {str(e)}")
            raise DatabaseError("Database error occurred")

    def list_users(self) -> list:
        """List all users."""
        try:
            cursor = self.db.execute("SELECT * FROM users")
            users = [dict(user) for user in cursor.fetchall()]

            # Convert to API format
            return [{
                "user_id": user["user_id"],
                "email": user["email"],
                "name": user["name"],
                "roles": user["roles"].split(","),
                "created_at": user["created_at"],
                "updated_at": user["updated_at"]
            } for user in users]
        except sqlite3.Error as e:
            raise AuthenticationError("Failed to list users", "DATABASE_ERROR")
        except Exception as e:
            raise AuthenticationError("Internal server error", "INTERNAL_ERROR")
