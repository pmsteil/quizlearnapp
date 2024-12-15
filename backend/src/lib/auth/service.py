from datetime import timedelta
from typing import Optional, Dict, Any
import sqlite3
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
        return payload.get("user", {})
    except Exception as e:
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
    def __init__(self, db_client: sqlite3.Connection):
        self.db = db_client
        self.session_timeout = timedelta(hours=24)  # Default session timeout

    async def authenticate_user(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate a user with username and password."""
        try:
            logger.info(f"Authenticating user: {username}")
            # Get user from database
            logger.info("Executing query to find user")
            cursor = self.db.execute(
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
            logger.info("Query executed, fetching result")
            user = cursor.fetchone()
            logger.info(f"Raw database result: {[dict(row) for row in cursor.execute('SELECT * FROM users')]}")
            logger.info(f"Database query result for {username}: {user}")
            
            if not user:
                logger.warning(f"User not found: {username}")
                raise AuthenticationError("Invalid credentials", "INVALID_CREDENTIALS")

            # Convert Row to dict and create session
            user_dict = {
                "user_id": user["user_id"],
                "email": user["email"],
                "name": user["name"],
                "password_hash": user["password_hash"],
                "roles": user["roles"].split(",") if user["roles"] else []
            }
            logger.info(f"Found user: {user_dict}")
            logger.info(f"Password hash from DB: {user_dict['password_hash']}")
            logger.info(f"Input password: {password}")

            # Verify password
            is_valid = verify_password(password, user_dict["password_hash"])
            logger.info(f"Password verification result: {is_valid}")
            if not is_valid:
                logger.warning(f"Invalid password for user: {username}")
                raise AuthenticationError("Invalid credentials", "INVALID_CREDENTIALS")

            # Create session
            session = self._create_session(user_dict)
            
            # Create access token with session
            access_token = create_access_token(
                data={"user": {
                    "user_id": user_dict["user_id"],
                    "email": user_dict["email"],
                    "name": user_dict["name"],
                    "roles": user_dict["roles"],
                    "session_id": session["id"]
                }},
                expires_delta=self.session_timeout
            )

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "user_id": user_dict["user_id"],
                    "email": user_dict["email"],
                    "name": user_dict["name"],
                    "roles": user_dict["roles"]
                }
            }

        except AuthenticationError:
            raise
        except Exception as e:
            logger.error(f"Error in authenticate_user: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate a user and create a session."""
        try:
            logger.info(f"Logging in user: {email}")
            # Find the user
            user = self._find_user(email)
            logger.info(f"Found user: {user}")
            if not user:
                raise AuthenticationError("Invalid email or password")

            # Verify the password
            if not self._verify_password(password, user["password_hash"]):
                self._record_failed_attempt(user)
                raise AuthenticationError("Invalid email or password")

            # Create a session
            logger.info("Creating session...")
            session = self._create_session(user)
            logger.info(f"Session created: {session}")

            # Generate JWT token
            token = self._generate_token(session)
            logger.info("Token generated")

            # Create response
            response = {
                "token": token,
                "user": {
                    "id": session["user_id"],
                    "email": session["email"],
                    "name": session["name"],
                    "roles": session["roles"]
                }
            }
            logger.info(f"Returning response: {response}")
            return response

        except AuthenticationError:
            raise
        except Exception as e:
            logger.error(f"Error in login: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error args: {e.args}")
            logger.exception(e)
            raise

    def _find_user(self, email: str) -> Dict[str, Any]:
        """Find a user by email."""
        try:
            cursor = self.db.execute(
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
                [email]
            )
            user = cursor.fetchone()
            if not user:
                return None

            return {
                "user_id": user["user_id"],
                "email": user["email"],
                "name": user["name"],
                "password_hash": user["password_hash"],
                "roles": user["roles"].split(",") if user["roles"] else []
            }

        except sqlite3.Error as e:
            logger.error(f"Database select failed: {str(e)}")
            raise AuthenticationError("Failed to retrieve user", "DATABASE_ERROR")

    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against a password hash."""
        try:
            return verify_password(password, password_hash)

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

    def _create_session(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new session for a user."""
        try:
            logger.info(f"Creating session for user: {user}")
            session_id = str(uuid.uuid4())
            current_time = int(time.time())
            expires_at = current_time + int(self.session_timeout.total_seconds())

            self.db.execute("""
                INSERT INTO sessions (
                    id, user_id, created_at, expires_at
                ) VALUES (?, ?, ?, ?)
            """, [
                session_id,
                user["user_id"],
                current_time,
                expires_at
            ])
            self.db.commit()

            # Return session with user info needed for token generation
            session = {
                "id": session_id,
                "user_id": user["user_id"],
                "email": user["email"],
                "name": user["name"],
                "roles": user["roles"],
                "created_at": current_time,
                "expires_at": expires_at
            }
            logger.info(f"Created session: {session}")
            return session

        except sqlite3.Error as e:
            logger.error(f"Database error in create_session: {str(e)}")
            raise AuthenticationError("Failed to create session", "DATABASE_ERROR")
        except Exception as e:
            logger.error(f"Unexpected error in create_session: {str(e)}")
            raise AuthenticationError("Failed to create session", "INTERNAL_ERROR")

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
            # Check if user already exists
            cursor = self.db.execute(
                "SELECT COUNT(*) as count FROM users WHERE email = ?",
                [email]
            )
            if cursor.fetchone()["count"] > 0:
                raise AuthenticationError("User already exists", "USER_EXISTS")

            # Create user
            user_id = str(uuid.uuid4())
            current_time = int(time.time())
            password_hash = get_password_hash(password)

            try:
                self.db.execute("""
                    INSERT INTO users (
                        user_id, email, name, password_hash, roles,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, [
                    user_id, email, name, password_hash, roles,
                    current_time, current_time
                ])
                self.db.commit()

                # Return user data
                return {
                    "user_id": user_id,
                    "email": email,
                    "name": name,
                    "roles": roles.split(",")
                }

            except sqlite3.Error as e:
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
