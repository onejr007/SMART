// 22. Rollback netcode untuk game kompetitif
export interface GameState {
  frame: number;
  entities: Map<string, any>;
}

export class RollbackNetcode {
  private stateHistory: GameState[] = [];
  private maxHistory = 60; // 1 second at 60fps
  private currentFrame = 0;

  saveState(state: GameState): void {
    this.stateHistory.push({ ...state, frame: this.currentFrame });
    if (this.stateHistory.length > this.maxHistory) {
      this.stateHistory.shift();
    }
    this.currentFrame++;
  }

  rollback(targetFrame: number): GameState | null {
    const state = this.stateHistory.find(s => s.frame === targetFrame);
    if (!state) return null;

    // Remove all states after target frame
    this.stateHistory = this.stateHistory.filter(s => s.frame <= targetFrame);
    this.currentFrame = targetFrame;

    return this.cloneState(state);
  }

  resimulate(fromFrame: number, toFrame: number, simulateFn: (state: GameState) => void): void {
    let state = this.rollback(fromFrame);
    if (!state) return;

    for (let frame = fromFrame + 1; frame <= toFrame; frame++) {
      simulateFn(state);
      this.saveState(state);
    }
  }

  getState(frame: number): GameState | null {
    const state = this.stateHistory.find(s => s.frame === frame);
    return state ? this.cloneState(state) : null;
  }

  getCurrentFrame(): number {
    return this.currentFrame;
  }

  private cloneState(state: GameState): GameState {
    return {
      frame: state.frame,
      entities: new Map(state.entities)
    };
  }

  clear(): void {
    this.stateHistory = [];
    this.currentFrame = 0;
  }
}
