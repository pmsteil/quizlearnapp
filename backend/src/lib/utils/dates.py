from datetime import datetime, timezone

def from_unix_timestamp(timestamp: int) -> datetime:
    """Convert a Unix timestamp to a UTC datetime object."""
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)

def to_unix_timestamp(dt: datetime) -> int:
    """Convert a datetime object to a Unix timestamp."""
    return int(dt.timestamp())

def now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)

def format_iso(dt: datetime) -> str:
    """Format datetime as ISO string."""
    return dt.isoformat()

def parse_iso(iso_str: str) -> datetime:
    """Parse ISO formatted string to datetime."""
    return datetime.fromisoformat(iso_str)
