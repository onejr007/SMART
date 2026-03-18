/**
 * Presence Manager (Rekomendasi #47)
 * Heartbeat TTL untuk deteksi player online/room occupancy
 */

import { eventBus } from './EventBus';

export interface PlayerPresence {
  id: string;
  name: string;
  roomId: string;
  lastHeartbeat: number;
  isOnline: boolean;
}

export class PresenceManager {
  private players: Map<string, PlayerPresence> = new Map();
  private heartbeatInterval: number = 5000; // 5 seconds
  private timeoutThreshold: number = 15000; // 15 seconds
  private checkInterval?: number;
  
  constructor() {
    this.startHeartbeatCheck();
  }
  
  public setPlayer(id: string, name: string, roomId: string): void {
    const existing = this.players.get(id);
    
    if (existing) {
      existing.lastHeartbeat = Date.now();
      existing.isOnline = true;
      existing.roomId = roomId;
    } else {
      this.players.set(id, {
        id,
        name,
        roomId,
        lastHeartbeat: Date.now(),
        isOnline: true,
      });
      
      eventBus.emit('presence:player-joined', { id, name, roomId });
    }
  }
  
  public heartbeat(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.lastHeartbeat = Date.now();
      
      if (!player.isOnline) {
        player.isOnline = true;
        eventBus.emit('presence:player-reconnected', { id: playerId });
      }
    }
  }
  
  public removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      eventBus.emit('presence:player-left', { id: playerId, name: player.name });
    }
  }
  
  public getPlayer(playerId: string): PlayerPresence | undefined {
    return this.players.get(playerId);
  }
  
  public getPlayersInRoom(roomId: string): PlayerPresence[] {
    return Array.from(this.players.values()).filter(
      p => p.roomId === roomId && p.isOnline
    );
  }
  
  public getRoomOccupancy(roomId: string): number {
    return this.getPlayersInRoom(roomId).length;
  }
  
  public getAllOnlinePlayers(): PlayerPresence[] {
    return Array.from(this.players.values()).filter(p => p.isOnline);
  }
  
  private startHeartbeatCheck(): void {
    this.checkInterval = window.setInterval(() => {
      const now = Date.now();
      
      this.players.forEach((player, id) => {
        const timeSinceHeartbeat = now - player.lastHeartbeat;
        
        if (timeSinceHeartbeat > this.timeoutThreshold && player.isOnline) {
          player.isOnline = false;
          eventBus.emit('presence:player-timeout', { id, name: player.name });
          console.warn(`Player ${player.name} (${id}) timed out`);
        }
      });
    }, this.heartbeatInterval);
  }
  
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }
  
  public clear(): void {
    this.players.clear();
  }
  
  public getStats() {
    const rooms = new Map<string, number>();
    
    this.players.forEach(player => {
      if (player.isOnline) {
        rooms.set(player.roomId, (rooms.get(player.roomId) || 0) + 1);
      }
    });
    
    return {
      totalPlayers: this.players.size,
      onlinePlayers: this.getAllOnlinePlayers().length,
      rooms: Array.from(rooms.entries()).map(([roomId, count]) => ({
        roomId,
        playerCount: count,
      })),
    };
  }
}

export const presenceManager = new PresenceManager();
