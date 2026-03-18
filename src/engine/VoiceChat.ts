// 28. Voice chat (WebRTC) dengan hook moderasi
export interface VoicePeer {
  id: string;
  connection: RTCPeerConnection;
  stream: MediaStream | null;
  muted: boolean;
  volume: number;
}

export class VoiceChat {
  private localStream: MediaStream | null = null;
  private peers = new Map<string, VoicePeer>();
  private moderationHook: ((peerId: string, event: string) => boolean) | null = null;

  setModerationHook(hook: (peerId: string, event: string) => boolean): void {
    this.moderationHook = hook;
  }

  async initLocalStream(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      console.error('Failed to get local stream:', error);
    }
  }

  async connectToPeer(peerId: string, isInitiator: boolean): Promise<void> {
    if (this.moderationHook && !this.moderationHook(peerId, 'connect')) {
      console.warn('Connection blocked by moderation');
      return;
    }

    const connection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    const peer: VoicePeer = {
      id: peerId,
      connection,
      stream: null,
      muted: false,
      volume: 1.0
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        connection.addTrack(track, this.localStream!);
      });
    }

    connection.ontrack = (event) => {
      peer.stream = event.streams[0];
      this.playPeerAudio(peer);
    };

    this.peers.set(peerId, peer);

    if (isInitiator) {
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      // Send offer to peer via signaling server
    }
  }

  disconnectFromPeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.connection.close();
      this.peers.delete(peerId);
    }
  }

  mutePeer(peerId: string, muted: boolean): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.muted = muted;
      if (peer.stream) {
        peer.stream.getAudioTracks().forEach(track => {
          track.enabled = !muted;
        });
      }
    }
  }

  setPeerVolume(peerId: string, volume: number): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.volume = Math.max(0, Math.min(1, volume));
    }
  }

  private playPeerAudio(peer: VoicePeer): void {
    if (!peer.stream) return;

    const audio = new Audio();
    audio.srcObject = peer.stream;
    audio.volume = peer.volume;
    audio.play();
  }

  dispose(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    this.peers.forEach(peer => peer.connection.close());
    this.peers.clear();
  }
}
