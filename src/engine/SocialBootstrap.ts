/**
 * SocialBootstrap - Social & Communication Systems Integration
 * Integrates matchmaking, voice chat, and text chat
 */

import { MatchmakingSystem } from './MatchmakingSystem';
import { VoiceChat } from './VoiceChat';
import { TextChat } from './TextChat';
import { eventBus } from './EventBus';

export interface SocialBootstrapConfig {
  enableMatchmaking?: boolean;
  enableVoiceChat?: boolean;
  enableTextChat?: boolean;
  matchmakingMode?: 'skill' | 'random' | 'party';
  maxRoomSize?: number;
  voiceChatQuality?: 'low' | 'medium' | 'high';
}

export class SocialBootstrap {
  private matchmaking: MatchmakingSystem | null = null;
  private voiceChat: VoiceChat | null = null;
  private textChat: TextChat | null = null;
  private isEnabled: boolean = false;

  constructor(config: SocialBootstrapConfig = {}) {
    if (config.enableMatchmaking === false && 
        config.enableVoiceChat === false && 
        config.enableTextChat === false) {
      console.log('💬 Social systems disabled');
      return;
    }
    
    this.isEnabled = true;
    
    // Matchmaking system
    if (config.enableMatchmaking !== false) {
      this.matchmaking = new MatchmakingSystem();
    }
    
    // Voice chat
    if (config.enableVoiceChat !== false) {
      this.voiceChat = new VoiceChat();
    }
    
    // Text chat
    if (config.enableTextChat !== false) {
      this.textChat = new TextChat();
    }
    
    this.setupEventListeners();
    console.log('✅ Social Bootstrap initialized');
  }

  private setupEventListeners() {
    if (!this.isEnabled) return;
    
    // Matchmaking events
    if (this.matchmaking) {
      eventBus.on('matchmaking:found', (roomId: string) => {
        console.log(`🎮 Match found: ${roomId}`);
      });
      
      eventBus.on('matchmaking:failed', () => {
        console.log('🎮 Matchmaking failed');
      });
    }
    
    // Voice chat events
    if (this.voiceChat) {
      eventBus.on('voice:connected', (peerId: string) => {
        console.log(`🎤 Voice connected: ${peerId}`);
      });
      
      eventBus.on('voice:disconnected', (peerId: string) => {
        console.log(`🎤 Voice disconnected: ${peerId}`);
      });
    }
    
    // Text chat events
    if (this.textChat) {
      eventBus.on('chat:message', (message: any) => {
        console.log(`💬 Chat: ${message.sender}: ${message.text}`);
      });
    }
  }

  // Matchmaking methods
  public async joinQueue(playerId: string, skillLevel?: number) {
    if (!this.matchmaking) {
      console.warn('Matchmaking not enabled');
      return null;
    }
    
    const player = {
      id: playerId,
      name: 'Player',
      rating: skillLevel || 1000,
      region: 'default'
    };
    
    this.matchmaking.joinQueue(player);
    return player;
  }

  public leaveQueue(playerId: string) {
    if (this.matchmaking) {
      this.matchmaking.leaveQueue(playerId);
    }
  }

  public createRoom(roomId: string, hostId: string, maxPlayers: number = 10) {
    if (this.matchmaking) {
      const host = {
        id: hostId,
        name: 'Host',
        rating: 1000,
        region: 'default'
      };
      this.matchmaking.createRoom(host, { maxPlayers });
    }
  }

  // Voice chat methods
  public async enableVoice(userId: string) {
    if (!this.voiceChat) {
      console.warn('Voice chat not enabled');
      return;
    }
    
    await this.voiceChat.initLocalStream();
    console.log('🎤 Voice chat enabled');
  }

  public disableVoice() {
    if (this.voiceChat) {
      this.voiceChat.dispose();
    }
  }

  public mutePlayer(playerId: string) {
    if (this.voiceChat) {
      this.voiceChat.mutePeer(playerId, true);
    }
  }

  public unmutePlayer(playerId: string) {
    if (this.voiceChat) {
      this.voiceChat.mutePeer(playerId, false);
    }
  }

  // Text chat methods
  public sendMessage(senderId: string, text: string, channel: string = 'global') {
    if (!this.textChat) {
      console.warn('Text chat not enabled');
      return;
    }
    
    this.textChat.sendMessage(senderId, 'Player', text);
  }

  public muteTextChat(playerId: string) {
    if (this.textChat) {
      console.log('Muting text chat for player:', playerId);
    }
  }

  public unmuteTextChat(playerId: string) {
    if (this.textChat) {
      console.log('Unmuting text chat for player:', playerId);
    }
  }

  public reportPlayer(reporterId: string, reportedId: string, reason: string) {
    if (this.textChat) {
      this.textChat.reportUser(reporterId, reportedId);
    }
  }

  // Getters
  public getMatchmaking() { return this.matchmaking; }
  public getVoiceChat() { return this.voiceChat; }
  public getTextChat() { return this.textChat; }
  public isSocialEnabled() { return this.isEnabled; }

  public dispose() {
    if (this.voiceChat) {
      this.voiceChat.dispose();
    }
    console.log('✅ Social Bootstrap disposed');
  }
}
