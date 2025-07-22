import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi.websockets import WebSocketState

from app.services.websocket_manager import manager

router = APIRouter()


@router.websocket("/analysis/{client_id}")
async def websocket_analysis_endpoint(
    websocket: WebSocket,
    client_id: str,
    analysis_id: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time analysis updates.
    
    This endpoint demonstrates production WebSocket patterns:
    1. Connection authentication and validation
    2. Subscription management for specific analyses
    3. Graceful disconnection handling
    4. Error recovery and reconnection support
    5. Heartbeat for connection health monitoring
    
    Args:
        websocket: WebSocket connection
        client_id: Unique client identifier
        analysis_id: Optional analysis ID to subscribe to immediately
    """
    await manager.connect(websocket, client_id)
    
    # Subscribe to specific analysis if provided
    if analysis_id:
        manager.subscribe_to_analysis(client_id, analysis_id)
        
        # Send initial subscription confirmation
        await manager.send_personal_message({
            "type": "subscription_confirmed",
            "analysis_id": analysis_id,
            "client_id": client_id,
            "message": f"Subscribed to analysis {analysis_id}"
        }, client_id)
    
    try:
        while True:
            # Listen for client messages
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                await handle_websocket_message(websocket, client_id, message)
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format"
                }, client_id)
            except Exception as e:
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Error processing message: {str(e)}"
                }, client_id)
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        print(f"Client {client_id} disconnected from WebSocket")
    except Exception as e:
        print(f"WebSocket error for client {client_id}: {e}")
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.close(code=1011, reason="Internal server error")
        manager.disconnect(client_id)


async def handle_websocket_message(websocket: WebSocket, client_id: str, message: dict):
    """
    Handle incoming WebSocket messages from clients.
    
    This function processes different types of client messages:
    - Analysis subscriptions
    - Unsubscriptions
    - Ping/pong for connection health
    - Status requests
    
    Args:
        websocket: WebSocket connection
        client_id: Client identifier
        message: Parsed JSON message from client
    """
    message_type = message.get("type")
    
    if message_type == "subscribe":
        # Subscribe to analysis updates
        analysis_id = message.get("analysis_id")
        if analysis_id:
            manager.subscribe_to_analysis(client_id, analysis_id)
            await manager.send_personal_message({
                "type": "subscription_confirmed",
                "analysis_id": analysis_id,
                "message": f"Subscribed to analysis {analysis_id}"
            }, client_id)
        else:
            await manager.send_personal_message({
                "type": "error",
                "message": "analysis_id required for subscription"
            }, client_id)
    
    elif message_type == "unsubscribe":
        # Unsubscribe from analysis updates
        analysis_id = message.get("analysis_id")
        if analysis_id:
            manager.unsubscribe_from_analysis(client_id, analysis_id)
            await manager.send_personal_message({
                "type": "unsubscription_confirmed",
                "analysis_id": analysis_id,
                "message": f"Unsubscribed from analysis {analysis_id}"
            }, client_id)
    
    elif message_type == "ping":
        # Respond to ping with pong (connection health check)
        await manager.send_personal_message({
            "type": "pong",
            "timestamp": message.get("timestamp"),
            "server_time": "2025-01-01T00:00:00Z"
        }, client_id)
    
    elif message_type == "status":
        # Send connection status information
        stats = manager.get_connection_stats()
        await manager.send_personal_message({
            "type": "status_response",
            "connection_stats": stats,
            "client_id": client_id
        }, client_id)
    
    else:
        await manager.send_personal_message({
            "type": "error",
            "message": f"Unknown message type: {message_type}"
        }, client_id)


@router.websocket("/broadcast")
async def websocket_broadcast_endpoint(websocket: WebSocket):
    """
    Admin WebSocket endpoint for broadcasting to all clients.
    
    This endpoint is typically used for system-wide announcements,
    maintenance notifications, or emergency alerts.
    
    In production, this would require admin authentication.
    """
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                
                # Validate admin message structure
                if "type" not in message or "content" not in message:
                    await websocket.send_text(json.dumps({
                        "error": "Invalid message format. Required: type, content"
                    }))
                    continue
                
                # Broadcast to all connected clients
                broadcast_message = {
                    "type": "broadcast",
                    "message_type": message["type"],
                    "content": message["content"],
                    "timestamp": "2025-01-01T00:00:00Z"
                }
                
                await manager.broadcast(broadcast_message)
                
                # Confirm broadcast to admin
                await websocket.send_text(json.dumps({
                    "status": "broadcast_sent",
                    "recipients": len(manager.active_connections),
                    "message": message
                }))
                
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "error": "Invalid JSON format"
                }))
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "error": f"Error processing broadcast: {str(e)}"
                }))
                
    except WebSocketDisconnect:
        print("Admin broadcast WebSocket disconnected")
    except Exception as e:
        print(f"Broadcast WebSocket error: {e}")