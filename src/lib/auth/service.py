from datetime import timedelta
from typing import Optional
from libsql_client import Client
from .jwt import verify_password, create_access_token, get_password_hash

class AuthService:
    def __init__(self, db_client: Client):
        self.db = db_client

    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """Authenticate a user and return an access token."""
        # Get user from database
        result = await self.db.execute("SELECT * FROM users WHERE email = ?", [email])
        user = result.rows[0] if result.rows else None

        if not user:
            return None

        # Verify password
        if not verify_password(password, user["password_hash"]):
            return None

        # Create access token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={
                "sub": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "roles": user["roles"].split(",")
                }
            },
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "roles": user["roles"].split(",")
            }
        }

    async def register_user(self, email: str, password: str, name: str) -> dict:
        """Register a new user."""
        # Check if user already exists
        result = await self.db.execute("SELECT id FROM users WHERE email = ?", [email])
        if result.rows:
            raise ValueError("User already exists")

        # Hash password
        password_hash = get_password_hash(password)

        # Insert user
        await self.db.execute("""
            INSERT INTO users (email, name, password_hash, roles)
            VALUES (?, ?, ?, ?)
        """, [email, name, password_hash, "role_user"])

        # Get the created user
        result = await self.db.execute("SELECT * FROM users WHERE email = ?", [email])
        user = result.rows[0]

        # Create access token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={
                "sub": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "roles": user["roles"].split(",")
                }
            },
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "roles": user["roles"].split(",")
            }
        }
