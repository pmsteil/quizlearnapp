from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional
from .jwt import decode_access_token
from .service import AuthenticationError

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/register")
async def register(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...)
):
    """Register a new user."""
    try:
        print(f"Registration request - email: {email}, name: {name}")
        result = request.app.state.auth_service.register_user(email, password, name)
        print(f"Registration result: {result}")
        return result
    except ValueError as e:
        print(f"ValueError in register: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except AuthenticationError as e:
        print(f"AuthenticationError in register: {str(e)}, code: {e.error_code}")
        raise HTTPException(status_code=400, detail={"error_code": e.error_code, "message": e.message})
    except Exception as e:
        print(f"Unexpected error in register: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/login")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """Login and get access token."""
    try:
        result = request.app.state.auth_service.authenticate_user(form_data.username, form_data.password)
        return result
    except AuthenticationError as e:
        raise HTTPException(
            status_code=401,
            detail={"error_code": e.error_code, "message": e.message}
        )
    except Exception as e:
        print(f"Unexpected error in login: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/logout")
async def logout(
    request: Request,
    token: str = Depends(oauth2_scheme)
):
    """Logout and invalidate session."""
    try:
        # Decode token to get session ID
        payload = decode_access_token(token)
        session_id = payload["session_id"]

        # Invalidate session
        request.app.state.auth_service.invalidate_session(session_id)
        return {"message": "Successfully logged out"}
    except AuthenticationError as e:
        raise HTTPException(
            status_code=401,
            detail={"error_code": e.error_code, "message": e.message}
        )
    except Exception as e:
        print(f"Unexpected error in logout: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/me")
async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme)
):
    """Get current user information."""
    try:
        # Decode token to get user info and session ID
        payload = decode_access_token(token)
        session_id = payload["session_id"]

        # Verify session is still valid
        if not request.app.state.auth_service.verify_session(session_id):
            raise HTTPException(status_code=401, detail="Session expired")

        return payload["user"]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in get_current_user: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
