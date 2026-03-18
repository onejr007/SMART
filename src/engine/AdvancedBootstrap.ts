/**
 * AdvancedBootstrap - Simplified wrapper for Phase 3 advanced systems
 * Provides safe integration without breaking existing code
 */

import { Engine } from './Core';
import { eventBus } from './EventBus';
import { RenderingBootstrap } from './RenderingBootstrap';
import { SocialBootstrap } from './SocialBootstrap';
import { NetworkBootstrap } from './NetworkBootstrap';

export interface AdvancedBootstrapConfig {
  enableNetwork?: boolean;
  enableSocial?: boolean;
  enableSecurity?: boolean;
  enableAdvancedRendering?: boolean;
  enableContent?: boolean;
  
  // Rendering config
  enableWorldStreaming?: boolean;
  enableOcclusionCulling?: boolean;
  enableTextureStreaming?: boolean;
  textureQuality?: 'low' | 'medium' | 'high';
  
  // Social config
  enableMatchmaking?: boolean;
  enableVoiceChat?: boolean;
  enableTextChat?: boolean;
  
  // Network config
  enableMultiplayer?: boolean;
  enablePresence?: boolean;
  enableLatencyCompensation?: boolean;
  multiplayerMode?: 'authoritative' | 'relay' | 'lockstep';
}

export class AdvancedBootstrap {
  private engine: Engine;
  private config: AdvancedBootstrapConfig;
  private isEnabled: boolean = false;
  
  // Bootstrap systems
  private renderingBootstrap: RenderingBootstrap | null = null;
  private socialBootstrap: SocialBootstrap | null = null;
  private networkBootstrap: NetworkBootstrap | null = null;
  
  // Feature flags
  private features = {
    network: false,
    social: false,
    security: false,
    rendering: false,
    content: false
  };

  constructor(engine: Engine, config: AdvancedBootstrapConfig = {}) {
    this.engine = engine;
    this.config = config;
    
    // Enable features based on config
    this.features.network = config.enableNetwork || false;
    this.features.social = config.enableSocial || false;
    this.features.security = config.enableSecurity || false;
    this.features.rendering = config.enableAdvancedRendering || false;
    this.features.content = config.enableContent || false;
    
    this.isEnabled = Object.values(this.features).some(f => f);
    
    if (this.isEnabled) {
      this.initializeBootstraps();
      this.setupEventListeners();
      console.log('✅ Advanced Bootstrap initialized', this.features);
    } else {
      console.log('📦 Advanced systems disabled');
    }
  }

  private initializeBootstraps() {
    // Initialize rendering bootstrap
    if (this.features.rendering) {
      try {
        this.renderingBootstrap = new RenderingBootstrap(
          this.engine['renderer'],
          this.engine.getCamera(),
          this.engine.getScene(),
          {
            enableWorldStreaming: this.config.enableWorldStreaming,
            enableOcclusionCulling: this.config.enableOcclusionCulling,
            enableTextureStreaming: this.config.enableTextureStreaming,
            textureQuality: this.config.textureQuality || 'medium'
          }
        );
      } catch (error) {
        console.warn('Failed to initialize rendering bootstrap:', error);
      }
    }
    
    // Initialize social bootstrap
    if (this.features.social) {
      try {
        this.socialBootstrap = new SocialBootstrap({
          enableMatchmaking: this.config.enableMatchmaking,
          enableVoiceChat: this.config.enableVoiceChat,
          enableTextChat: this.config.enableTextChat
        });
      } catch (error) {
        console.warn('Failed to initialize social bootstrap:', error);
      }
    }
    
    // Initialize network bootstrap
    if (this.features.network) {
      try {
        this.networkBootstrap = new NetworkBootstrap(this.engine, {
          enableMultiplayer: this.config.enableMultiplayer,
          enablePresence: this.config.enablePresence,
          enableLatencyCompensation: this.config.enableLatencyCompensation,
          multiplayerMode: this.config.multiplayerMode || 'authoritative'
        });
      } catch (error) {
        console.warn('Failed to initialize network bootstrap:', error);
      }
    }
  }

  private setupEventListeners() {
    // Network events
    if (this.features.network) {
      eventBus.on('network:connect', (data: any) => {
        console.log('🌐 Network connect requested:', data);
      });
    }
    
    // Social events
    if (this.features.social) {
      eventBus.on('social:matchmaking', (data: any) => {
        console.log('🎮 Matchmaking requested:', data);
      });
    }
    
    // Security events
    if (this.features.security) {
      eventBus.on('security:check', (data: any) => {
        console.log('🔒 Security check:', data);
      });
    }
  }

  public update(delta: number) {
    if (!this.isEnabled) return;
    
    // Update rendering systems
    if (this.renderingBootstrap) {
      this.renderingBootstrap.update(delta);
    }
    
    // Update network systems
    if (this.networkBootstrap) {
      this.networkBootstrap.update(delta);
    }
    
    // Social systems are event-driven, no update needed
  }

  // Network methods (placeholders)
  public connectNetwork(serverUrl: string, playerId: string) {
    if (!this.features.network || !this.networkBootstrap) {
      console.warn('Network not enabled');
      return;
    }
    this.networkBootstrap.connect(serverUrl, playerId);
  }

  public disconnectNetwork() {
    if (!this.features.network || !this.networkBootstrap) return;
    this.networkBootstrap.disconnect();
  }

  // Social methods (placeholders)
  public joinMatchmaking(playerId: string) {
    if (!this.features.social || !this.socialBootstrap) {
      console.warn('Social not enabled');
      return;
    }
    this.socialBootstrap.joinQueue(playerId);
  }

  public leaveMatchmaking(playerId: string) {
    if (!this.features.social || !this.socialBootstrap) return;
    this.socialBootstrap.leaveQueue(playerId);
  }

  public sendChatMessage(senderId: string, text: string) {
    if (!this.features.social || !this.socialBootstrap) {
      console.warn('Social not enabled');
      return;
    }
    this.socialBootstrap.sendMessage(senderId, text);
  }

  public enableVoiceChat(userId: string) {
    if (!this.features.social || !this.socialBootstrap) {
      console.warn('Social not enabled');
      return;
    }
    this.socialBootstrap.enableVoice(userId);
  }

  // Security methods (placeholders)
  public validateAction(playerId: string, action: string): boolean {
    if (!this.features.security) return true;
    console.log(`🔒 Validating action: ${playerId} - ${action}`);
    return true;
  }

  public reportViolation(playerId: string, type: string) {
    if (!this.features.security) return;
    console.warn(`⚠️ Violation reported: ${playerId} - ${type}`);
    eventBus.emit('security:violation', { playerId, type });
  }

  // Content methods (placeholders)
  public saveScene(scene: any) {
    if (!this.features.content) return null;
    console.log('💾 Saving scene...');
    return { success: true, sceneId: 'scene_' + Date.now() };
  }

  public loadScene(sceneId: string) {
    if (!this.features.content) return null;
    console.log(`📂 Loading scene: ${sceneId}`);
    return null;
  }

  // Getters
  public isNetworkEnabled() { return this.features.network; }
  public isSocialEnabled() { return this.features.social; }
  public isSecurityEnabled() { return this.features.security; }
  public isRenderingEnabled() { return this.features.rendering; }
  public isContentEnabled() { return this.features.content; }
  public isAdvancedEnabled() { return this.isEnabled; }
  
  public getRenderingBootstrap() { return this.renderingBootstrap; }
  public getSocialBootstrap() { return this.socialBootstrap; }
  public getNetworkBootstrap() { return this.networkBootstrap; }

  public dispose() {
    if (this.renderingBootstrap) {
      this.renderingBootstrap.dispose();
    }
    if (this.socialBootstrap) {
      this.socialBootstrap.dispose();
    }
    if (this.networkBootstrap) {
      this.networkBootstrap.dispose();
    }
    
    if (this.isEnabled) {
      console.log('✅ Advanced Bootstrap disposed');
    }
  }
}
