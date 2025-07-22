from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field


class WebSocketMessage(BaseModel):
    """Base WebSocket message schema."""
    
    type: str = Field(..., description="Message type identifier")
    timestamp: Optional[str] = Field(None, description="Message timestamp")
    client_id: Optional[str] = Field(None, description="Client identifier")


class SubscriptionMessage(WebSocketMessage):
    """WebSocket subscription message."""
    
    type: str = "subscribe"
    analysis_id: str = Field(..., description="Analysis ID to subscribe to")


class UnsubscriptionMessage(WebSocketMessage):
    """WebSocket unsubscription message."""
    
    type: str = "unsubscribe"
    analysis_id: str = Field(..., description="Analysis ID to unsubscribe from")


class AnalysisUpdateMessage(WebSocketMessage):
    """Analysis progress update message."""
    
    type: str = "analysis_update"
    analysis_id: str = Field(..., description="Analysis identifier")
    data: Dict[str, Any] = Field(..., description="Update data")


class PingMessage(WebSocketMessage):
    """WebSocket ping message for connection health."""
    
    type: str = "ping"
    timestamp: str = Field(..., description="Client timestamp")


class PongMessage(WebSocketMessage):
    """WebSocket pong response message."""
    
    type: str = "pong"
    timestamp: Optional[str] = Field(None, description="Original client timestamp")
    server_time: str = Field(..., description="Server timestamp")


class ErrorMessage(WebSocketMessage):
    """WebSocket error message."""
    
    type: str = "error"
    message: str = Field(..., description="Error description")
    error_code: Optional[str] = Field(None, description="Error code")


class BroadcastMessage(WebSocketMessage):
    """System broadcast message."""
    
    type: str = "broadcast"
    message_type: str = Field(..., description="Type of broadcast")
    content: Dict[str, Any] = Field(..., description="Broadcast content")


# Union type for all possible WebSocket messages
WebSocketMessageType = Union[
    SubscriptionMessage,
    UnsubscriptionMessage,
    AnalysisUpdateMessage,
    PingMessage,
    PongMessage,
    ErrorMessage,
    BroadcastMessage
]