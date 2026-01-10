from enum import Enum
from typing import Optional, Dict, Any

class ErrorCode(str, Enum):
    # Auth
    AUTH_INVALID_TOKEN = "AUTH_INVALID_TOKEN"
    AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED"
    
    # Logic
    VALIDATION_ERROR = "VALIDATION_ERROR"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    CONFLICT = "CONFLICT"
    
    # Match/Transaction
    MATCH_EXPIRED = "MATCH_EXPIRED"
    MATCH_INVALID_STATE = "MATCH_INVALID_STATE"
    
    # System
    INTERNAL_ERROR = "INTERNAL_ERROR"

class TruequeError(Exception):
    def __init__(self, code: ErrorCode, message: str, status_code: int = 400, metadata: Optional[Dict[str, Any]] = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.metadata = metadata or {}
        super().__init__(self.message)

    def to_dict(self):
        return {
            "error": {
                "code": self.code.value,
                "message": self.message,
                "metadata": self.metadata
            }
        }
