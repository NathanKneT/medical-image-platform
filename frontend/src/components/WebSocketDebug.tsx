'use client';

import { useState, useEffect } from 'react';
import { wsClient } from '@/lib/websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function WebSocketDebug() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [connectionState, setConnectionState] = useState('Unknown');

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(wsClient.isConnected);
      setConnectionState(wsClient.isConnected ? 'Connected' : 'Disconnected');
    };

    // Check connection status every second
    const interval = setInterval(checkConnection, 1000);
    
    // Initial check
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    try {
      await wsClient.connect();
      setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: Connected successfully`]);
    } catch (error) {
      setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: Connection failed - ${error}`]);
    }
  };

  const handleDisconnect = () => {
    wsClient.disconnect();
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: Disconnected`]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          WebSocket Debug Panel
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Status: <strong>{connectionState}</strong></span>
          <span>Client ID: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{wsClient.id}</code></span>
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleConnect} disabled={isConnected}>
            Connect
          </Button>
          <Button size="sm" variant="secondary" onClick={handleDisconnect} disabled={!isConnected}>
            Disconnect
          </Button>
          <Button size="sm" variant="outline" onClick={clearMessages}>
            Clear Log
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Connection Log:</h4>
          <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-sm">No messages yet...</p>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="text-xs font-mono text-gray-700">
                  {message}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>Expected WebSocket URL: ws://localhost:8000/ws/analysis/{wsClient.id}</p>
          <p>Backend should show: "New WebSocket connection" when connected</p>
        </div>
      </CardContent>
    </Card>
  );
}