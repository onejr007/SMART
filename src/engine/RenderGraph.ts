/**
 * Render Graph System
 * Susun pass (main, postfx, debug) lebih terstruktur untuk eksperimen fitur
 */

import * as THREE from 'three';
import { WebGLRenderer, Scene, Camera, WebGLRenderTarget, Vector2 } from 'three';

interface RenderPass {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  inputs: string[];
  outputs: string[];
  execute: (context: RenderContext) => void;
  setup?: (context: RenderContext) => void;
  cleanup?: (context: RenderContext) => void;
}

interface RenderTarget {
  id: string;
  target: WebGLRenderTarget;
  format: number;
  type: number;
  size: Vector2;
  persistent: boolean;
}

interface RenderContext {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: Camera;
  targets: Map<string, RenderTarget>;
  uniforms: Map<string, any>;
  deltaTime: number;
  frameCount: number;
}

interface RenderGraphStats {
  totalPasses: number;
  activePasses: number;
  renderTime: number;
  passTimings: { [passId: string]: number };
}

export class RenderGraph {
  private passes = new Map<string, RenderPass>();
  private targets = new Map<string, RenderTarget>();
  private uniforms = new Map<string, any>();
  private executionOrder: string[] = [];
  private context: RenderContext;
  private stats: RenderGraphStats = {
    totalPasses: 0,
    activePasses: 0,
    renderTime: 0,
    passTimings: {}
  };
  private frameCount = 0;

  constructor(
    private renderer: WebGLRenderer,
    private scene: Scene,
    private camera: Camera
  ) {
    this.context = {
      renderer,
      scene,
      camera,
      targets: this.targets,
      uniforms: this.uniforms,
      deltaTime: 0,
      frameCount: 0
    };

    this.setupDefaultTargets();
    this.setupDefaultPasses();
  }

  /**
   * Setup default render targets
   */
  private setupDefaultTargets(): void {
    const size = this.renderer.getSize(new Vector2());
    
    // Main color buffer
    this.addRenderTarget('color', {
      size,
      format: 1023, // RGBAFormat
      type: 1009,   // UnsignedByteType
      persistent: true
    });

    // Depth buffer
    this.addRenderTarget('depth', {
      size,
      format: 1026, // DepthFormat
      type: 1012,   // UnsignedIntType
      persistent: true
    });

    // HDR buffer for post-processing
    this.addRenderTarget('hdr', {
      size,
      format: 1023, // RGBAFormat
      type: 1016,   // FloatType
      persistent: true
    });
  }

  /**
   * Setup default render passes
   */
  private setupDefaultPasses(): void {
    // Main geometry pass
    this.addPass({
      id: 'geometry',
      name: 'Geometry Pass',
      enabled: true,
      priority: 100,
      inputs: [],
      outputs: ['color', 'depth'],
      execute: (context) => {
        const colorTarget = context.targets.get('color')?.target;
        const depthTarget = context.targets.get('depth')?.target;
        
        if (colorTarget) {
          context.renderer.setRenderTarget(colorTarget);
          context.renderer.render(context.scene, context.camera);
        }
      }
    });

    // Shadow pass
    this.addPass({
      id: 'shadow',
      name: 'Shadow Pass',
      enabled: true,
      priority: 50,
      inputs: [],
      outputs: ['shadowMap'],
      execute: (context) => {
        // Shadow rendering logic would go here
        // This is a simplified version
      }
    });

    // Post-processing pass
    this.addPass({
      id: 'postprocess',
      name: 'Post Processing',
      enabled: true,
      priority: 200,
      inputs: ['color', 'depth'],
      outputs: ['final'],
      execute: (context) => {
        // Post-processing effects would go here
        const colorTarget = context.targets.get('color')?.target;
        
        if (colorTarget) {
          // Copy to screen
          context.renderer.setRenderTarget(null);
          // Render full-screen quad with color texture
        }
      }
    });

    // Debug pass
    this.addPass({
      id: 'debug',
      name: 'Debug Overlay',
      enabled: false,
      priority: 300,
      inputs: ['final'],
      outputs: [],
      execute: (context) => {
        // Debug rendering (wireframes, gizmos, etc.)
      }
    });

    this.rebuildExecutionOrder();
  }

  /**
   * Add render pass
   */
  addPass(pass: RenderPass): void {
    this.passes.set(pass.id, pass);
    this.rebuildExecutionOrder();
    
    // Setup pass if needed
    if (pass.setup) {
      pass.setup(this.context);
    }
  }

  /**
   * Remove render pass
   */
  removePass(passId: string): boolean {
    const pass = this.passes.get(passId);
    if (pass) {
      // Cleanup pass if needed
      if (pass.cleanup) {
        pass.cleanup(this.context);
      }
      
      this.passes.delete(passId);
      this.rebuildExecutionOrder();
      return true;
    }
    return false;
  }

  /**
   * Enable/disable pass
   */
  setPassEnabled(passId: string, enabled: boolean): void {
    const pass = this.passes.get(passId);
    if (pass) {
      pass.enabled = enabled;
    }
  }

  /**
   * Add render target
   */
  addRenderTarget(id: string, options: {
    size: Vector2;
    format: number;
    type: number;
    persistent?: boolean;
  }): void {
    const target = new WebGLRenderTarget(options.size.x, options.size.y, {
      format: options.format as THREE.PixelFormat,
      type: options.type as THREE.TextureDataType
    });

    this.targets.set(id, {
      id,
      target,
      format: options.format,
      type: options.type,
      size: options.size.clone(),
      persistent: options.persistent || false
    });
  }

  /**
   * Remove render target
   */
  removeRenderTarget(id: string): void {
    const renderTarget = this.targets.get(id);
    if (renderTarget) {
      renderTarget.target.dispose();
      this.targets.delete(id);
    }
  }

  /**
   * Set uniform value
   */
  setUniform(name: string, value: any): void {
    this.uniforms.set(name, value);
  }

  /**
   * Get uniform value
   */
  getUniform(name: string): any {
    return this.uniforms.get(name);
  }

  /**
   * Rebuild execution order based on dependencies and priorities
   */
  private rebuildExecutionOrder(): void {
    const passes = Array.from(this.passes.values());
    
    // Sort by priority first
    passes.sort((a, b) => a.priority - b.priority);
    
    // TODO: Add proper dependency resolution
    // For now, just use priority order
    this.executionOrder = passes.map(pass => pass.id);
  }

  /**
   * Execute render graph
   */
  render(deltaTime: number): void {
    const startTime = performance.now();
    
    this.context.deltaTime = deltaTime;
    this.context.frameCount = this.frameCount++;
    
    let activePasses = 0;
    this.stats.passTimings = {};

    // Execute passes in order
    for (const passId of this.executionOrder) {
      const pass = this.passes.get(passId);
      
      if (pass && pass.enabled) {
        const passStartTime = performance.now();
        
        try {
          pass.execute(this.context);
          activePasses++;
        } catch (error) {
          console.error(`Error in render pass '${pass.name}':`, error);
        }
        
        const passEndTime = performance.now();
        this.stats.passTimings[passId] = passEndTime - passStartTime;
      }
    }

    const endTime = performance.now();
    
    // Update stats
    this.stats.totalPasses = this.passes.size;
    this.stats.activePasses = activePasses;
    this.stats.renderTime = endTime - startTime;
  }

  /**
   * Resize render targets
   */
  resize(width: number, height: number): void {
    const newSize = new Vector2(width, height);
    
    for (const [id, renderTarget] of this.targets) {
      if (!renderTarget.size.equals(newSize)) {
        renderTarget.target.setSize(width, height);
        renderTarget.size.copy(newSize);
      }
    }
  }

  /**
   * Get render pass
   */
  getPass(passId: string): RenderPass | undefined {
    return this.passes.get(passId);
  }

  /**
   * Get all passes
   */
  getAllPasses(): RenderPass[] {
    return Array.from(this.passes.values());
  }

  /**
   * Get render target
   */
  getRenderTarget(id: string): RenderTarget | undefined {
    return this.targets.get(id);
  }

  /**
   * Get execution order
   */
  getExecutionOrder(): string[] {
    return [...this.executionOrder];
  }

  /**
   * Get render statistics
   */
  getStats(): RenderGraphStats {
    return { ...this.stats };
  }

  /**
   * Export graph configuration
   */
  exportConfig(): any {
    const passes = Array.from(this.passes.values()).map(pass => ({
      id: pass.id,
      name: pass.name,
      enabled: pass.enabled,
      priority: pass.priority,
      inputs: pass.inputs,
      outputs: pass.outputs
    }));

    const targets = Array.from(this.targets.values()).map(target => ({
      id: target.id,
      format: target.format,
      type: target.type,
      size: { x: target.size.x, y: target.size.y },
      persistent: target.persistent
    }));

    return {
      passes,
      targets,
      executionOrder: this.executionOrder
    };
  }

  /**
   * Import graph configuration
   */
  importConfig(config: any): void {
    // Clear existing passes (except built-in ones)
    for (const [id, pass] of this.passes) {
      if (pass.cleanup) {
        pass.cleanup(this.context);
      }
    }
    this.passes.clear();

    // Clear render targets
    for (const [id, target] of this.targets) {
      target.target.dispose();
    }
    this.targets.clear();

    // Recreate from config
    // This would need proper pass factory implementation
    console.warn('Import config not fully implemented');
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Cleanup passes
    for (const [id, pass] of this.passes) {
      if (pass.cleanup) {
        pass.cleanup(this.context);
      }
    }
    this.passes.clear();

    // Dispose render targets
    for (const [id, target] of this.targets) {
      target.target.dispose();
    }
    this.targets.clear();

    this.uniforms.clear();
  }
}