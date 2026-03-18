/**
 * NAT Traversal System
 * WebRTC NAT traversal dengan fallback untuk koneksi sulit
 */

interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface NATTraversalConfig {
  iceServers: ICEServer[];
  fallbackRelay?: string;
  stunTimeout: number;
  turnTimeout: number;
  maxRetries: number;
}

interface ConnectionAttempt {
  peerId: string;
  startTime: number;
  method: 'direct' | 'stun' | 'turn' | 'relay';
  status: 'attempting' | 'success' | 'failed';
}

export class NATTraversal {
  private config: NATTraversalConfig;
  private connectionAttempts = new Map<string, ConnectionAttempt>();
  private fallbackConnections = new Map<string, WebSocket>();
  
  private onConnectionEstablished?: (peerId: string, method: string) => void;
  private onConnectionFailed?: (peerId: string, error: string) => void;

  constructor(config: Partial<NATTraversalConfig> = {}) {
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      stunTimeout: 5000,
      turnTimeout: 10000,
      maxRetries: 3,
      ...config
    };
  }

  /**
   * Attempt connection dengan multiple methods
   */
  async attemptConnection(peerId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    const attempt: ConnectionAttempt = {
      peerId,
      startTime: Date.now(),
      method: 'direct',
      status: 'attempting'
    };
    
    this.connectionAttempts.set(peerId, attempt);

    try {
      // Try direct connection first
      const connection = await this.tryDirectConnection(peerId, isInitiator);
      if (connection) {
        attempt.status = 'success';
        attempt.method = 'direct';
        this.onConnectionEstablished?.(peerId, 'direct');
        return connection;
      }
    } catch (error) {
      console.warn(`Direct connection failed for ${peerId}:`, error);
    }

    try {
      // Try STUN-assisted connection
      const connection = await this.trySTUNConnection(peerId, isInitiator);
      if (connection) {
        attempt.status = 'success';
        attempt.method = 'stun';
        this.onConnectionEstablished?.(peerId, 'stun');
        return connection;
      }
    } catch (error) {
      console.warn(`STUN connection failed for ${peerId}:`, error);
    }

    try {
      // Try TURN relay
      const connection = await this.tryTURNConnection(peerId, isInitiator);
      if (connection) {
        attempt.status = 'success';
        attempt.method = 'turn';
        this.onConnectionEstablished?.(peerId, 'turn');
        return connection;
      }
    } catch (error) {
      console.warn(`TURN connection failed for ${peerId}:`, error);
    }

    // Fallback to WebSocket relay
    if (this.config.fallbackRelay) {
      try {
        await this.establishFallbackConnection(peerId);
        attempt.status = 'success';
        attempt.method = 'relay';
        this.onConnectionEstablished?.(peerId, 'relay');
        
        // Return mock RTCPeerConnection for compatibility
        return this.createFallbackPeerConnection(peerId);
      } catch (error) {
        console.error(`Fallback connection failed for ${peerId}:`, error);
      }
    }

    attempt.status = 'failed';
    this.onConnectionFailed?.(peerId, 'All connection methods failed');
    throw new Error(`Failed to establish connection with ${peerId}`);
  }

  /**
   * Try direct P2P connection
   */
  private async tryDirectConnection(peerId: string, isInitiator: boolean): Promise<RTCPeerConnection | null> {
    const pc = new RTCPeerConnection({
      iceServers: []
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pc.close();
        reject(new Error('Direct connection timeout'));
      }, 3000);

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          clearTimeout(timeout);
          resolve(pc);
        } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          clearTimeout(timeout);
          pc.close();
          reject(new Error('Direct connection failed'));
        }
      };

      // Start ICE gathering
      if (isInitiator) {
        pc.createDataChannel('test');
      }
    });
  }

  /**
   * Try STUN-assisted connection
   */
  private async trySTUNConnection(peerId: string, isInitiator: boolean): Promise<RTCPeerConnection | null> {
    const stunServers = this.config.iceServers.filter(server => 
      (Array.isArray(server.urls) ? server.urls : [server.urls])
        .some(url => url.startsWith('stun:'))
    );

    const pc = new RTCPeerConnection({
      iceServers: stunServers
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pc.close();
        reject(new Error('STUN connection timeout'));
      }, this.config.stunTimeout);

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          clearTimeout(timeout);
          resolve(pc);
        } else if (pc.iceConnectionState === 'failed') {
          clearTimeout(timeout);
          pc.close();
          reject(new Error('STUN connection failed'));
        }
      };

      if (isInitiator) {
        pc.createDataChannel('data');
      }
    });
  }

  /**
   * Try TURN relay connection
   */
  private async tryTURNConnection(peerId: string, isInitiator: boolean): Promise<RTCPeerConnection | null> {
    const turnServers = this.config.iceServers.filter(server => 
      (Array.isArray(server.urls) ? server.urls : [server.urls])
        .some(url => url.startsWith('turn:'))
    );

    if (turnServers.length === 0) {
      throw new Error('No TURN servers configured');
    }

    const pc = new RTCPeerConnection({
      iceServers: turnServers
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pc.close();
        reject(new Error('TURN connection timeout'));
      }, this.config.turnTimeout);

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          clearTimeout(timeout);
          resolve(pc);
        } else if (pc.iceConnectionState === 'failed') {
          clearTimeout(timeout);
          pc.close();
          reject(new Error('TURN connection failed'));
        }
      };

      if (isInitiator) {
        pc.createDataChannel('data');
      }
    });
  }

  /**
   * Establish WebSocket fallback connection
   */
  private async establishFallbackConnection(peerId: string): Promise<void> {
    if (!this.config.fallbackRelay) {
      throw new Error('No fallback relay configured');
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.config.fallbackRelay!);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Fallback connection timeout'));
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        
        // Send connection request
        ws.send(JSON.stringify({
          type: 'connect',
          peerId: peerId
        }));
        
        this.fallbackConnections.set(peerId, ws);
        resolve();
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Handle relay messages
        this.handleRelayMessage(peerId, data);
      };
    });
  }

  /**
   * Create mock RTCPeerConnection for fallback
   */
  private createFallbackPeerConnection(peerId: string): RTCPeerConnection {
    const ws = this.fallbackConnections.get(peerId);
    if (!ws) {
      throw new Error('Fallback connection not found');
    }

    // Create mock RTCPeerConnection that uses WebSocket
    const mockPC = {
      send: (data: any) => {
        ws.send(JSON.stringify({
          type: 'data',
          peerId: peerId,
          data: data
        }));
      },
      close: () => {
        ws.close();
        this.fallbackConnections.delete(peerId);
      },
      iceConnectionState: 'connected'
    } as any;

    return mockPC;
  }

  /**
   * Handle relay server messages
   */
  private handleRelayMessage(peerId: string, message: any): void {
    // Implement relay message handling
    console.log(`Relay message from ${peerId}:`, message);
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): { [peerId: string]: ConnectionAttempt } {
    return Object.fromEntries(this.connectionAttempts);
  }

  /**
   * Set connection event handlers
   */
  setOnConnectionEstablished(handler: (peerId: string, method: string) => void): void {
    this.onConnectionEstablished = handler;
  }

  setOnConnectionFailed(handler: (peerId: string, error: string) => void): void {
    this.onConnectionFailed = handler;
  }

  /**
   * Close connection
   */
  closeConnection(peerId: string): void {
    const ws = this.fallbackConnections.get(peerId);
    if (ws) {
      ws.close();
      this.fallbackConnections.delete(peerId);
    }
    
    this.connectionAttempts.delete(peerId);
  }

  /**
   * Dispose all connections
   */
  dispose(): void {
    for (const [peerId, ws] of this.fallbackConnections) {
      ws.close();
    }
    this.fallbackConnections.clear();
    this.connectionAttempts.clear();
  }
}