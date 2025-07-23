import json
import asyncio
from typing import Dict, List
from fastapi import WebSocket
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    WebSocket connection manager for real-time updates.
    
    This class manages WebSocket connections and enables broadcasting
    updates to specific clients or groups of clients. Essential for
    real-time applications.
    """
    
    def __init__(self):
        # Store active connections by client ID
        self.active_connections: Dict[str, WebSocket] = {}
        # Track which client is interested in which analysis
        self.analysis_subscriptions: Dict[str, List[str]] = {}  # analysis_id -> [client_ids]
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """
        Accept new WebSocket connection.
        
        Args:
            websocket: FastAPI WebSocket instance
            client_id: Unique client identifier
        """
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        """
        Remove client connection and clean up subscriptions.
        
        Args:
            client_id: Client identifier to disconnect
        """
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        # Clean up analysis subscriptions
        for analysis_id, subscribers in self.analysis_subscriptions.items():
            if client_id in subscribers:
                subscribers.remove(client_id)
        
        # Remove empty subscription lists
        self.analysis_subscriptions = {
            k: v for k, v in self.analysis_subscriptions.items() if v
        }
        
        logger.info(f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, client_id: str):
        """
        Send message to specific client.
        
        Args:
            message: Dictionary to send as JSON
            client_id: Target client ID
        """
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def broadcast(self, message: dict):
        """
        Broadcast message to all connected clients.
        
        Args:
            message: Dictionary to send as JSON
        """
        if not self.active_connections:
            return
        
        disconnected = []
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to {client_id}: {e}")
                disconnected.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected:
            self.disconnect(client_id)
    
    def subscribe_to_analysis(self, client_id: str, analysis_id: str):
        """
        Subscribe client to analysis updates.
        
        Args:
            client_id: Client to subscribe
            analysis_id: Analysis to track
        """
        if analysis_id not in self.analysis_subscriptions:
            self.analysis_subscriptions[analysis_id] = []
        
        if client_id not in self.analysis_subscriptions[analysis_id]:
            self.analysis_subscriptions[analysis_id].append(client_id)
            logger.info(f"Client {client_id} subscribed to analysis {analysis_id}")
    
    def unsubscribe_from_analysis(self, client_id: str, analysis_id: str):
        """
        Unsubscribe client from analysis updates.
        
        Args:
            client_id: Client to unsubscribe
            analysis_id: Analysis to stop tracking
        """
        if analysis_id in self.analysis_subscriptions:
            if client_id in self.analysis_subscriptions[analysis_id]:
                self.analysis_subscriptions[analysis_id].remove(client_id)
                logger.info(f"Client {client_id} unsubscribed from analysis {analysis_id}")
    
    async def send_analysis_update(self, analysis_id: str, update_data: dict):
        """
        Send analysis update to all subscribed clients.
        
        Args:
            analysis_id: Analysis that was updated
            update_data: Update information to send
        """
        if analysis_id not in self.analysis_subscriptions:
            return
        
        message = {
            "type": "analysis_update",
            "analysis_id": analysis_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": update_data
        }
        
        subscribers = self.analysis_subscriptions[analysis_id].copy()
        disconnected = []
        
        for client_id in subscribers:
            if client_id in self.active_connections:
                try:
                    websocket = self.active_connections[client_id]
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending analysis update to {client_id}: {e}")
                    disconnected.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected:
            self.disconnect(client_id)
    
    async def send_heartbeat(self):
        """
        Send heartbeat to all connected clients to keep connections alive.
        This is useful for detecting disconnected clients and maintaining
        connection health in production environments.
        """
        if not self.active_connections:
            return
        
        heartbeat_message = {
            "type": "heartbeat",
            "timestamp": "2025-01-01T00:00:00Z",
            "server_status": "healthy"
        }
        
        await self.broadcast(heartbeat_message)
    
    def get_connection_stats(self) -> dict:
        """
        Get connection statistics for monitoring.
        
        Returns:
            Dictionary with connection statistics
        """
        return {
            "total_connections": len(self.active_connections),
            "active_subscriptions": len(self.analysis_subscriptions),
            "clients": list(self.active_connections.keys())
        }


# Global connection manager instance
manager = ConnectionManager()


# Background task for periodic heartbeat
async def heartbeat_task():
    """
    Background task that sends periodic heartbeats to maintain connections.
    This helps detect stale connections and ensures WebSocket health.
    """
    while True:
        try:
            await manager.send_heartbeat()
            await asyncio.sleep(30)  # Send heartbeat every 30 seconds
        except Exception as e:
            logger.error(f"Heartbeat task error: {e}")
            await asyncio.sleep(5)
