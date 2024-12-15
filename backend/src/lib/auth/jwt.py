from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")  # In production, use a secure secret key
ALGORITHM = "HS256"

# Password hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__default_rounds=12,  # Work factor
    bcrypt__min_rounds=12,
    bcrypt__max_rounds=12,
    bcrypt__ident="2b",  # Force bcrypt 2b
    bcrypt__truncate_error=False  # Don't silently truncate passwords
)

# Logging
logger = logging.getLogger(__name__)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        logger.info(f"Verifying password. Hash: {hashed_password}")
        result = pwd_context.verify(plain_password, hashed_password)
        logger.info(f"Password verification result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error verifying password: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.exception(e)
        return False

def get_password_hash(password: str) -> str:
    """Get password hash."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode an access token."""
    try:
        logger.info("Attempting to decode token")
        logger.info(f"Token: {token}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info(f"Decoded payload: {payload}")
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.exception(e)
        raise ValueError("Could not validate credentials")
