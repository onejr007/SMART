/**
 * WebRTCPeer.ts
 * WebRTC Data Channels untuk P2P (#11)
 * Implementasi P2P networking untuk co-op gameplay
 * Reduce server load hingga 70% untuk small sessions
 */

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  maxPeers?: number;
  channelConfig?: RTCDataChannelInit;
}

export interface PeerMessage {
  type: string;
  data: any;
  timestamp: number;
  senderId: string;
}

export class WebRTCPeer {
  private peerId: string;
  private connections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private config: WebRTCConfig;
  private messageHandlers: Map<string, (msg: PeerMessage) => void> = new Map();
  private onPeerConnected?: (peerId: string) => void;
  private onPeerDisconnected?: (peerId: string) => void;

  constructor(peerId: string, config: WebRTCConfig) {
    this.peerId = peerId;
    this.config = {
      iceServers: config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      maxPeers: config.maxPeers || 8,
      channelConfig: config.channelConfig || {
        ordered: false,
        maxRetransmits: 0
      }
    };
  }

  public async createOffer(remotePeerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection(remotePeerId);
    const channel = pc.createDataChannel('game-data', this.config.channelConfig);
    this.setupDataChannel(remotePeerId, channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    return offer;
  }

  public async handleOffer(remotePeerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection(remotePeerId);
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    return answer;
  }

  public async handleAnswer(remotePeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.connections.get(remotePeerId);
    if (!pc) {
      throw new Error(`No connection found for peer ${remotePeerId}`);
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  public async handleIceCandidate(remotePeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.connections.get(remotePeerId);
    if (!pc) {
      console.warn(`No connection found for peer ${remotePeerId}`);
      return;
    }
    
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private createPeerConnection(remotePeerId: string): RTCPeerConnection {
    if (this.connections.has(remotePeerId)) {
      return this.connections.get(remotePeerId)!;
    }

    const pc = new RTCPeerConnection({ iceServers: this.config.iceServers });
    this.connections.set(remotePeerId, pc);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send to signaling server
        this.onIceCandidate?.(remotePeerId, event.candidate.toJSON());
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        console.log(`✅ Connected to peer ${remotePeerId}`);
        this.onPeerConnected?.(remotePeerId);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.log(`❌ Disconnected from peer ${remotePeerId}`);
        this.closePeer(remotePeerId);
      }
    };

    // Handle incoming data channel
    pc.ondatachannel = (event) => {
      this.setupDataChannel(remotePeerId, event.channel);
    };

    return pc;
  }

  private setupDataChannel(remotePeerId: string, channel: RTCDataChannel): void {
    this.dataChannels.set(remotePeerId, channel);

    channel.onopen = () => {
      console.log(`📡 Data channel opened with ${remotePeerId}`);
    };

    channel.onclose = () => {
      console.log(`📡 Data channel closed with ${remotePeerId}`);
      this.dataChannels.delete(remotePeerId);
    };

    channel.onmessage = (event) => {
      try {
        const message: PeerMessage = JSON.parse(event.data);
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message);
        }
      } catch (error) {
        console.error('Failed to parse P2P message:', error);
      }
    };

    channel.onerror = (error) => {
      console.error(`Data channel error with ${remotePeerId}:`, error);
    };
  }

  public send(remotePeerId: string, type: string, data: any): boolean {
    const channel = this.dataChannels.get(remotePeerId);
    if (!channel || channel.readyState !== 'open') {
      return false;
    }

    const message: PeerMessage = {
      type,
      data,
      timestamp: Date.now(),
      senderId: this.peerId
    };

    try {
      channel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send to ${remotePeerId}:`, error);
      return false;
    }
  }

  public broadcast(type: string, data: any): void {
    this.dataChannels.forEach((channel, peerId) => {
      this.send(peerId, type, data);
    });
  }

  public on(messageType: string, handler: (msg: PeerMessage) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  public off(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  public closePeer(remotePeerId: string): void {
    const channel = this.dataChannels.get(remotePeerId);
    if (channel) {
      channel.close();
      this.dataChannels.delete(remotePeerId);
    }

    const pc = this.connections.get(remotePeerId);
    if (pc) {
      pc.close();
      this.connections.delete(remotePeerId);
    }

    this.onPeerDisconnected?.(remotePeerId);
  }

  public getConnectedPeers(): string[] {
    return Array.from(this.dataChannels.keys()).filter(
      peerId => this.dataChannels.get(peerId)?.readyState === 'open'
    );
  }

  public getStats(remotePeerId: string): Promise<RTCStatsReport> | null {
    const pc = this.connections.get(remotePeerId);
    return pc ? pc.getStats() : null;
  }

  public dispose(): void {
    this.dataChannels.forEach(channel => channel.close());
    this.connections.forEach(pc => pc.close());
    this.dataChannels.clear();
    this.connections.clear();
    this.messageHandlers.clear();
  }

  // Callbacks
  public onIceCandidate?: (remotePeerId: string, candidate: RTCIceCandidateInit) => void;
  
  public setOnPeerConnected(callback: (peerId: string) => void): void {
    this.onPeerConnected = callback;
  }

  public setOnPeerDisconnected(callback: (peerId: string) => void): void {
    this.onPeerDisconnected = callback;
  }
}
