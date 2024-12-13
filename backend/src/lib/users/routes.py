from fastapi import APIRouter, Depends, HTTPException, Request, status
from ..auth.jwt import decode_access_token
from ..auth.routes import oauth2_scheme
from ..auth.service import AuthenticationError, requires_auth, row_to_dict
from pydantic import BaseModel
from typing import List, Dict, Optional

router = APIRouter(prefix="/users", tags=["users"])

class UserBase(BaseModel):
    email: str
    name: str
    roles: List[str]

class UserResponse(UserBase):
    id: str
    created_at: int
    updated_at: int

class UserUpdate(BaseModel):
    name: Optional[str]
    roles: Optional[List[str]]

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

@router.get(
    "",
    response_model=List[UserResponse],
    responses={
        200: {
            "description": "List of all users",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "email": "user@example.com",
                            "name": "John Doe",
                            "roles": ["role_user"],
                            "created_at": 1634567890,
                            "updated_at": 1634567890
                        }
                    ]
                }
            }
        },
        401: {
            "description": "Authentication failed",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error_code": "INVALID_TOKEN",
                            "message": "Could not validate credentials"
                        }
                    }
                }
            }
        },
        403: {
            "description": "Permission denied",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error_code": "FORBIDDEN",
                            "message": "Admin access required"
                        }
                    }
                }
            }
        }
    }
)
async def list_users(
    request: Request,
    token: str = Depends(require_admin)
):
    """
    List all users in the system.

    This endpoint is restricted to administrators only.
    Returns a list of all registered users with their details.

    Requires authentication:
    - Valid access token in Authorization header
    - Admin role
    """
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

@router.put(
    "/{user_id}",
    response_model=UserResponse,
    responses={
        200: {
            "description": "Successfully updated user",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "email": "user@example.com",
                        "name": "Updated Name",
                        "roles": ["role_user", "role_admin"],
                        "created_at": 1634567890,
                        "updated_at": 1634567890
                    }
                }
            }
        },
        401: {
            "description": "Authentication failed",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error_code": "INVALID_TOKEN",
                            "message": "Could not validate credentials"
                        }
                    }
                }
            }
        },
        403: {
            "description": "Permission denied",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error_code": "FORBIDDEN",
                            "message": "Admin access required"
                        }
                    }
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "User not found"
                    }
                }
            }
        }
    }
)
async def update_user(
    request: Request,
    user_id: str,
    user_update: UserUpdate,
    token: str = Depends(require_admin)
):
    """
    Update user details.

    This endpoint is restricted to administrators only.
    Allows updating a user's name and roles.

    Requires authentication:
    - Valid access token in Authorization header
    - Admin role
    """
    db = request.app.state.db

    # Verify user exists
    result = db.execute(
        "SELECT * FROM users WHERE id = ?",
        [user_id]
    )
    if not result.rows:
        raise HTTPException(status_code=404, detail="User not found")
    user = row_to_dict(result.rows[0])

    # Update user details
    name = user_update.name if user_update.name is not None else user["name"]
    roles = user_update.roles if user_update.roles is not None else user["roles"].split(",")

    result = db.execute(
        """
        UPDATE users
        SET name = ?, roles = ?
        WHERE id = ?
        RETURNING id, email, name, roles, created_at, updated_at
        """,
        [name, ",".join(roles), user_id]
    )

    # Convert row to dict and properly format roles
    updated_user = row_to_dict(result.rows[0])
    updated_user["roles"] = updated_user["roles"].split(",")
    return updated_user

@router.delete(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "Successfully deleted user",
            "content": {
                "application/json": {
                    "example": {
                        "message": "User deleted successfully"
                    }
                }
            }
        },
        401: {
            "description": "Authentication failed",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error_code": "INVALID_TOKEN",
                            "message": "Could not validate credentials"
                        }
                    }
                }
            }
        },
        403: {
            "description": "Permission denied",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error_code": "FORBIDDEN",
                            "message": "Admin access required"
                        }
                    }
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "User not found"
                    }
                }
            }
        }
    }
)
async def delete_user(
    request: Request,
    user_id: str,
    token: str = Depends(require_admin)
):
    """
    Delete a user account.

    This endpoint is restricted to administrators only.
    Permanently removes a user account and all associated data.
    This action cannot be undone.

    Requires authentication:
    - Valid access token in Authorization header
    - Admin role
    """
    db = request.app.state.db

    # Verify user exists
    result = db.execute(
        "SELECT * FROM users WHERE id = ?",
        [user_id]
    )
    if not result.rows:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete user (cascade will handle sessions)
    db.execute(
        "DELETE FROM users WHERE id = ?",
        [user_id]
    )

    return {"message": "User deleted successfully"}
