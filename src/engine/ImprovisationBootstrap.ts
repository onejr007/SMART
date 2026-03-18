/**
 * Improvisation Bootstrap System
 * Central integration hub untuk semua sistem improvisasi
 */

// Import systems that exist
import { CollisionMatrix } from './CollisionMatrix';
import { PhysicsWorker } from './PhysicsWorker';
import { FixedTimeStep } from './FixedTimeStep';
import { PhysicsSleep } from './PhysicsSleep';
import { PhysicsDeterminism } from './PhysicsDeterminism';
import { InterestManagementSystem } from './InterestManagement';
import { ProgressiveLoadingManager } from './ProgressiveLoading';
import { VisibilityCache } from './VisibilityCache';
import { NATTraversal } from './NATTraversal';
import { ReplayVerification } from './ReplayVerification';
import { DataSeparation } from './DataSeparation';
import { AssetBrowser } from './AssetBrowser';
import { RenderGraph } from './RenderGraph';
import { SignedUGC } from './SignedUGC';
import { CollaborativeEditor } from './CollaborativeEditor';

// Import additional systems
import { GPUTimingManager } from './GPUTiming';
import { ShaderWarmupManager } from './ShaderWarmup';
import { TextureStreamingManager } from './TextureStreaming';
import { MaterialBatchingManager } from './MaterialBatching';
import { LODSystemManager } from './LODSystem';
import { OcclusionCullingManager } from './OcclusionCulling';
import { ShadowBudgetManager } from './ShadowBudget';
import { NetworkAuthorityManager } from './NetworkAuthority';
import { StateSnapshotManager } from './StateSnapshot';
import { MessageValidationManager } from './MessageValidation';
import { DeltaCompressionManager } from './DeltaCompression';
import { ReliabilityStrategyManager } from './ReliabilityStrategy';
import { AssetIntegrityManager } from './AssetIntegrity';
import { SchemaMigrationManager } from './SchemaMigration';
import { WriteThrottlingManager } from './WriteThrottling';
import { IdempotentWriteManager } from './IdempotentWrite';
import { OfflineEditorManager } from './OfflineEditor';
import { PublishWorkflowManager } from './PublishWorkflow';
import { CommandStackManager } from './CommandStack';
import { SceneValidationManager } from './SceneValidation';
import { DockablePanelsManager } from './DockablePanels';
import { GizmoSnappingManager } from './GizmoSnapping';

export interface ImprovisationConfig {
  mode: 'play' | 'editor' | 'headless';
  features: {
    networking: boolean;
    physics: boolean;
    rendering: boolean;
    editor: boolean;
    persistence: boolean;
  };
  performance: {
    targetFPS: number;
    enableWorkers: boolean;
    enableCaching: boolean;
  };
  networking?: {
    enableP2P: boolean;
    maxPeers: number;
    iceServers: any[];
  };
}

export class ImprovisationBootstrap {
  private systems = new Map<string, any>();
  private initialized = false;
  private config: ImprovisationConfig;

  constructor(config: Partial<ImprovisationConfig> = {}) {
    this.config = {
      mode: 'play',
      features: {
        networking: false,
        physics: true,
        rendering: true,
        editor: false,
        persistence: false
      },
      performance: {
        targetFPS: 60,
        enableWorkers: false,
        enableCaching: true
      },
      ...config
    };
  }

  /**
   * Initialize all improvisation systems
   */
  async init(renderer: any, scene: any, camera: any, firebaseRef?: any, physicsWorld?: any): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 Initializing Improvisation Systems...');

    try {
      // Initialize feature-specific systems
      if (this.config.features.rendering) {
        await this.initRenderingSystems(renderer, scene, camera);
      }

      if (this.config.features.physics) {
        await this.initPhysicsSystems(physicsWorld);
      }

      if (this.config.features.networking) {
        await this.initNetworkingSystems();
      }

      if (this.config.features.editor) {
        await this.initEditorSystems();
      }

      if (this.config.features.persistence && firebaseRef) {
        await this.initPersistenceSystems(firebaseRef);
      }

      // Initialize asset systems
      await this.initAssetSystems();

      this.initialized = true;
      console.log('✅ Improvisation Systems initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Improvisation Systems:', error);
      throw error;
    }
  }

  /**
   * Initialize rendering systems
   */
  private async initRenderingSystems(renderer: any, scene: any, camera: any): Promise<void> {
    // GPU Timing
    const gpuTiming = new GPUTimingManager(renderer);
    this.systems.set('gpuTiming', gpuTiming);

    // Shader Warmup
    const shaderWarmup = new ShaderWarmupManager(renderer);
    this.systems.set('shaderWarmup', shaderWarmup);

    // Texture Streaming
    const textureStreaming = new TextureStreamingManager();
    this.systems.set('textureStreaming', textureStreaming);

    // Material Batching
    const materialBatching = new MaterialBatchingManager(scene);
    this.systems.set('materialBatching', materialBatching);

    // LOD System
    const lodSystem = new LODSystemManager();
    lodSystem.setCamera(camera);
    this.systems.set('lodSystem', lodSystem);

    // Occlusion Culling
    const occlusionCulling = new OcclusionCullingManager();
    occlusionCulling.setCamera(camera);
    this.systems.set('occlusionCulling', occlusionCulling);

    // Shadow Budget
    const shadowBudget = new ShadowBudgetManager();
    this.systems.set('shadowBudget', shadowBudget);

    // Visibility Cache
    const visibilityCache = new VisibilityCache(camera);
    this.systems.set('visibilityCache', visibilityCache);

    // Render Graph
    const renderGraph = new RenderGraph(renderer, scene, camera);
    this.systems.set('renderGraph', renderGraph);

    console.log('🎨 Rendering systems initialized');
  }

  /**
   * Initialize physics systems
   */
  private async initPhysicsSystems(physicsWorld?: any): Promise<void> {
    // Fixed TimeStep
    const fixedTimeStep = new FixedTimeStep({
      targetFPS: this.config.performance.targetFPS
    });
    this.systems.set('fixedTimeStep', fixedTimeStep);

    // Physics Sleep
    const physicsSleep = new PhysicsSleep();
    this.systems.set('physicsSleep', physicsSleep);

    // Physics Determinism (if physics world is available)
    if (physicsWorld) {
      const physicsDeterminism = new PhysicsDeterminism(physicsWorld);
      this.systems.set('physicsDeterminism', physicsDeterminism);
    }

    // Collision Matrix
    const collisionMatrix = new CollisionMatrix();
    this.systems.set('collisionMatrix', collisionMatrix);

    // Physics Worker (if enabled)
    if (this.config.performance.enableWorkers) {
      const physicsWorker = new PhysicsWorker();
      await physicsWorker.init();
      this.systems.set('physicsWorker', physicsWorker);
    }

    // Register existing bodies with physics sleep system if physics world is available
    if (physicsWorld && physicsSleep) {
      for (const body of physicsWorld.bodies) {
        physicsSleep.registerBody(body);
      }
    }

    console.log('⚡ Physics systems initialized');
  }

  /**
   * Initialize networking systems
   */
  private async initNetworkingSystems(): Promise<void> {
    // Network Authority
    const networkAuthority = new NetworkAuthorityManager();
    this.systems.set('networkAuthority', networkAuthority);

    // State Snapshot
    const stateSnapshot = new StateSnapshotManager();
    this.systems.set('stateSnapshot', stateSnapshot);

    // Interest Management
    const interestManagement = new InterestManagementSystem();
    this.systems.set('interestManagement', interestManagement);

    // Message Validation
    const messageValidation = new MessageValidationManager();
    this.systems.set('messageValidation', messageValidation);

    // Delta Compression
    const deltaCompression = new DeltaCompressionManager();
    this.systems.set('deltaCompression', deltaCompression);

    // Reliability Strategy
    const reliabilityStrategy = new ReliabilityStrategyManager();
    this.systems.set('reliabilityStrategy', reliabilityStrategy);

    // NAT Traversal
    if (this.config.networking) {
      const natTraversal = new NATTraversal({
        iceServers: this.config.networking.iceServers || []
      });
      this.systems.set('natTraversal', natTraversal);
    }

    // Replay Verification
    const replayVerification = new ReplayVerification(
      'game-' + Date.now(),
      'session-' + Date.now()
    );
    this.systems.set('replayVerification', replayVerification);

    console.log('🌐 Networking systems initialized');
  }

  /**
   * Initialize editor systems
   */
  private async initEditorSystems(): Promise<void> {
    // Command Stack
    const commandStack = new CommandStackManager();
    this.systems.set('commandStack', commandStack);

    // Scene Validation
    const sceneValidation = new SceneValidationManager();
    this.systems.set('sceneValidation', sceneValidation);

    // Dockable Panels
    const dockablePanels = new DockablePanelsManager();
    this.systems.set('dockablePanels', dockablePanels);

    // Gizmo Snapping
    const gizmoSnapping = new GizmoSnappingManager();
    this.systems.set('gizmoSnapping', gizmoSnapping);

    // Asset Browser
    const assetBrowser = new AssetBrowser();
    this.systems.set('assetBrowser', assetBrowser);

    // Collaborative Editor
    const collaborativeEditor = new CollaborativeEditor(`user_${Date.now()}`);
    this.systems.set('collaborativeEditor', collaborativeEditor);

    console.log('🛠️ Editor systems initialized');
  }

  /**
   * Initialize persistence systems
   */
  private async initPersistenceSystems(firebaseRef: any): Promise<void> {
    // Schema Migration
    const schemaMigration = new SchemaMigrationManager();
    this.systems.set('schemaMigration', schemaMigration);

    // Write Throttling
    const writeThrottling = new WriteThrottlingManager();
    this.systems.set('writeThrottling', writeThrottling);

    // Idempotent Write
    const idempotentWrite = new IdempotentWriteManager();
    this.systems.set('idempotentWrite', idempotentWrite);

    // Offline Editor
    const offlineEditor = new OfflineEditorManager();
    await offlineEditor.initialize();
    this.systems.set('offlineEditor', offlineEditor);

    // Publish Workflow
    const publishWorkflow = new PublishWorkflowManager();
    this.systems.set('publishWorkflow', publishWorkflow);

    // Data Separation
    const dataSeparation = new DataSeparation(firebaseRef);
    this.systems.set('dataSeparation', dataSeparation);

    console.log('💾 Persistence systems initialized');
  }

  /**
   * Initialize asset systems
   */
  private async initAssetSystems(): Promise<void> {
    // Asset Integrity
    const assetIntegrity = new AssetIntegrityManager();
    this.systems.set('assetIntegrity', assetIntegrity);

    // Progressive Loading
    const progressiveLoading = new ProgressiveLoadingManager();
    this.systems.set('progressiveLoading', progressiveLoading);

    // Signed UGC
    const signedUGC = new SignedUGC();
    this.systems.set('signedUGC', signedUGC);

    console.log('📦 Asset systems initialized');
  }

  /**
   * Get system by name
   */
  getSystem<T>(name: string): T | null {
    return this.systems.get(name) || null;
  }

  /**
   * Get all systems
   */
  getAllSystems(): Map<string, any> {
    return new Map(this.systems);
  }

  /**
   * Update systems (called in game loop)
   */
  update(deltaTime: number): void {
    if (!this.initialized) return;

    // Update rendering systems
    if (this.config.features.rendering) {
      const gpuTiming = this.systems.get('gpuTiming');
      gpuTiming?.update(deltaTime);

      const renderGraph = this.systems.get('renderGraph');
      renderGraph?.render(deltaTime);

      const lodSystem = this.systems.get('lodSystem');
      lodSystem?.update(deltaTime);

      const occlusionCulling = this.systems.get('occlusionCulling');
      occlusionCulling?.update(deltaTime);

      const shadowBudget = this.systems.get('shadowBudget');
      shadowBudget?.update(deltaTime);
    }

    // Update physics systems
    if (this.config.features.physics) {
      const fixedTimeStep = this.systems.get('fixedTimeStep');
      const physicsSleep = this.systems.get('physicsSleep');
      const physicsDeterminism = this.systems.get('physicsDeterminism');
      
      if (fixedTimeStep) {
        fixedTimeStep.update(deltaTime, (fixedDelta: number) => {
          // Update physics determinism with fixed timestep
          if (physicsDeterminism) {
            // This would need input frames in real implementation
            physicsDeterminism.stepDeterministic([]);
          }
        });
      }
      
      if (physicsSleep) {
        physicsSleep.update(deltaTime);
      }

      if (this.config.performance.enableWorkers) {
        const physicsWorker = this.systems.get('physicsWorker');
        physicsWorker?.step(deltaTime);
      }
    }

    // Update networking systems
    if (this.config.features.networking) {
      const interestManagement = this.systems.get('interestManagement');
      interestManagement?.update(performance.now());

      const stateSnapshot = this.systems.get('stateSnapshot');
      stateSnapshot?.update(deltaTime);

      const deltaCompression = this.systems.get('deltaCompression');
      deltaCompression?.update(deltaTime);
    }

    // Update asset systems
    const progressiveLoading = this.systems.get('progressiveLoading');
    // Progressive loading updates are event-driven, no need for regular updates

    // Update editor systems (if in editor mode)
    if (this.config.mode === 'editor' && this.config.features.editor) {
      const collaborativeEditor = this.systems.get('collaborativeEditor');
      // Collaborative editor updates are event-driven
    }
  }

  /**
   * Get system statistics
   */
  getStats(): any {
    const stats: any = {
      initialized: this.initialized,
      systemCount: this.systems.size,
      config: this.config,
      systems: {}
    };

    // Collect stats from individual systems
    for (const [name, system] of this.systems) {
      if (typeof system.getStats === 'function') {
        stats.systems[name] = system.getStats();
      }
    }

    return stats;
  }

  /**
   * Dispose all systems
   */
  dispose(): void {
    console.log('🧹 Disposing Improvisation Systems...');

    for (const [name, system] of this.systems) {
      if (typeof system.dispose === 'function') {
        try {
          system.dispose();
        } catch (error) {
          console.error(`Error disposing system ${name}:`, error);
        }
      }
    }

    this.systems.clear();
    this.initialized = false;
  }

  /**
   * Check if system is available
   */
  hasSystem(name: string): boolean {
    return this.systems.has(name);
  }

  /**
   * Get configuration
   */
  getConfig(): ImprovisationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ImprovisationConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}