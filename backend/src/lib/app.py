from fastapi import FastAPI, Request, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from libsql_client import create_client_sync
from dotenv import load_dotenv
import os
from .auth.routes import router as auth_router
from .users.routes import router as users_router
from .auth.service import AuthService
from .db import get_db, get_test_db
from .topics.routes import router as topics_router
from .routes.log import router as log_router
from .admin.routes import router as admin_router
import logging
import sys

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app with metadata
app = FastAPI(
    title="QuizLearn API",
    description="""
    QuizLearn API provides endpoints for managing educational content and tracking user progress.

    ## Features

    * User Authentication and Authorization
    * Topic Management
    * Question Management
    * Progress Tracking

    ## Authentication

    Most endpoints require authentication using JWT tokens. To authenticate:
    1. Register a new user or login with existing credentials
    2. Use the received token in the Authorization header
    3. Format: `Bearer <token>`

    ## Roles

    * `role_user`: Basic user access
    * `role_admin`: Administrative access with additional privileges

    ## Rate Limiting

    API endpoints are rate-limited to prevent abuse. Limits vary by endpoint:
    * Authentication endpoints: 5 requests per minute
    * General endpoints: 60 requests per minute
    * Admin endpoints: 120 requests per minute

    ## Error Responses

    The API uses standard HTTP status codes and returns error details in the following format:
    ```json
    {
        "detail": {
            "error_code": "ERROR_CODE",
            "message": "Human readable error message"
        }
    }
    """,
    version="1.0.0",
    terms_of_service="http://quizlearn.com/terms/",
    contact={
        "name": "QuizLearn Support",
        "url": "http://quizlearn.com/support",
        "email": "support@quizlearn.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "auth",
            "description": "Authentication operations including login, register, and token management",
            "externalDocs": {
                "description": "Auth Documentation",
                "url": "http://quizlearn.com/docs/auth",
            },
        },
        {
            "name": "users",
            "description": "User management operations (admin only)",
        },
        {
            "name": "topics",
            "description": "Educational topic management",
        },
        {
            "name": "questions",
            "description": "Question management for topics",
        },
        {
            "name": "progress",
            "description": "User progress tracking and statistics",
        },
    ],
    docs_url=None,  # Disable default docs
    redoc_url=None,  # Disable default redoc
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Frontend dev server
        "http://localhost:3000",  # Alternative port
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly list allowed methods
    allow_headers=["*"],
    expose_headers=["*"],  # Expose headers to the frontend
    max_age=3600  # Cache preflight requests for 1 hour
)

# Exception handler for HTTPException
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": {"error_code": str(exc.status_code), "message": exc.detail}},
    )

# Add middleware for handling errors
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error("Error in request")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        logger.exception(e)
        
        # Create error response
        status_code = 500
        if isinstance(e, HTTPException):
            status_code = e.status_code
            
        error_response = JSONResponse(
            status_code=status_code,
            content={"detail": {"error_code": "INTERNAL_SERVER_ERROR", "message": str(e)}}
        )
        
        # Add CORS headers even for error responses
        origin = request.headers.get("origin")
        if origin == "http://localhost:5173":  # Frontend dev server
            error_response.headers["Access-Control-Allow-Origin"] = origin
            error_response.headers["Access-Control-Allow-Credentials"] = "true"
            
        return error_response

# Database connection middleware
@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    # Use the app-level database connection
    if not hasattr(request.app.state, "db"):
        request.app.state.db = get_db()
        logger.info("Created new database connection in app state")

    try:
        response = await call_next(request)
        return response
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": {"error_code": "INTERNAL_SERVER_ERROR", "message": str(e)}},
        )

# Custom API documentation endpoints
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Serve custom Swagger UI documentation."""
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="QuizLearn API Documentation",
        oauth2_redirect_url="/docs/oauth2-redirect",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css",
        swagger_favicon_url="https://fastapi.tiangolo.com/img/favicon.png",
    )

@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    """Serve ReDoc documentation."""
    return get_redoc_html(
        openapi_url="/openapi.json",
        title="QuizLearn API Documentation",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
        redoc_favicon_url="https://fastapi.tiangolo.com/img/favicon.png",
    )

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
        terms_of_service=app.terms_of_service,
        contact=app.contact,
        license_info=app.license_info,
    )

    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter the JWT token obtained from login/register",
        }
    }

    # Add response schemas
    openapi_schema["components"]["schemas"] = {
        "HTTPError": {
            "type": "object",
            "properties": {
                "detail": {
                    "type": "object",
                    "properties": {
                        "error_code": {"type": "string"},
                        "message": {"type": "string"}
                    }
                }
            }
        },
        "HealthCheck": {
            "type": "object",
            "properties": {
                "status": {"type": "string"},
                "version": {"type": "string"},
                "documentation": {
                    "type": "object",
                    "properties": {
                        "swagger": {"type": "string"},
                        "redoc": {"type": "string"}
                    }
                }
            }
        }
    }

    # Apply global security
    openapi_schema["security"] = [{"bearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Create API v1 router
api_v1 = APIRouter(prefix="/api/v1")

# Include routers under API v1
api_v1.include_router(auth_router)
api_v1.include_router(users_router)
api_v1.include_router(topics_router)
api_v1.include_router(log_router)
api_v1.include_router(admin_router)

# Include API v1 router in main app
app.include_router(api_v1)

# Mount static files
app.mount("/static", StaticFiles(directory="src/static"), name="static")

# Health check endpoint
@app.get(
    "/health",
    tags=["health"],
    response_model=dict,
    responses={
        200: {
            "description": "Successful response",
            "content": {
                "application/json": {
                    "example": {
                        "status": "ok",
                        "version": "1.0.0",
                        "documentation": {
                            "swagger": "/docs",
                            "redoc": "/redoc"
                        }
                    }
                }
            }
        }
    }
)
async def health_check():
    """
    Health check endpoint to verify API is running.

    Returns:
        dict: Status information about the API including:
            - status: Current API status
            - version: API version number
            - documentation: Links to API documentation
    """
    return {
        "status": "ok",
        "version": app.version,
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }
