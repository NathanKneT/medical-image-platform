class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, (data: any) => void> = new Map();
  private analysisSubscriptions: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  public isConnected = false;

  async connect(clientId = 'guest'): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${process.env.NODE_ENV === 'production' ? 'wss:' : 'ws:'}//${window.location.host}/ws/analysis/${clientId}`;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect(clientId);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };
    });
  }

  private handleMessage(message: any) {
    console.log('📨 WebSocket message received:', message);

    // Handle analysis-specific updates
    if (message.type === 'analysis_update' && message.analysis_id) {
      const callback = this.analysisSubscriptions.get(message.analysis_id);
      if (callback) {
        callback(message.data);
      }
    }

    // Handle broadcast messages (new analysis creation, completion, etc.)
    if (message.type === 'broadcast' || 
        message.type === 'new_analysis_started' ||
        message.type === 'analysis_completed' ||
        message.type === 'analysis_failed' ||
        message.type === 'analysis_cancelled') {
      
      const callback = this.subscriptions.get('broadcast');
      if (callback) {
        callback(message);
      }
    }

    // Handle other message types
    const callback = this.subscriptions.get(message.type);
    if (callback) {
      callback(message);
    }
  }

  private attemptReconnect(clientId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms... (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect(clientId).catch(() => {
        this.attemptReconnect(clientId);
      });
    }, delay);
  }

  // Subscribe to general message types (like broadcasts)
  subscribe(messageType: string, callback: (data: any) => void) {
    this.subscriptions.set(messageType, callback);
  }

  unsubscribe(messageType: string) {
    this.subscriptions.delete(messageType);
  }

  // Subscribe to specific analysis updates
  subscribeToAnalysis(analysisId: string, callback: (data: any) => void) {
    this.analysisSubscriptions.set(analysisId, callback);
    
    // Send subscription message to server
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        analysis_id: analysisId
      }));
    }
  }

  unsubscribeFromAnalysis(analysisId: string) {
    this.analysisSubscriptions.delete(analysisId);
    
    // Send unsubscription message to server
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        analysis_id: analysisId
      }));
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.subscriptions.clear();
    this.analysisSubscriptions.clear();
  }

  // Send ping to keep connection alive
  ping() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
      }));
    }
  }
}

// Global WebSocket client instance
export const wsClient = new WebSocketClient();

// Keep connection alive with periodic pings
setInterval(() => {
  if (wsClient.isConnected) {
    wsClient.ping();
  }
}, 30000); // Every 30 seconds