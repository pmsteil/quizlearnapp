from datetime import timedelta
from typing import Optional, Dict, Any
from libsql_client import Client, LibsqlError
from .jwt import verify_password, create_access_token, get_password_hash
from src.lib.db import row_to_dict
import uuid
import time

class AuthenticationError(Exception):
    """Custom exception for authentication errors"""
    def __init__(self, message: str, error_code: str):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class AuthService:
    def __init__(self, db_client: Client):
        self.db = db_client
        self.session_timeout = timedelta(hours=24)  # Default session timeout
        self.max_failed_attempts = 5
        self.lockout_duration = timedelta(minutes=15)

    def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """Authenticate a user and return an access token."""
        try:
            print(f"Authenticating user: {email}")
            # Check for account lockout
            if self._is_account_locked(email):
                print(f"Account locked: {email}")
                raise AuthenticationError(
                    "Account is temporarily locked due to too many failed attempts",
                    "ACCOUNT_LOCKED"
                )

            # Get user from database
            result = self.db.execute("SELECT * FROM users WHERE email = ?", [email])
            print(f"User query result: {result.rows}")
            if not result.rows:
                print(f"User not found: {email}")
                raise AuthenticationError("Invalid credentials", "INVALID_CREDENTIALS")

            user = row_to_dict(result.rows[0])
            print(f"User data: {user}")
            if not user:
                print(f"Failed to convert user data to dict: {result.rows[0]}")
                raise AuthenticationError("Invalid credentials", "INVALID_CREDENTIALS")

            # Verify password
            if not verify_password(password, user["password_hash"]):
                print(f"Invalid password for user: {email}")
                self._record_failed_attempt(email)
                raise AuthenticationError("Invalid credentials", "INVALID_CREDENTIALS")

            # Reset failed attempts on successful login
            self._reset_failed_attempts(email)

            # Create access token with session management
            return self._create_session(user)
        except AuthenticationError:
            raise
        except LibsqlError as e:
            print(f"Database error in authenticate_user: {str(e)}")
            raise AuthenticationError("Database error", "DATABASE_ERROR")
        except Exception as e:
            print(f"Unexpected error in authenticate_user: {str(e)}")
            raise AuthenticationError("Internal server error", "INTERNAL_ERROR")

    def _is_account_locked(self, email: str) -> bool:
        """Check if account is locked due to too many failed attempts"""
        try:
            result = self.db.execute("""
                SELECT failed_attempts, last_failed_attempt
                FROM users
                WHERE email = ?
            """, [email])
            print(f"Lock check result: {result.rows}")

            if not result.rows:
                return False

            user = row_to_dict(result.rows[0])
            print(f"Lock check user data: {user}")
            failed_attempts = user.get("failed_attempts", 0)
            last_failed = user.get("last_failed_attempt", 0)

            if failed_attempts >= self.max_failed_attempts:
                lockout_end = last_failed + int(self.lockout_duration.total_seconds())
                if time.time() < lockout_end:
                    return True
                # Reset if lockout period has passed
                self._reset_failed_attempts(email)
            return False
        except LibsqlError as e:
            print(f"Database error in _is_account_locked: {str(e)}")
            return False

    def _record_failed_attempt(self, email: str) -> None:
        """Record a failed login attempt"""
        try:
            current_time = int(time.time())
            self.db.execute("""
                UPDATE users
                SET failed_attempts = COALESCE(failed_attempts, 0) + 1,
                    last_failed_attempt = ?
                WHERE email = ?
            """, [current_time, email])
            print(f"Recorded failed attempt for: {email}")
        except LibsqlError as e:
            print(f"Database error in _record_failed_attempt: {str(e)}")

    def _reset_failed_attempts(self, email: str) -> None:
        """Reset failed login attempts"""
        try:
            self.db.execute("""
                UPDATE users
                SET failed_attempts = 0,
                    last_failed_attempt = NULL
                WHERE email = ?
            """, [email])
            print(f"Reset failed attempts for: {email}")
        except LibsqlError as e:
            print(f"Database error in _reset_failed_attempts: {str(e)}")

    def _create_session(self, user: Dict[str, Any]) -> dict:
        """Create a new session for the user"""
        try:
            session_id = str(uuid.uuid4())
            current_time = int(time.time())
            print(f"Creating session for user: {user['email']}")

            # Store session in database
            self.db.execute("""
                INSERT INTO sessions (id, user_id, created_at, expires_at)
                VALUES (?, ?, ?, ?)
            """, [
                session_id,
                user["id"],
                current_time,
                current_time + int(self.session_timeout.total_seconds())
            ])

            # Create access token
            user_data = {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "roles": user["roles"].split(","),
                "session_id": session_id
            }

            access_token = create_access_token(
                data={
                    "sub": user["id"],
                    "user": user_data,
                    "session_id": session_id
                },
                expires_delta=self.session_timeout
            )

            result = {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user_data,
                "expires_in": int(self.session_timeout.total_seconds())
            }
            print(f"Session created successfully: {result}")
            return result
        except LibsqlError as e:
            print(f"Database error in _create_session: {str(e)}")
            raise AuthenticationError("Failed to create session", "SESSION_ERROR")

    def invalidate_session(self, session_id: str) -> None:
        """Invalidate a user session (logout)"""
        try:
            self.db.execute("""
                DELETE FROM sessions
                WHERE id = ?
            """, [session_id])
            print(f"Session invalidated: {session_id}")
        except LibsqlError as e:
            print(f"Database error in invalidate_session: {str(e)}")
            raise AuthenticationError("Failed to invalidate session", "SESSION_ERROR")

    def verify_session(self, session_id: str) -> bool:
        """Verify if a session is valid and not expired"""
        try:
            result = self.db.execute("""
                SELECT * FROM sessions
                WHERE id = ? AND expires_at > ?
            """, [session_id, int(time.time())])
            print(f"Session verification result: {result.rows}")
            return bool(result.rows)
        except LibsqlError as e:
            print(f"Database error in verify_session: {str(e)}")
            return False

    def register_user(self, email: str, password: str, name: str) -> dict:
        """Register a new user."""
        try:
            print(f"Registering user: {email}")
            # Check if user already exists
            result = self.db.execute("SELECT id FROM users WHERE email = ?", [email])
            if result.rows:
                print(f"User already exists: {email}")
                raise ValueError("User already exists")

            # Hash password
            password_hash = get_password_hash(password)

            # Generate user ID and timestamps
            user_id = str(uuid.uuid4())
            current_time = int(time.time())

            # Insert user
            self.db.execute("""
                INSERT INTO users (id, email, name, password_hash, roles, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, [user_id, email, name, password_hash, "role_user", current_time, current_time])
            print(f"User inserted with ID: {user_id}")

            # Get the created user
            result = self.db.execute("SELECT * FROM users WHERE id = ?", [user_id])
            if not result.rows:
                print("Failed to retrieve created user")
                raise AuthenticationError("Failed to create user", "REGISTRATION_ERROR")

            user = row_to_dict(result.rows[0])
            print(f"Created user data: {user}")
            if not user:
                print("Failed to convert user data to dict")
                raise AuthenticationError("Failed to create user", "REGISTRATION_ERROR")

            # Create session and return token
            return self._create_session(user)
        except ValueError:
            raise
        except LibsqlError as e:
            print(f"Database error in register_user: {str(e)}")
            raise AuthenticationError("Failed to register user", "REGISTRATION_ERROR")
        except Exception as e:
            print(f"Unexpected error in register_user: {str(e)}")
            raise AuthenticationError("Internal server error", "INTERNAL_ERROR")
