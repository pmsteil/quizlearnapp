import uvicorn
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv("PORT", "8000"))

    # Run server
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Enable auto-reload during development
        workers=1     # Use single worker for development
    )
