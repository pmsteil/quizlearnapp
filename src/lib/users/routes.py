from fastapi import APIRouter, Depends, HTTPException, Request
from src.lib.auth.jwt import decode_access_token
from src.lib.auth.routes import oauth2_scheme
from src.lib.auth.service import AuthenticationError

router = APIRouter(prefix="/users", tags=["users"])

def require_admin(token: str = Depends(oauth2_scheme)):
    """Verify the user has admin role."""
    try:
        payload = decode_access_token(token)
        user = payload["user"]
        if "role_admin" not in user["roles"]:
            raise HTTPException(
                status_code=403,
                detail={"error_code": "FORBIDDEN", "message": "Admin access required"}
            )
        return token
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying admin role: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail={"error_code": "INVALID_TOKEN", "message": "Could not validate credentials"}
        )

@router.get("")
async def list_users(
    request: Request,
    token: str = Depends(require_admin)
):
    """List all users (admin only)."""
    try:
        return request.app.state.auth_service.list_users()
    except AuthenticationError as e:
        raise HTTPException(
            status_code=400,
            detail={"error_code": e.error_code, "message": e.message}
        )
    except Exception as e:
        print(f"Unexpected error in list_users: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
