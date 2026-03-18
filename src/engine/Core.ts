import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Timer,
  Color,
  AmbientLight,
  DirectionalLight,
  PCFSoftShadowMap,
  Vector3,
  Euler,
} from "three";
import { World, NaiveBroadphase, GSSolver, Vec3 } from "cannon-es";
import { eventBus } from "./EventBus";
import { perfMonitor } from "./PerformanceMonitor";
import { SceneManager } from "./SceneManager";
import { Entity } from "./Entity";
import { container, ServiceTokens } from "./ServiceContainer";
import { NetworkManager } from "./NetworkManager";
import { persistence } from "./PersistenceManager";
import { PluginSystem } from "./PluginSystem";
import { leaderboards } from "./LeaderboardManager";
import { EngineBootstrap, BootstrapConfig } from "./EngineBootstrap";
import { ImprovisationBootstrap } from "./ImprovisationBootstrap";
import { configManager, EngineConfig } from "./EngineConfig";
import { database } from "../firebase";
import { ProfilingTools } from "./ProfilingTools";
import { SimulationTick } from "./SimulationTick";
import { PermissionSystem } from "./PermissionSystem";
import { assetManager } from "./AssetManager";
import { uuidManager } from "./UUIDManager";
import { NavMesh, CrowdSteering } from "./NavMesh";

/**
 * Engine Core Class.
 * Bertanggung jawab untuk mengelola siklus hidup rendering (Three.js),
 * simulasi fisika (Cannon-es), dan koordinasi antara berbagai manajer sistem.
 *
 * @example
 * const engine = new Engine(canvasElement);
 * engine.start();
 */
export class Engine {
  private canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private physicsWorld: World;
  private sceneManager: SceneManager;
  private networkManager: NetworkManager;
  private pluginSystem: PluginSystem;
  private bootstrap: EngineBootstrap | null = null;
  private improvisationBootstrap: ImprovisationBootstrap | null = null;
  private isRunning: boolean = false;
  private timer: Timer;
  private handleResize: () => void;
  private resizeObserver: ResizeObserver | null = null;
  private onUpdateCallbacks: Set<(delta: number) => void>;
  private profiler: ProfilingTools;
  private simulationTick: SimulationTick;
  private permissionSystem: PermissionSystem;
  private navMesh: NavMesh;
  private crowdSteering: CrowdSteering;

  // Performance tracking
  private frameCount: number = 0;
  private lastFPSUpdate: number = 0;
  private currentFPS: number = 0;

  /**
   * Inisialisasi engine baru.
   * @param canvas Elemen HTMLCanvas untuk target rendering.
   * @param bootstrapConfig Optional configuration for advanced features
   */
  constructor(canvas: HTMLCanvasElement, bootstrapConfig?: BootstrapConfig) {
    // Get engine configuration
    const config = configManager.get();

    container.clear();
    uuidManager.clear();
    this.canvas = canvas;

    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    const initialRect = canvas.getBoundingClientRect();
    const initialWidth = Math.max(
      1,
      Math.floor(initialRect.width || window.innerWidth),
    );
    const initialHeight = Math.max(
      1,
      Math.floor(initialRect.height || window.innerHeight),
    );
    this.renderer.setSize(initialWidth, initialHeight, false);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, config.pixelRatioMax),
    );

    // Shadow configuration based on config
    if (config.shadowQuality !== "off") {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = PCFSoftShadowMap;
    }

    this.scene = new Scene();
    this.scene.background = new Color(0x87ceeb); // Sky blue

    // Physics Setup with config
    this.physicsWorld = new World();
    this.physicsWorld.gravity.set(0, config.gravity, 0);
    this.physicsWorld.broadphase = new NaiveBroadphase();
    (this.physicsWorld.solver as GSSolver).iterations = 10;

    // Camera Setup
    this.camera = new PerspectiveCamera(
      75,
      initialWidth / initialHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.sceneManager = new SceneManager(this.scene, this.physicsWorld);
    this.networkManager = new NetworkManager(this.sceneManager);
    this.pluginSystem = new PluginSystem(this);
    this.onUpdateCallbacks = new Set();
    this.timer = new Timer();
    this.handleResize = () => this.onWindowResize();

    // Initialize new systems
    this.profiler = new ProfilingTools();
    this.simulationTick = new SimulationTick(config.targetFPS);
    this.permissionSystem = new PermissionSystem();
    this.navMesh = new NavMesh();
    this.crowdSteering = new CrowdSteering();

    // Register core services in Dependency Injection container
    this.registerServices();

    // Basic Lighting with config
    const ambientLight = new AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);

    if (config.shadowQuality !== "off") {
      directionalLight.castShadow = true;
      const shadowMapSize = configManager.getShadowMapSize();
      directionalLight.shadow.mapSize.width = shadowMapSize;
      directionalLight.shadow.mapSize.height = shadowMapSize;
    }

    this.scene.add(directionalLight);

    // Initialize Bootstrap for advanced features
    if (bootstrapConfig !== undefined) {
      this.bootstrap = new EngineBootstrap(this, bootstrapConfig);
      this.bootstrap.initialize();
      console.log("✅ Engine Bootstrap initialized with advanced features");

      // Initialize Improvisation Systems
      this.improvisationBootstrap = new ImprovisationBootstrap({
        mode: "play",
        features: {
          networking: true,
          physics: true,
          rendering: true,
          editor: false,
          persistence: true,
        },
        performance: {
          targetFPS: 60,
          enableWorkers: false,
          enableCaching: true,
        },
        networking: {
          enableP2P: true,
          maxPeers: 8,
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      });
    }

    // Resize Handler
    window.addEventListener("resize", this.handleResize);
    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(() => this.onWindowResize());
      this.resizeObserver.observe(this.canvas);
    }

    eventBus.emit("engine:init", { scene: this.scene, camera: this.camera });
  }

  private registerServices() {
    container.register(ServiceTokens.Renderer, this.renderer);
    container.register(ServiceTokens.Scene, this.scene);
    container.register(ServiceTokens.Camera, this.camera);
    container.register(ServiceTokens.Physics, this.physicsWorld);
    container.register(ServiceTokens.SceneManager, this.sceneManager);
    container.register(ServiceTokens.NetworkManager, this.networkManager);
    container.register(ServiceTokens.PluginSystem, this.pluginSystem);
    container.register(ServiceTokens.Leaderboards, leaderboards);
    container.register(ServiceTokens.Persistence, persistence);
    container.register(ServiceTokens.Engine, this);
    container.register("AssetManager", assetManager);
    container.register("UUIDManager", uuidManager);
    container.register("NavMesh", this.navMesh);
    container.register("CrowdSteering", this.crowdSteering);
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.bootstrap) {
      this.bootstrap.start();
    }
    // START LOOP FIRST - tidak boleh diblokir bootstrap
    eventBus.emit("engine:start");
    this.loop();
    // Init improvisation systems di background
    if (this.improvisationBootstrap) {
      try {
        await this.improvisationBootstrap.init(
          this.renderer,
          this.scene,
          this.camera,
          database,
          this.physicsWorld,
        );
      } catch (error) {
        console.warn(
          "⚠️ ImprovisationBootstrap init failed (non-fatal):",
          error,
        );
      }
    }
  }

  public stop() {
    this.isRunning = false;

    if (this.bootstrap) {
      this.bootstrap.stop();
    }

    eventBus.emit("engine:stop");
  }

  private loop = () => {
    if (!this.isRunning) return;

    requestAnimationFrame(this.loop);

    // Profiling mark
    this.profiler.mark("frame-start");

    this.timer.update();
    const delta = this.timer.getDelta();
    const config = configManager.get();
    const clampedDelta = Math.min(delta, config.maxDeltaTime);
    const now = performance.now();

    // FPS Calculation
    this.frameCount++;
    if (now - this.lastFPSUpdate > 1000) {
      this.currentFPS = Math.round(
        (this.frameCount * 1000) / (now - this.lastFPSUpdate),
      );
      this.frameCount = 0;
      this.lastFPSUpdate = now;
      eventBus.emit("engine:fps", this.currentFPS);
    }

    perfMonitor.start("total");

    // Update Bootstrap systems
    if (this.bootstrap) {
      this.bootstrap.update(clampedDelta);
    }

    // Update Improvisation systems
    if (this.improvisationBootstrap) {
      this.improvisationBootstrap.update(clampedDelta);
    }

    // Fixed simulation tick for physics
    this.profiler.mark("simulation-start");
    this.simulationTick.update(clampedDelta, (fixedDelta) => {
      // Update Physics with fixed timestep
      perfMonitor.start("physics");
      this.physicsWorld.step(fixedDelta);
      perfMonitor.end("physics");
    });
    this.profiler.mark("simulation-end");
    this.profiler.measure("simulation", "simulation-start", "simulation-end");

    // Update Scene Entities
    perfMonitor.start("update");
    this.sceneManager.update(clampedDelta);
    this.pluginSystem.update(clampedDelta);
    perfMonitor.end("update");

    // Update Callbacks
    this.onUpdateCallbacks.forEach((callback) => callback(clampedDelta));

    // Render
    perfMonitor.start("render");

    // Use post-processing if available
    this.renderer.render(this.scene, this.camera);

    perfMonitor.end("render");

    perfMonitor.end("total");

    // Profiling measure
    this.profiler.mark("frame-end");
    this.profiler.measure("frame", "frame-start", "frame-end");
  };

  private onWindowResize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width || window.innerWidth));
    const height = Math.max(1, Math.floor(rect.height || window.innerHeight));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    eventBus.emit("engine:resize", { width, height });
  }

  public addEntity(entity: Entity) {
    this.sceneManager.addEntity(entity);
  }

  public getScene(): Scene {
    return this.scene;
  }

  public getRenderer(): WebGLRenderer {
    return this.renderer;
  }

  public getPhysicsWorld(): World {
    return this.physicsWorld;
  }

  public getCamera(): PerspectiveCamera {
    return this.camera;
  }

  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  public getNetworkManager(): NetworkManager {
    return this.networkManager;
  }

  public getBootstrap(): EngineBootstrap | null {
    return this.bootstrap;
  }

  public getImprovisationBootstrap(): ImprovisationBootstrap | null {
    return this.improvisationBootstrap;
  }

  public getPluginSystem(): PluginSystem {
    return this.pluginSystem;
  }

  public getProfiler(): ProfilingTools {
    return this.profiler;
  }

  public getPermissionSystem(): PermissionSystem {
    return this.permissionSystem;
  }

  public getNavMesh(): NavMesh {
    return this.navMesh;
  }

  public getCrowdSteering(): CrowdSteering {
    return this.crowdSteering;
  }

  public getAssetManager() {
    return assetManager;
  }

  public getUUIDManager() {
    return uuidManager;
  }

  public getConfig(): EngineConfig {
    return configManager.get();
  }

  public setConfig(partial: Partial<EngineConfig>): void {
    configManager.set(partial);
    // Apply config changes
    this.applyConfigChanges();
  }

  private applyConfigChanges(): void {
    const config = configManager.get();

    // Update renderer
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, config.pixelRatioMax),
    );

    // Update physics
    this.physicsWorld.gravity.set(0, config.gravity, 0);

    // Update shadows
    if (config.shadowQuality === "off") {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      const shadowMapSize = configManager.getShadowMapSize();
      this.scene.traverse((obj) => {
        if ((obj as any).isDirectionalLight) {
          const light = obj as DirectionalLight;
          if (light.shadow) {
            light.shadow.mapSize.width = shadowMapSize;
            light.shadow.mapSize.height = shadowMapSize;
            light.shadow.map?.dispose();
            light.shadow.map = null;
          }
        }
      });
    }
  }

  public onUpdate(callback: (delta: number) => void) {
    this.onUpdateCallbacks.add(callback);
  }

  public dispose() {
    this.stop();

    if (this.bootstrap) {
      this.bootstrap.dispose();
    }
    this.bootstrap = null;

    if (this.improvisationBootstrap) {
      this.improvisationBootstrap.dispose();
    }
    this.improvisationBootstrap = null;

    window.removeEventListener("resize", this.handleResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    // Cleanup renderer
    this.renderer.dispose();

    // Clear profiler
    this.profiler.clear();

    container.clear();
    uuidManager.clear();

    eventBus.emit("engine:dispose");
  }
}
