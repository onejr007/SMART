// 27. Matchmaking/lobby/room directory
export interface Player {
  id: string;
  name: string;
  rating: number;
  region: string;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  gameMode: string;
  region: string;
  isPrivate: boolean;
}

export class MatchmakingSystem {
  private rooms = new Map<string, Room>();
  private queue: Player[] = [];
  private matchmakingInterval = 5000; // 5 seconds

  createRoom(host: Player, config: Partial<Room>): Room {
    const room: Room = {
      id: crypto.randomUUID(),
      name: config.name || `${host.name}'s Room`,
      hostId: host.id,
      players: [host],
      maxPlayers: config.maxPlayers || 8,
      gameMode: config.gameMode || 'default',
      region: config.region || host.region,
      isPrivate: config.isPrivate || false
    };

    this.rooms.set(room.id, room);
    return room;
  }

  joinRoom(roomId: string, player: Player): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) {
      return false;
    }

    room.players.push(player);
    return true;
  }

  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    } else if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
    }
  }

  listRooms(filter?: { gameMode?: string; region?: string }): Room[] {
    let rooms = Array.from(this.rooms.values()).filter(r => !r.isPrivate);

    if (filter?.gameMode) {
      rooms = rooms.filter(r => r.gameMode === filter.gameMode);
    }

    if (filter?.region) {
      rooms = rooms.filter(r => r.region === filter.region);
    }

    return rooms;
  }

  joinQueue(player: Player): void {
    if (!this.queue.find(p => p.id === player.id)) {
      this.queue.push(player);
    }
  }

  leaveQueue(playerId: string): void {
    this.queue = this.queue.filter(p => p.id !== playerId);
  }

  matchmake(): Room[] {
    const newRooms: Room[] = [];

    while (this.queue.length >= 2) {
      const players = this.queue.splice(0, Math.min(8, this.queue.length));
      const host = players[0];
      
      const room = this.createRoom(host, {
        name: 'Matchmade Game',
        maxPlayers: 8,
        isPrivate: false
      });

      players.slice(1).forEach(p => this.joinRoom(room.id, p));
      newRooms.push(room);
    }

    return newRooms;
  }
}
