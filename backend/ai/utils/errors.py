class ChatError(Exception):
    def __init__(self, message: str, code: str, details: dict = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(self.message)

class TokenLimitError(ChatError):
    def __init__(self, message: str = "Token limit exceeded"):
        super().__init__(message, "TOKEN_LIMIT_EXCEEDED")

class InvalidMessageError(ChatError):
    def __init__(self, message: str = "Invalid message format"):
        super().__init__(message, "INVALID_MESSAGE")

class AgentError(ChatError):
    def __init__(self, message: str = "Agent processing error"):
        super().__init__(message, "AGENT_ERROR")

class AgentNotFoundError(ChatError):
    def __init__(self, agent_id: str):
        super().__init__(f"Agent not found: {agent_id}", "AGENT_NOT_FOUND")

class PromptNotFoundError(ChatError):
    def __init__(self, agent_id: str, prompt_type: str):
        super().__init__(
            f"No prompt found for agent {agent_id} and type {prompt_type}",
            "PROMPT_NOT_FOUND"
        )
