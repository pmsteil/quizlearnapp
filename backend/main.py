from fastapi import FastAPI
from backend.ai.routes.chat import router as chat_router
from backend.ai.config import AIConfig
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    # Disable schema generation
    app.openapi_schema = {}
    return app.openapi_schema

app = FastAPI(
    title="QuizLearn AI API",
    description="AI-powered learning platform API",
    version="1.0.0",
    docs_url=None,  # Disable Swagger UI
    redoc_url=None,  # Disable ReDoc
)

# Override OpenAPI schema generation
app.openapi = custom_openapi

# Load configuration
config = AIConfig()

# Add routers
app.include_router(
    chat_router,
    prefix="/api/v1",
    tags=["chat"]
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
