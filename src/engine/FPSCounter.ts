/**
 * FPSCounter.ts
 * FPS Counter Display (Quick Win #3)
 * Real-time FPS monitoring di game view
 */

export class FPSCounter {
  private element: HTMLDivElement;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 0;
  private visible: boolean = true;

  constructor(container?: HTMLElement) {
    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      pointer-events: none;
      user-select: none;
    `;
    
    (container || document.body).appendChild(this.element);
    this.update();
  }

  public update(): void {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      if (this.visible) {
        this.render();
      }
    }
  }

  private render(): void {
    const color = this.fps >= 55 ? '#00ff00' : 
                  this.fps >= 30 ? '#ffff00' : '#ff0000';
    
    this.element.style.color = color;
    this.element.textContent = `FPS: ${this.fps}`;
  }

  public getFPS(): number {
    return this.fps;
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.element.style.display = visible ? 'block' : 'none';
  }

  public dispose(): void {
    this.element.remove();
  }
}
