/**
 * Replay Verification System
 * Gunakan replay untuk verifikasi anti-cheat dan debugging desync
 */

interface ReplayFrame {
  timestamp: number;
  frameNumber: number;
  inputs: { [playerId: string]: any };
  state: { [entityId: string]: any };
  checksum: string;
}

interface ReplayData {
  version: string;
  gameId: string;
  sessionId: string;
  startTime: number;
  endTime: number;
  frames: ReplayFrame[];
  metadata: {
    playerCount: number;
    duration: number;
    totalFrames: number;
    checksumMismatches: number;
  };
}

interface VerificationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  frameErrors: { [frameNumber: number]: string[] };
  checksumMismatches: number;
  stateDesyncFrames: number[];
}

export class ReplayVerification {
  private isRecording = false;
  private currentReplay: ReplayData | null = null;
  private frameBuffer: ReplayFrame[] = [];
  private frameNumber = 0;
  private lastChecksum = '';
  
  private onStateCapture?: () => { [entityId: string]: any };
  private onInputCapture?: () => { [playerId: string]: any };
  private onChecksumCalculate?: (state: any) => string;

  constructor(
    private gameId: string,
    private sessionId: string = `session_${Date.now()}`
  ) {}

  /**
   * Start recording replay
   */
  startRecording(): void {
    if (this.isRecording) return;

    this.isRecording = true;
    this.frameNumber = 0;
    this.frameBuffer = [];
    
    this.currentReplay = {
      version: '1.0.0',
      gameId: this.gameId,
      sessionId: this.sessionId,
      startTime: Date.now(),
      endTime: 0,
      frames: [],
      metadata: {
        playerCount: 0,
        duration: 0,
        totalFrames: 0,
        checksumMismatches: 0
      }
    };

    console.log('🎬 Replay recording started');
  }

  /**
   * Stop recording replay
   */
  stopRecording(): ReplayData | null {
    if (!this.isRecording || !this.currentReplay) return null;

    this.isRecording = false;
    this.currentReplay.endTime = Date.now();
    this.currentReplay.frames = [...this.frameBuffer];
    this.currentReplay.metadata.duration = this.currentReplay.endTime - this.currentReplay.startTime;
    this.currentReplay.metadata.totalFrames = this.frameBuffer.length;

    const replay = this.currentReplay;
    this.currentReplay = null;
    this.frameBuffer = [];

    console.log('🎬 Replay recording stopped', {
      duration: replay.metadata.duration,
      frames: replay.metadata.totalFrames
    });

    return replay;
  }

  /**
   * Record frame
   */
  recordFrame(): void {
    if (!this.isRecording || !this.currentReplay) return;

    const timestamp = Date.now();
    const inputs = this.onInputCapture?.() || {};
    const state = this.onStateCapture?.() || {};
    const checksum = this.onChecksumCalculate?.(state) || this.calculateSimpleChecksum(state);

    // Check for checksum mismatch (desync detection)
    if (this.lastChecksum && this.lastChecksum !== checksum && this.frameNumber > 1) {
      this.currentReplay.metadata.checksumMismatches++;
      console.warn(`🚨 Checksum mismatch at frame ${this.frameNumber}:`, {
        expected: this.lastChecksum,
        actual: checksum
      });
    }

    const frame: ReplayFrame = {
      timestamp,
      frameNumber: this.frameNumber,
      inputs,
      state,
      checksum
    };

    this.frameBuffer.push(frame);
    this.lastChecksum = checksum;
    this.frameNumber++;

    // Limit buffer size untuk memory management
    if (this.frameBuffer.length > 10000) {
      this.frameBuffer.shift();
    }
  }

  /**
   * Verify replay integrity
   */
  verifyReplay(replay: ReplayData): VerificationResult {
    const result: VerificationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      frameErrors: {},
      checksumMismatches: 0,
      stateDesyncFrames: []
    };

    // Basic validation
    if (!replay.frames || replay.frames.length === 0) {
      result.errors.push('Replay has no frames');
      result.isValid = false;
      return result;
    }

    if (replay.version !== '1.0.0') {
      result.warnings.push(`Unsupported replay version: ${replay.version}`);
    }

    // Frame validation
    let lastTimestamp = 0;
    let lastChecksum = '';

    for (let i = 0; i < replay.frames.length; i++) {
      const frame = replay.frames[i];
      const frameErrors: string[] = [];

      // Timestamp validation
      if (frame.timestamp < lastTimestamp) {
        frameErrors.push('Timestamp goes backwards');
      }
      lastTimestamp = frame.timestamp;

      // Frame number validation
      if (frame.frameNumber !== i) {
        frameErrors.push(`Frame number mismatch: expected ${i}, got ${frame.frameNumber}`);
      }

      // Checksum validation
      const recalculatedChecksum = this.calculateSimpleChecksum(frame.state);
      if (frame.checksum !== recalculatedChecksum) {
        frameErrors.push('Checksum mismatch - possible tampering');
        result.checksumMismatches++;
        result.stateDesyncFrames.push(i);
      }

      // State continuity check
      if (i > 0 && this.detectStateDesync(replay.frames[i-1].state, frame.state)) {
        frameErrors.push('State desync detected');
        result.stateDesyncFrames.push(i);
      }

      if (frameErrors.length > 0) {
        result.frameErrors[i] = frameErrors;
        result.isValid = false;
      }
    }

    // Overall validation
    if (result.checksumMismatches > replay.frames.length * 0.1) {
      result.errors.push('Too many checksum mismatches - replay likely corrupted');
      result.isValid = false;
    }

    if (result.stateDesyncFrames.length > 0) {
      result.warnings.push(`${result.stateDesyncFrames.length} frames with state desync detected`);
    }

    return result;
  }

  /**
   * Detect state desync between frames
   */
  private detectStateDesync(prevState: any, currentState: any): boolean {
    // Simple desync detection - check for impossible state changes
    for (const entityId in currentState) {
      const prev = prevState[entityId];
      const current = currentState[entityId];

      if (!prev || !current) continue;

      // Check for teleportation (position change too large)
      if (prev.position && current.position) {
        const distance = Math.sqrt(
          Math.pow(current.position.x - prev.position.x, 2) +
          Math.pow(current.position.y - prev.position.y, 2) +
          Math.pow(current.position.z - prev.position.z, 2)
        );

        // If entity moved more than 100 units in one frame, it's suspicious
        if (distance > 100) {
          return true;
        }
      }

      // Check for impossible velocity changes
      if (prev.velocity && current.velocity) {
        const velocityChange = Math.sqrt(
          Math.pow(current.velocity.x - prev.velocity.x, 2) +
          Math.pow(current.velocity.y - prev.velocity.y, 2) +
          Math.pow(current.velocity.z - prev.velocity.z, 2)
        );

        // If velocity changed by more than 50 units/s in one frame, it's suspicious
        if (velocityChange > 50) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculate simple checksum
   */
  private calculateSimpleChecksum(state: any): string {
    const str = JSON.stringify(state, Object.keys(state).sort());
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }

  /**
   * Export replay to file
   */
  exportReplay(replay: ReplayData, filename?: string): void {
    const data = JSON.stringify(replay, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `replay_${replay.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Import replay from file
   */
  importReplay(file: File): Promise<ReplayData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const replay = JSON.parse(e.target?.result as string);
          resolve(replay);
        } catch (error) {
          reject(new Error('Invalid replay file format'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read replay file'));
      reader.readAsText(file);
    });
  }

  /**
   * Set callback functions
   */
  setStateCapture(callback: () => { [entityId: string]: any }): void {
    this.onStateCapture = callback;
  }

  setInputCapture(callback: () => { [playerId: string]: any }): void {
    this.onInputCapture = callback;
  }

  setChecksumCalculate(callback: (state: any) => string): void {
    this.onChecksumCalculate = callback;
  }

  /**
   * Get recording status
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  /**
   * Get current frame count
   */
  getCurrentFrameCount(): number {
    return this.frameNumber;
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.frameBuffer.length;
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.frameBuffer = [];
    this.frameNumber = 0;
  }

  /**
   * Dispose system
   */
  dispose(): void {
    this.stopRecording();
    this.clearBuffer();
  }
}