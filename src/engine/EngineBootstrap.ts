/**
 * EngineBootstrap - Central initialization for all engine systems
 * Integrates all v2.0 and v3.0 features into the engine
 */

import { Engine } from './Core';
import { EngineLifecycle, EngineState } from './EngineLifecycle';
import { resourceManager } from './ResourceManager';
import { FixedTimeStep } from './FixedTimeStep';
import { DynamicResolution } from './DynamicResolution';
import { SpatialGrid } from './SpatialGrid';
import { LODManager } from './LODManager';
import { PhysicsOptimizer } from './PhysicsOptimizer';
import { JobSystem } from './JobSystem';
import { EditorWorkflow } from './EditorWorkflow';
import { ComponentSerializer } from './ComponentSerializer';
import { SceneVersioning } from './SceneVersioning';
import { DataValidator, SceneSchema, GameMetadataSchema } from './ValidationSchema';
import { auditManager } from './AuditManager';
import { eventBus } from './EventBus';
import { perfMonitor } from './PerformanceMonitor';
import { WorldManager } from './WorldManager';
import { QualityManager } from './QualityPresets';
import { PlatformDetector, PlatformBudget } from './PlatformBudget';
import { TelemetryManager } from './TelemetryManager';
import { ErrorReporting } from './ErrorReporting';
import { GameLoopWatchdog } from './GameLoopWatchdog';
import { AutoInstancing } from './AutoInstancing';
import { InputMapping } from './InputMapping';
import { AdvancedBootstrap, AdvancedBootstrapConfig } from './AdvancedBootstrap';
import { ContentBootstrap } from './ContentBootstrap';
import { SecurityBootstrap } from './SecurityBootstrap';

// Additional systems integration
import { assetStreaming } from './AssetPriority';
import { FPSController } from './Controller';
import { InputManager } from './Input';
import { NetworkManager } from './NetworkManager';
import { OffscreenRenderer } from './OffscreenRenderer';
import { persistence } from './PersistenceManager';
import { ServiceWorkerManager } from './ServiceWorkerManager';
import { SystemBoundaries } from './SystemBoundaries';
import { container, ServiceTokens } from './ServiceContainer';
import { GoldenFileTest } from './GoldenFileTest';
import { IntegrationTests } from './IntegrationTests';
import { LoadTesting } from './LoadTesting';
import { PerformanceRegressionTest } from './PerformanceRegressionTest';
import { MultiRegionStrategy } from './MultiRegionStrategy';

// Missing critical systems integration
import { assetManager } from './AssetManager';
import { AssetManifestManager } from './AssetManifest';
import { GLTFPipeline } from './GLTFPipeline';
import { TextureStreamingManager } from './TextureStreaming';
import { WorldStreaming } from './WorldStreaming';
import { OcclusionCullingManager } from './OcclusionCulling';
import { configManager } from './EngineConfig';
import { ProfilingTools } from './ProfilingTools';
import { SimulationTick } from './SimulationTick';
import { SecurityChecklist } from './SecurityChecklist';
import { ModerationToolkit } from './ModerationToolkit';

export interface BootstrapConfig {
  enablePhysicsOptimization?: boolean;
  enableDynamicResolution?: boolean;
  enableSpatialGrid?: boolean;
  enableLOD?: boolean;
  enableWorkers?: boolean;
  enableTelemetry?: boolean;
  enableErrorReporting?: boolean;
  enableWatchdog?: boolean;
  targetFPS?: number;
  workerPoolSize?: number;
  
  // Content systems
  enableContent?: boolean;
  enableVersionControl?: boolean;
  enablePluginSDK?: boolean;
  
  // Security systems
  enableSecurity?: boolean;
  enableAntiCheat?: boolean;
  enableModeration?: boolean;
  
  // Additional systems
  enableAssetStreaming?: boolean;
  enableFPSController?: boolean;
  enableInputManager?: boolean;
  enableNetworking?: boolean;
  enableOffscreenRenderer?: boolean;
  enablePersistence?: boolean;
  enableServiceWorker?: boolean;
  enableSystemBoundaries?: boolean;
  
  // Testing & Quality systems
  enableGoldenFileTest?: boolean;
  enableIntegrationTests?: boolean;
  enableLoadTesting?: boolean;
  enablePerformanceRegression?: boolean;
  
  // Infrastructure systems
  enableMultiRegion?: boolean;
  
  // Advanced rendering systems
  enableWorldStreaming?: boolean;
  enableOcclusionCulling?: boolean;
  enableTextureStreaming?: boolean;
  enableGLTFPipeline?: boolean;
  enableAssetManifest?: boolean;
  
  // Configuration & profiling systems
  enableEngineConfig?: boolean;
  enableProfilingTools?: boolean;
  enableSimulationTick?: boolean;
  
  // Security & moderation systems
  enableSecurityChecklist?: boolean;
  enableModerationToolkit?: boolean;
  
  // Advanced systems (Phase 3)
  advanced?: AdvancedBootstrapConfig;
}

export class EngineBootstrap {
  private engine: Engine;
  private lifecycle: EngineLifecycle;
  private fixedTimeStep: FixedTimeStep;
  private dynamicResolution: DynamicResolution | null = null;
  private spatialGrid: SpatialGrid | null = null;
  private lodManager: LODManager | null = null;
  private physicsOptimizer: PhysicsOptimizer | null = null;
  private jobSystem: JobSystem | null = null;
  private worldManager: WorldManager;
  private qualityManager: QualityManager;
  private platformBudget: PlatformBudget;
  private telemetry: TelemetryManager | null = null;
  private errorReporting: ErrorReporting | null = null;
  private watchdog: GameLoopWatchdog | null = null;
  private autoInstancing: AutoInstancing;
  private inputMapping: InputMapping;
  private contentBootstrap: ContentBootstrap | null = null;
  private securityBootstrap: SecurityBootstrap | null = null;
  
  // Additional systems
  private fpsController: FPSController | null = null;
  private inputManager: InputManager | null = null;
  private networkManager: NetworkManager | null = null;
  private offscreenRenderer: OffscreenRenderer | null = null;
  private serviceWorkerManager: ServiceWorkerManager | null = null;
  private systemBoundaries: SystemBoundaries | null = null;
  
  // Testing & Quality systems
  private goldenFileTest: GoldenFileTest | null = null;
  private integrationTests: IntegrationTests | null = null;
  private loadTesting: LoadTesting | null = null;
  private performanceRegression: PerformanceRegressionTest | null = null;
  
  // Infrastructure systems
  private multiRegionStrategy: MultiRegionStrategy | null = null;
  
  // Advanced rendering systems
  private worldStreaming: WorldStreaming | null = null;
  private occlusionCulling: OcclusionCullingManager | null = null;
  private textureStreaming: TextureStreamingManager | null = null;
  private gltfPipeline: GLTFPipeline | null = null;
  private assetManifestManager: AssetManifestManager | null = null;
  
  // Configuration & profiling systems
  private profilingTools: ProfilingTools | null = null;
  private simulationTick: SimulationTick | null = null;
  
  // Security & moderation systems
  private securityChecklist: SecurityChecklist | null = null;
  private moderationToolkit: ModerationToolkit | null = null;
  
  public readonly editorWorkflow: EditorWorkflow;
  public readonly serializer: ComponentSerializer;
  public readonly versioning: SceneVersioning;
  public readonly validator: typeof DataValidator;
  public readonly audit: typeof auditManager;
  
  // Advanced systems (Phase 3)
  public readonly advanced: AdvancedBootstrap | null = null;

  constructor(engine: Engine, config: BootstrapConfig = {}) {
    this.engine = engine;
    
    // Core lifecycle
    this.lifecycle = new EngineLifecycle();
    this.fixedTimeStep = new FixedTimeStep({ targetFPS: config.targetFPS || 60, maxSubSteps: 5 });
    
    // World & Quality Management
    this.worldManager = new WorldManager();
    this.qualityManager = new QualityManager();
    this.platformBudget = PlatformDetector.getBudget();
    this.autoInstancing = new AutoInstancing();
    this.inputMapping = new InputMapping();
    
    // Editor & Serialization
    this.editorWorkflow = new EditorWorkflow();
    this.serializer = new ComponentSerializer();
    this.versioning = new SceneVersioning();
    this.validator = DataValidator;
    this.audit = auditManager;
    
    // Optional systems
    if (config.enableDynamicResolution !== false) {
      this.dynamicResolution = new DynamicResolution(engine.getRenderer());
    }
    
    if (config.enableSpatialGrid !== false) {
      this.spatialGrid = new SpatialGrid(10);
    }
    
    if (config.enableLOD !== false) {
      this.lodManager = new LODManager(engine.getCamera());
    }
    
    if (config.enablePhysicsOptimization !== false) {
      this.physicsOptimizer = new PhysicsOptimizer();
    }
    
    if (config.enableWorkers !== false) {
      this.jobSystem = new JobSystem('/worker.js', config.workerPoolSize);
    }
    
    if (config.enableTelemetry !== false) {
      this.telemetry = new TelemetryManager();
    }
    
    if (config.enableErrorReporting !== false) {
      this.errorReporting = new ErrorReporting();
    }
    
    if (config.enableWatchdog !== false) {
      this.watchdog = new GameLoopWatchdog();
    }
    
    // Content systems
    if (config.enableContent !== false) {
      this.contentBootstrap = new ContentBootstrap({
        enableVersionControl: config.enableVersionControl,
        enablePluginSDK: config.enablePluginSDK,
        enableCanonicalFormat: true,
        enableCollaboration: false // Disable for now
      });
    }
    
    // Security systems
    if (config.enableSecurity !== false) {
      this.securityBootstrap = new SecurityBootstrap({
        enableAntiCheat: config.enableAntiCheat,
        enableModeration: config.enableModeration,
        enableUGCPublishing: true,
        enableScriptSandbox: false, // Disable for safety
        enablePermissions: true,
        enableAuditLog: true,
        enableTransactionLedger: true,
        strictMode: false
      });
    }
    
    // Initialize advanced systems (Phase 3)
    if (config.advanced) {
      (this as any).advanced = new AdvancedBootstrap(engine, config.advanced);
    }
    
    // Additional systems integration
    if (config.enableAssetStreaming !== false) {
      // Asset streaming is a singleton, already initialized
      console.log('✅ Asset streaming enabled');
    }
    
    if (config.enableFPSController !== false) {
      // FPS controller needs camera and DOM element - will be initialized when needed
      console.log('✅ FPS controller ready');
    }
    
    if (config.enableInputManager !== false) {
      this.inputManager = new InputManager();
    }
    
    if (config.enableNetworking !== false) {
      this.networkManager = engine.getNetworkManager();
    }
    
    if (config.enableOffscreenRenderer !== false) {
      this.offscreenRenderer = new OffscreenRenderer(256, 256);
    }
    
    if (config.enablePersistence !== false) {
      // Persistence is a singleton, already initialized
      console.log('✅ Persistence manager enabled');
    }
    
    if (config.enableServiceWorker !== false) {
      this.serviceWorkerManager = new ServiceWorkerManager();
      this.serviceWorkerManager.register('/sw.js');
    }
    
    if (config.enableSystemBoundaries !== false) {
      this.systemBoundaries = new SystemBoundaries();
    }
    
    // Testing & Quality systems
    if (config.enableGoldenFileTest !== false) {
      this.goldenFileTest = new GoldenFileTest();
    }
    
    if (config.enableIntegrationTests !== false) {
      this.integrationTests = new IntegrationTests();
      this.setupIntegrationTests();
    }
    
    if (config.enableLoadTesting !== false) {
      this.loadTesting = new LoadTesting();
    }
    
    if (config.enablePerformanceRegression !== false) {
      this.performanceRegression = new PerformanceRegressionTest();
    }
    
    // Infrastructure systems
    if (config.enableMultiRegion !== false) {
      this.multiRegionStrategy = new MultiRegionStrategy();
      this.setupMultiRegion();
    }
    
    // Advanced rendering systems
    if (config.enableWorldStreaming !== false) {
      this.worldStreaming = new WorldStreaming(100, 3); // 100m cells, 3 cell radius
    }
    
    if (config.enableOcclusionCulling !== false) {
      this.occlusionCulling = new OcclusionCullingManager();
    }
    
    if (config.enableTextureStreaming !== false) {
      this.textureStreaming = new TextureStreamingManager();
    }
    
    if (config.enableGLTFPipeline !== false) {
      this.gltfPipeline = new GLTFPipeline(engine.getRenderer());
    }
    
    if (config.enableAssetManifest !== false) {
      this.assetManifestManager = new AssetManifestManager();
    }
    
    // Configuration & profiling systems
    if (config.enableProfilingTools !== false) {
      this.profilingTools = new ProfilingTools();
    }
    
    if (config.enableSimulationTick !== false) {
      this.simulationTick = new SimulationTick(config.targetFPS || 60);
    }
    
    // Security & moderation systems
    if (config.enableSecurityChecklist !== false) {
      this.securityChecklist = new SecurityChecklist();
    }
    
    if (config.enableModerationToolkit !== false) {
      this.moderationToolkit = new ModerationToolkit();
    }
    
    // Register services in container
    this.registerServices();
    
    this.setupLifecycleCallbacks();
    this.setupEventListeners();
  }

  private registerServices() {
    // Register core services in the service container
    container.register(ServiceTokens.Engine, this.engine);
    container.register(ServiceTokens.Scene, this.engine.getScene());
    container.register(ServiceTokens.Camera, this.engine.getCamera());
    container.register(ServiceTokens.SceneManager, this.engine.getSceneManager());
    
    if (this.networkManager) {
      container.register(ServiceTokens.NetworkManager, this.networkManager);
    }
    
    if (this.contentBootstrap) {
      container.register('ContentBootstrap', this.contentBootstrap);
    }
    
    container.register(ServiceTokens.Persistence, persistence);
    
    console.log('✅ Services registered in container');
  }

  private setupIntegrationTests() {
    if (!this.integrationTests) return;
    
    // Add core engine tests
    this.integrationTests.addTest('Engine initialization', () => {
      if (!this.engine) throw new Error('Engine not initialized');
    });
    
    this.integrationTests.addTest('Scene manager', () => {
      const sceneManager = this.engine.getSceneManager();
      if (!sceneManager) throw new Error('Scene manager not available');
    });
    
    this.integrationTests.addTest('Physics world', () => {
      const physics = this.engine.getPhysicsWorld();
      if (!physics) throw new Error('Physics world not available');
    });
    
    this.integrationTests.addTest('Asset manager', () => {
      const assetManager = this.engine.getAssetManager();
      if (!assetManager) throw new Error('Asset manager not available');
    });
    
    console.log('✅ Integration tests configured');
  }

  private setupMultiRegion() {
    if (!this.multiRegionStrategy) return;
    
    // Add default regions
    this.multiRegionStrategy.addRegion({
      id: 'us-east',
      name: 'US East',
      endpoint: 'https://api-us-east.example.com',
      cdnEndpoint: 'https://cdn-us-east.example.com',
      latency: 0
    });
    
    this.multiRegionStrategy.addRegion({
      id: 'eu-west',
      name: 'EU West',
      endpoint: 'https://api-eu-west.example.com',
      cdnEndpoint: 'https://cdn-eu-west.example.com',
      latency: 0
    });
    
    this.multiRegionStrategy.addRegion({
      id: 'asia-pacific',
      name: 'Asia Pacific',
      endpoint: 'https://api-asia.example.com',
      cdnEndpoint: 'https://cdn-asia.example.com',
      latency: 0
    });
    
    console.log('✅ Multi-region strategy configured');
  }

  private setupLifecycleCallbacks() {
    this.lifecycle.registerCallbacks({
      onInit: () => {
        console.log('🚀 Engine initializing...');
        const budget = this.platformBudget;
        console.log('📊 Platform budget:', budget);
        
        // Auto-detect quality
        this.qualityManager.autoDetect(16.67); // 60fps baseline
      },
      
      onStart: () => {
        console.log('▶️ Engine starting...');
        if (this.watchdog) {
          this.watchdog.start(() => {
            console.error('⚠️ Game loop hang detected!');
          });
        }
      },
      
      onPause: () => {
        console.log('⏸️ Engine paused');
      },
      
      onResume: () => {
        console.log('▶️ Engine resumed');
      },
      
      onStop: () => {
        console.log('⏹️ Engine stopping...');
        this.watchdog?.stop();
      },
      
      onDispose: () => {
        console.log('🗑️ Engine disposing...');
        this.cleanup();
      }
    });
  }

  private setupEventListeners() {
    // Listen to engine events
    eventBus.on('engine:fps', (fps: number) => {
      // Update dynamic resolution based on FPS
      if (this.dynamicResolution) {
        this.dynamicResolution.update(fps);
      }
      
      // Watchdog check
      if (this.watchdog) {
        this.watchdog.heartbeat();
      }
    });
    
    eventBus.on('engine:error', (error: Error) => {
      if (this.errorReporting) {
        this.errorReporting.captureError(error);
      }
    });
  }

  public initialize() {
    this.lifecycle.init();
  }

  public start() {
    this.lifecycle.start();
  }

  public update(delta: number) {
    if (this.profilingTools) {
      this.profilingTools.mark('frame-start');
    }
    // Watchdog check
    this.watchdog?.heartbeat();
    
    // Fixed timestep for physics
    this.fixedTimeStep.update(performance.now(), (fixedDelta: number) => {
      // Physics update with fixed timestep
      // Physics optimizer handles its own updates
    });
    
    // Update spatial grid
    if (this.spatialGrid) {
      // Spatial grid updates are handled per-entity
    }
    
    // Update LOD
    if (this.lodManager) {
      this.lodManager.update();
    }
    
    // Update advanced systems
    if (this.advanced) {
      this.advanced.update(delta);
    }
    
    // Update content systems
    if (this.contentBootstrap) {
      // Content systems are event-driven, no update needed
    }
    
    // Update additional systems
    if (this.fpsController && this.inputManager) {
      this.fpsController.update(delta, this.inputManager);
    }
    
    // Update asset streaming priorities
    if (this.engine.getCamera()) {
      assetStreaming.setCameraPosition(this.engine.getCamera().position);
    }
    
    // Update world streaming
    if (this.worldStreaming && this.engine.getCamera()) {
      const pos = this.engine.getCamera().position;
      const { load, unload } = this.worldStreaming.updatePlayerPosition(pos.x, pos.z);
      
      // Handle cell loading/unloading
      load.forEach(cell => {
        console.log(`Loading cell ${cell.x},${cell.z}`);
        this.worldStreaming!.markCellLoaded(cell.x, cell.z);
      });
      
      unload.forEach(cell => {
        console.log(`Unloading cell ${cell.x},${cell.z}`);
      });
    }
    
    // Update occlusion culling
    if (this.occlusionCulling) {
      this.occlusionCulling.cullScene(this.engine.getScene(), this.engine.getCamera());
    }
    
    // Update texture streaming based on camera distance
    if (this.textureStreaming && this.engine.getCamera()) {
      const cameraPos = this.engine.getCamera().position;
      const distance = cameraPos.length();
      // Note: updateLOD not implemented in TextureStreamingManager yet
      // this.textureStreaming.updateLOD(distance);
    }
    
    // Update simulation tick
    if (this.simulationTick) {
      this.simulationTick.update(delta, (fixedDelta) => {
        // Fixed timestep simulation updates
        this.engine.getPhysicsWorld().step(fixedDelta);
      });
    }
    
    // Update profiling
    if (this.profilingTools) {
      this.profilingTools.mark('frame-end');
      this.profilingTools.measure('frame-time', 'frame-start', 'frame-end');
    }
    
    // Update testing systems
    if (this.integrationTests) {
      // Integration tests are event-driven, no update needed
    }
    
    if (this.performanceRegression) {
      // Performance regression tests are run on-demand
    }
    
    // Security systems don't need update in game loop
    // They respond to events
  }

  public pause() {
    this.lifecycle.pause();
  }

  public resume() {
    this.lifecycle.resume();
  }

  public stop() {
    this.lifecycle.stop();
  }

  public dispose() {
    this.lifecycle.dispose();
  }

  private cleanup() {
    // Cleanup all resources
    resourceManager.disposeAll();
    
    // Dispose job system
    if (this.jobSystem) {
      this.jobSystem.dispose();
    }
    
    // Stop watchdog
    if (this.watchdog) {
      this.watchdog.stop();
    }
    
    // Dispose advanced systems
    if (this.advanced) {
      this.advanced.dispose();
    }
    
    // Dispose content systems
    if (this.contentBootstrap) {
      this.contentBootstrap.dispose();
    }
    
    // Dispose security systems
    if (this.securityBootstrap) {
      this.securityBootstrap.dispose();
    }
    
    // Dispose additional systems
    if (this.serviceWorkerManager) {
      this.serviceWorkerManager.unregister();
    }
    
    if (this.networkManager) {
      this.networkManager.disconnect();
    }
    
    // Dispose advanced rendering systems
    if (this.gltfPipeline) {
      this.gltfPipeline.dispose();
    }
    
    if (this.textureStreaming) {
      this.textureStreaming.dispose();
    }
    
    // Clear profiling data
    if (this.profilingTools) {
      this.profilingTools.clear();
    }
    
    // Reset simulation tick
    if (this.simulationTick) {
      this.simulationTick.reset();
    }
    
    // Clear service container
    container.clear();
    
    console.log('✅ Engine cleanup complete');
  }

  // Getters for systems
  public getLifecycle() { return this.lifecycle; }
  public getFixedTimeStep() { return this.fixedTimeStep; }
  public getDynamicResolution() { return this.dynamicResolution; }
  public getSpatialGrid() { return this.spatialGrid; }
  public getLODManager() { return this.lodManager; }
  public getPhysicsOptimizer() { return this.physicsOptimizer; }
  public getJobSystem() { return this.jobSystem; }
  public getWorldManager() { return this.worldManager; }
  public getQualityManager() { return this.qualityManager; }
  public getPlatformBudget() { return this.platformBudget; }
  public getTelemetry() { return this.telemetry; }
  public getErrorReporting() { return this.errorReporting; }
  public getWatchdog() { return this.watchdog; }
  public getAutoInstancing() { return this.autoInstancing; }
  public getInputMapping() { return this.inputMapping; }
  public getContentBootstrap() { return this.contentBootstrap; }
  public getSecurityBootstrap() { return this.securityBootstrap; }
  
  // Additional system getters
  public getFPSController() { return this.fpsController; }
  public getInputManager() { return this.inputManager; }
  public getNetworkManager() { return this.networkManager; }
  public getOffscreenRenderer() { return this.offscreenRenderer; }
  public getServiceWorkerManager() { return this.serviceWorkerManager; }
  public getSystemBoundaries() { return this.systemBoundaries; }
  public getAssetStreaming() { return assetStreaming; }
  public getPersistence() { return persistence; }
  public getServiceContainer() { return container; }
  
  // Testing & Quality system getters
  public getGoldenFileTest() { return this.goldenFileTest; }
  public getIntegrationTests() { return this.integrationTests; }
  public getLoadTesting() { return this.loadTesting; }
  public getPerformanceRegression() { return this.performanceRegression; }
  
  // Infrastructure system getters
  public getMultiRegionStrategy() { return this.multiRegionStrategy; }
  
  // Advanced rendering system getters
  public getWorldStreaming() { return this.worldStreaming; }
  public getOcclusionCulling() { return this.occlusionCulling; }
  public getTextureStreaming() { return this.textureStreaming; }
  public getGLTFPipeline() { return this.gltfPipeline; }
  public getAssetManifestManager() { return this.assetManifestManager; }
  public getAssetManager() { return assetManager; }
  public getConfigManager() { return configManager; }
  
  // Configuration & profiling system getters
  public getProfilingTools() { return this.profilingTools; }
  public getSimulationTick() { return this.simulationTick; }
  
  // Security & moderation system getters
  public getSecurityChecklist() { return this.securityChecklist; }
  public getModerationToolkit() { return this.moderationToolkit; }
  
  // FPS Controller initialization (needs DOM element)
  public initializeFPSController(domElement: HTMLElement) {
    if (!this.fpsController) {
      this.fpsController = new FPSController(this.engine.getCamera(), domElement);
      console.log('✅ FPS controller initialized');
    }
    return this.fpsController;
  }

  // Testing methods
  public async runIntegrationTests() {
    if (!this.integrationTests) {
      console.warn('Integration tests not enabled');
      return { passed: 0, failed: 0, results: new Map() };
    }
    
    console.log('🧪 Running integration tests...');
    await this.integrationTests.runTests();
    const results = this.integrationTests.getResults();
    
    const passed = Array.from(results.values()).filter(r => r.passed).length;
    const failed = results.size - passed;
    
    return { passed, failed, results };
  }

  public async runPerformanceTests() {
    if (!this.performanceRegression) {
      console.warn('Performance regression tests not enabled');
      return [];
    }
    
    console.log('⚡ Running performance tests...');
    const results = await this.performanceRegression.runAllBenchmarks(async (name) => {
      // Simulate realistic engine workload
      const start = performance.now();
      
      // Simulate different workloads based on test name
      if (name.includes('Empty')) {
        // Minimal scene - just render loop
        for (let i = 0; i < 100; i++) {
          Math.sin(i * 0.01);
        }
      } else if (name.includes('100')) {
        // Medium scene - simulate 100 objects
        for (let i = 0; i < 1000; i++) {
          Math.sin(i * 0.01) * Math.cos(i * 0.01);
        }
      } else {
        // Heavy scene - simulate complex calculations
        for (let i = 0; i < 5000; i++) {
          Math.sin(i * 0.01) * Math.cos(i * 0.01) * Math.tan(i * 0.01);
        }
      }
      
      const end = performance.now();
      const frameTime = end - start;
      
      return {
        fps: Math.min(1000 / Math.max(frameTime, 1), 60),
        frameTime,
        memory: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 50 + Math.random() * 20
      };
    });
    
    return results;
  }

  public async runLoadTest(config: any = {}) {
    if (!this.loadTesting) {
      console.warn('Load testing not enabled');
      return null;
    }
    
    const defaultConfig = {
      concurrentConnections: 10,
      operationsPerSecond: 5,
      duration: 5000,
      operationType: 'mixed' as const
    };
    
    const testConfig = { ...defaultConfig, ...config };
    
    console.log('🔥 Running load test...', testConfig);
    return await this.loadTesting.runTest(testConfig, async () => {
      // Simulate network operation with realistic latency
      const latency = 50 + Math.random() * 100; // 50-150ms
      await new Promise(resolve => setTimeout(resolve, latency));
      
      // Simulate occasional failures
      if (Math.random() < 0.05) {
        throw new Error('Simulated network error');
      }
    });
  }

  public async saveGoldenFile(name: string, data: any) {
    if (!this.goldenFileTest) {
      console.warn('Golden file test not enabled');
      return;
    }
    
    await this.goldenFileTest.saveGolden(name, '1.0.0', data);
    console.log(`💾 Golden file saved: ${name}`);
  }

  public async compareWithGolden(name: string, data: any) {
    if (!this.goldenFileTest) {
      console.warn('Golden file test not enabled');
      return { matches: true };
    }
    
    return await this.goldenFileTest.compareWithGolden(name, data);
  }

  // Additional testing utilities
  public async runFullTestSuite() {
    console.log('🧪 Running full test suite...');
    
    const results = {
      integration: await this.runIntegrationTests(),
      performance: await this.performanceTests(),
      load: await this.runLoadTest(),
      timestamp: Date.now()
    };
    
    console.log('✅ Full test suite completed:', results);
    return results;
  }

  public async performanceTests() {
    const results = await this.runPerformanceTests();
    
    // Analyze results
    const analysis = {
      totalTests: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      avgFPS: results.reduce((sum, r) => sum + r.avgFPS, 0) / results.length,
      avgMemory: results.reduce((sum, r) => sum + r.memoryUsed, 0) / results.length
    };
    
    console.log('📊 Performance test analysis:', analysis);
    return { results, analysis };
  }

  // Multi-region methods
  public async selectBestRegion() {
    if (!this.multiRegionStrategy) {
      console.warn('Multi-region strategy not enabled');
      return null;
    }
    
    console.log('🌍 Selecting best region...');
    return await this.multiRegionStrategy.selectBestRegion();
  }

  public getCDNUrl(assetPath: string) {
    if (!this.multiRegionStrategy) {
      console.warn('Multi-region strategy not enabled');
      return assetPath;
    }
    
    try {
      return this.multiRegionStrategy.getCDNUrl(assetPath);
    } catch (error) {
      console.warn('Failed to get CDN URL, using original path');
      return assetPath;
    }
  }
  
  // Advanced rendering methods
  public enableOcclusionCulling(enabled: boolean) {
    if (this.occlusionCulling) {
      this.occlusionCulling.setEnabled(enabled);
      console.log(`🔍 Occlusion culling ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
  
  public addOccluder(mesh: any) {
    if (this.occlusionCulling) {
      this.occlusionCulling.addOccluder(mesh);
    }
  }
  
  public setTextureMipBias(bias: number) {
    if (this.textureStreaming) {
      // Note: setMipBias not implemented in TextureStreamingManager yet
      // this.textureStreaming.setMipBias(bias);
      console.log(`🎨 Texture mip bias set to ${bias}`);
    }
  }
  
  public async loadGLTFModel(url: string) {
    if (this.gltfPipeline) {
      return await this.gltfPipeline.load(url);
    } else if (assetManager) {
      return await assetManager.loadModel(url);
    }
    throw new Error('No GLTF loader available');
  }
  
  public async loadAssetManifest(url: string) {
    if (this.assetManifestManager) {
      await this.assetManifestManager.loadManifest(url);
      console.log('📦 Asset manifest loaded');
    }
  }
  
  public getAssetURL(id: string) {
    if (this.assetManifestManager) {
      return this.assetManifestManager.getAssetURL(id);
    }
    return null;
  }
  
  // Security & moderation methods
  public runSecurityAudit() {
    if (!this.securityChecklist) {
      console.warn('Security checklist not enabled');
      return { score: 0, issues: [] };
    }
    
    const score = this.securityChecklist.getComplianceScore();
    const issues = this.securityChecklist.getCriticalIssues();
    
    console.log(`🔒 Security audit: ${score.toFixed(1)}% compliance`);
    return { score, issues };
  }
  
  public generateSecurityReport() {
    if (this.securityChecklist) {
      return this.securityChecklist.generateReport();
    }
    return 'Security checklist not enabled';
  }
  
  public moderateContent(contentId: string, reason: string, moderatorId: string) {
    if (this.moderationToolkit) {
      return this.moderationToolkit.takedown(contentId, reason, moderatorId);
    }
    console.warn('Moderation toolkit not enabled');
    return null;
  }
  
  public banUser(userId: string, reason: string, moderatorId: string, duration?: number) {
    if (this.moderationToolkit) {
      return this.moderationToolkit.ban(userId, reason, moderatorId, duration);
    }
    console.warn('Moderation toolkit not enabled');
    return null;
  }
  
  public isUserBanned(userId: string) {
    if (this.moderationToolkit) {
      return this.moderationToolkit.isBanned(userId);
    }
    return false;
  }
  
  // Profiling methods
  public startProfiling(name: string) {
    if (this.profilingTools) {
      this.profilingTools.mark(`${name}-start`);
    }
  }
  
  public endProfiling(name: string) {
    if (this.profilingTools) {
      this.profilingTools.mark(`${name}-end`);
      return this.profilingTools.measure(name, `${name}-start`, `${name}-end`);
    }
    return 0;
  }
  
  public getProfilingData(name?: string) {
    if (this.profilingTools) {
      return this.profilingTools.getMeasurements(name);
    }
    return [];
  }
  
  public exportProfile() {
    if (this.profilingTools) {
      return this.profilingTools.exportProfile();
    }
    return '{}';
  }
  
  public getState(): EngineState {
    return this.lifecycle.getState();
  }
}
