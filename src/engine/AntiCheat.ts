// 30. Anti-cheat: validasi server-side untuk score dan movement
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export class AntiCheat {
  private maxSpeed = 10;
  private maxScorePerSecond = 1000;
  private playerPositions = new Map<string, { x: number; y: number; z: number; timestamp: number }>();
  private playerScores = new Map<string, { score: number; timestamp: number }>();

  validateMovement(playerId: string, newPos: { x: number; y: number; z: number }): ValidationResult {
    const lastPos = this.playerPositions.get(playerId);
    
    if (!lastPos) {
      this.playerPositions.set(playerId, { ...newPos, timestamp: Date.now() });
      return { valid: true };
    }

    const distance = Math.sqrt(
      Math.pow(newPos.x - lastPos.x, 2) +
      Math.pow(newPos.y - lastPos.y, 2) +
      Math.pow(newPos.z - lastPos.z, 2)
    );

    const timeDelta = (Date.now() - lastPos.timestamp) / 1000;
    const speed = distance / timeDelta;

    if (speed > this.maxSpeed) {
      return { valid: false, reason: 'Speed too high' };
    }

    this.playerPositions.set(playerId, { ...newPos, timestamp: Date.now() });
    return { valid: true };
  }

  validateScore(playerId: string, newScore: number): ValidationResult {
    const lastScore = this.playerScores.get(playerId);
    
    if (!lastScore) {
      this.playerScores.set(playerId, { score: newScore, timestamp: Date.now() });
      return { valid: true };
    }

    const scoreDelta = newScore - lastScore.score;
    const timeDelta = (Date.now() - lastScore.timestamp) / 1000;
    const scoreRate = scoreDelta / timeDelta;

    if (scoreRate > this.maxScorePerSecond) {
      return { valid: false, reason: 'Score increase too fast' };
    }

    if (newScore < lastScore.score) {
      return { valid: false, reason: 'Score cannot decrease' };
    }

    this.playerScores.set(playerId, { score: newScore, timestamp: Date.now() });
    return { valid: true };
  }

  setMaxSpeed(speed: number): void {
    this.maxSpeed = speed;
  }

  setMaxScorePerSecond(score: number): void {
    this.maxScorePerSecond = score;
  }

  resetPlayer(playerId: string): void {
    this.playerPositions.delete(playerId);
    this.playerScores.delete(playerId);
  }
}
