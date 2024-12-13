from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),  # Log to console
        logging.FileHandler('frontend.log')  # Log to file
    ]
)

logger = logging.getLogger('frontend')

def log_message(level: str, message: str, timestamp: str = None):
    """Log a message from the frontend"""
    if timestamp is None:
        timestamp = datetime.utcnow().isoformat()
        
    log_entry = f"[Frontend {timestamp}] {message}"
    
    if level.lower() == 'error':
        logger.error(log_entry)
    else:
        logger.info(log_entry)
