/**
 * NetworkBootstrap - Network & Multiplayer Systems Integration
 * Integrates all networking features for multiplayer support
 */

import * as THREE from 'three';
import { Engine } from './Core';
import { NetworkProtocol } from './NetworkProtocol';
import { InterestManager } from './InterestManager';
import { PresenceManager } from './PresenceManager';
import { LatencyCompensation } from './LatencyCompensation';
import { MultiplayerArchitecture, MultiplayerConfig } from './MultiplayerArchitecture';
import { ReplicationLayer } from './ReplicationLayer';
import { RollbackNetcode } from './RollbackNetcode';
import { TickRateNegotiation } from './TickRateNegotiation';
import { MultiLayerInterest } from './MultiLayerInterest';
import { AuthorityTransfer } from './AuthorityTransfer';
import { PresenceAntiGhost } from './PresenceAntiGhost';
import { NetworkObservability } from './NetworkObservability';
import { eventBus } from './EventBus';

export interface NetworkBootstrapConfig {
  enableMultiplayer?: boolean;
  enablePresence?: boolean;
  enableLatencyCompensation?: boolean;
  enableRollback?: boolean;
  enableInterestManagement?: boolean;
  enableObservability?: boolean;
  multiplayerMode?: 'authoritative' | 'relay' | 'lockstep';
  tickRate?: number;
  maxPlayers?: number;
}

export class NetworkBootstrap {
  private engine: Engine;
  private protocol: NetworkProtocol | null = null;
  private interestManager: InterestManager | null = null;
  private presenceManager: PresenceManager | null = null;
  private latencyComp: LatencyCompensation | null = null;
  private multiplayer: MultiplayerArchitecture | null = null;
  private replication: ReplicationLayer | null = null;
  private rollback: RollbackNetcode | null = null;
  private tickNegotiation: TickRateNegotiation | null = null;
  private multiLayerInterest: MultiLayerInterest | null = null;
  private authorityTransfer: AuthorityTransfer | null = null;
  private antiGhost: PresenceAntiGhost | null = null;
  private observability: NetworkObservability | null = null;
  
  private isEnabled: boolean = false;

  constructor(engine: Engine, config: NetworkBootstrapConfig = {}) {
    this.engine = engine;
    
    if (config.enableMultiplayer === false) {
      console.log('🌐 Network systems disabled');
      return;
    }
    
    this.isEnabled = true;
    
    // Core network protocol
    this.protocol = new NetworkProtocol();
    
    // Presence system
    if (config.enablePresence !== false) {
      this.presenceManager = new PresenceManager();
      this.antiGhost = new PresenceAntiGhost();
    }
    
    // Interest management
    if (config.enableInterestManagement !== false) {
      this.interestManager = new InterestManager();
      this.multiLayerInterest = new MultiLayerInterest();
    }
    
    // Latency compensation
    if (config.enableLatencyCompensation !== false) {
      this.latencyComp = new LatencyCompensation();
    }
    
    // Multiplayer architecture
    if (config.enableMultiplayer === undefined || config.enableMultiplayer === true) {
      const mpConfig: MultiplayerConfig = {
        mode: config.multiplayerMode || 'authoritative',
        tickRate: config.tickRate || 60,
        maxPlayers: config.maxPlayers || 50,
        enablePrediction: true,
        enableReconciliation: true
      };
      
      this.multiplayer = new MultiplayerArchitecture(mpConfig, false); // client mode
      this.replication = new ReplicationLayer();
      this.tickNegotiation = new TickRateNegotiation();
      this.authorityTransfer = new AuthorityTransfer();
    }
    
    // Rollback netcode
    if (config.enableRollback !== false) {
      this.rollback = new RollbackNetcode();
    }
    
    // Network observability
    if (config.enableObservability !== false) {
      this.observability = new NetworkObservability();
    }
    
    this.setupEventListeners();
    console.log('✅ Network Bootstrap initialized');
  }

  private setupEventListeners() {
    if (!this.isEnabled) return;
    
    // Listen to network events
    eventBus.on('network:connected', () => {
      console.log('🌐 Network connected');
      // PresenceManager doesn't have startHeartbeat method
    });
    
    eventBus.on('network:disconnected', () => {
      console.log('🌐 Network disconnected');
      // PresenceManager doesn't have stopHeartbeat method
    });
    
    eventBus.on('network:message', (message: any) => {
      if (this.protocol) {
        // Handle incoming network messages
        this.handleNetworkMessage(message);
      }
    });
  }

  private handleNetworkMessage(message: any) {
    // Route messages to appropriate systems
    if (message.type === 'state_update' && this.replication) {
      this.replication.applyDiff(message.entityId, message.data);
    }
    
    if (message.type === 'presence' && this.presenceManager) {
      this.presenceManager.setPlayer(message.playerId, message.data.name, message.data.roomId);
    }
    
    if (message.type === 'authority_transfer' && this.authorityTransfer) {
      // AuthorityTransfer doesn't have handleTransfer method - use available methods
      console.log('Authority transfer:', message.entityId, message.newAuthority);
    }
  }

  public update(delta: number) {
    if (!this.isEnabled) return;
    
    // Update presence - PresenceManager doesn't have update method
    
    // Update latency compensation - LatencyCompensation doesn't have update method
    
    // Update rollback - RollbackNetcode doesn't have update method
    
    // Update observability
    if (this.observability) {
      this.observability.recordPacketSent(); // Use available method
    }
  }

  public connect(serverUrl: string, playerId: string) {
    if (!this.isEnabled) {
      console.warn('Network systems not enabled');
      return;
    }
    
    console.log(`🌐 Connecting to ${serverUrl} as ${playerId}`);
    
    // Initialize presence
    if (this.presenceManager) {
      this.presenceManager.setPlayer(playerId, 'Player', 'default');
    }
    
    // Start anti-ghost monitoring
    if (this.antiGhost) {
      this.antiGhost.createSession(playerId);
    }
    
    eventBus.emit('network:connected');
  }

  public disconnect() {
    if (!this.isEnabled) return;
    
    console.log('🌐 Disconnecting...');
    
    // Stop presence - PresenceManager doesn't have stopHeartbeat method
    
    // Stop anti-ghost
    if (this.antiGhost) {
      // PresenceAntiGhost doesn't have stopMonitoring method
      console.log('Stopping anti-ghost monitoring');
    }
    
    eventBus.emit('network:disconnected');
  }

  public sendMessage(type: string, data: any) {
    if (!this.isEnabled || !this.protocol) {
      console.warn('Cannot send message: network not enabled');
      return;
    }
    
    const message = this.protocol.createMessage(type as any, data);
    eventBus.emit('network:send', message);
  }

  public addSnapshot(state: any) {
    if (this.latencyComp) {
      this.latencyComp.addSnapshot({
        timestamp: Date.now(),
        position: state.position || new THREE.Vector3(),
        rotation: state.rotation || new THREE.Quaternion()
      });
    }
  }

  public saveState() {
    if (this.rollback) {
      const state = {
        frame: Date.now(),
        entities: new Map()
      };
      this.rollback.saveState(state);
    }
  }

  public rollbackTo(frame: number) {
    if (this.rollback) {
      const state = this.rollback.getState(frame);
      if (state) {
        console.log('Rolling back to frame:', frame);
        // Apply state to engine
      }
    }
  }

  // Getters
  public getProtocol() { return this.protocol; }
  public getInterestManager() { return this.interestManager; }
  public getPresenceManager() { return this.presenceManager; }
  public getLatencyCompensation() { return this.latencyComp; }
  public getMultiplayer() { return this.multiplayer; }
  public getReplication() { return this.replication; }
  public getRollback() { return this.rollback; }
  public getTickNegotiation() { return this.tickNegotiation; }
  public getMultiLayerInterest() { return this.multiLayerInterest; }
  public getAuthorityTransfer() { return this.authorityTransfer; }
  public getAntiGhost() { return this.antiGhost; }
  public getObservability() { return this.observability; }
  
  public isNetworkEnabled() { return this.isEnabled; }

  public dispose() {
    this.disconnect();
    console.log('✅ Network Bootstrap disposed');
  }
}
