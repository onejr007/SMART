// 26. Presence anti-ghost dengan session terverifikasi
export interface Session {
  userId: string;
  sessionId: string;
  lastHeartbeat: number;
  verified: boolean;
}

export class PresenceAntiGhost {
  private sessions = new Map<string, Session>();
  private heartbeatTimeout = 30000; // 30 seconds
  private verificationRequired = true;

  createSession(userId: string): string {
    const sessionId = crypto.randomUUID();
    const session: Session = {
      userId,
      sessionId,
      lastHeartbeat: Date.now(),
      verified: !this.verificationRequired
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  verifySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.verified = true;
    return true;
  }

  heartbeat(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.verified) return false;

    session.lastHeartbeat = Date.now();
    return true;
  }

  reconcile(): string[] {
    const now = Date.now();
    const ghostSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastHeartbeat > this.heartbeatTimeout) {
        ghostSessions.push(sessionId);
        this.sessions.delete(sessionId);
      }
    }

    return ghostSessions;
  }

  isActive(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.verified) return false;

    const now = Date.now();
    return now - session.lastHeartbeat < this.heartbeatTimeout;
  }

  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(s => this.isActive(s.sessionId));
  }
}
