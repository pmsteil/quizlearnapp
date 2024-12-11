from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from .service import AuthService
from .middleware import require_auth

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(user_data: UserRegister, request: Request):
    """Register a new user."""
    try:
        auth_service = AuthService(request.app.state.db)
        result = await auth_service.register_user(
            email=user_data.email,
            password=user_data.password,
            name=user_data.name
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/login")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user and return access token."""
    auth_service = AuthService(request.app.state.db)
    result = await auth_service.authenticate_user(
        email=form_data.username,  # OAuth2 form uses username field for email
        password=form_data.password
    )
    if not result:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return result

@router.get("/me")
@require_auth()
async def get_current_user(request: Request):
    """Get current authenticated user."""
    return request.state.user
