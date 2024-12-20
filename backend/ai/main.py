from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import chat
from .config import AIConfig

app = FastAPI(title="QuizLearn AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/v1/ai", tags=["AI Chat"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}
