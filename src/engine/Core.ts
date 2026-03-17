import { 
    WebGLRenderer, 
    Scene, 
    PerspectiveCamera, 
    Clock, 
    Color, 
    AmbientLight, 
    DirectionalLight, 
    PCFSoftShadowMap,
    Vector3,
    Euler
} from 'three';
import { 
    World, 
    NaiveBroadphase, 
    GSSolver,
    Vec3
} from 'cannon-es';
import { eventBus } from './EventBus';
import { perfMonitor } from './PerformanceMonitor';
import { SceneManager } from './SceneManager';
import { Entity } from './Entity';
import { container } from './ServiceContainer';
import { NetworkManager } from './NetworkManager';
import { persistence } from './PersistenceManager';
import { PluginSystem } from './PluginSystem';
import { leaderboards } from './LeaderboardManager';

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
    private renderer: WebGLRenderer;
    private scene: Scene;
    private camera: PerspectiveCamera;
    private physicsWorld: World;
    private sceneManager: SceneManager;
    private networkManager: NetworkManager;
    private pluginSystem: PluginSystem;
    private isRunning: boolean = false;
    private clock: Clock;
    private onUpdateCallbacks: Set<(delta: number) => void>;

    // Performance tracking
    private frameCount: number = 0;
    private lastFPSUpdate: number = 0;
    private currentFPS: number = 0;

    /**
     * Inisialisasi engine baru.
     * @param canvas Elemen HTMLCanvas untuk target rendering.
     */
    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap; // Better shadows

        this.scene = new Scene();
        this.scene.background = new Color(0x87CEEB); // Sky blue
        
        // Physics Setup
        this.physicsWorld = new World();
        this.physicsWorld.gravity.set(0, -9.82, 0);
        // Optimization: Use naive broadphase for small scenes, but prep for GridBroadphase
        this.physicsWorld.broadphase = new NaiveBroadphase();
        (this.physicsWorld.solver as GSSolver).iterations = 10; // Balance performance/stability

        // Camera Setup
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        this.sceneManager = new SceneManager(this.scene, this.physicsWorld);
        this.networkManager = new NetworkManager(this.sceneManager);
        this.pluginSystem = new PluginSystem(this);
        this.onUpdateCallbacks = new Set();
        this.clock = new Clock();

        // Register core services in Dependency Injection container
        this.registerServices();

        // Basic Lighting
        const ambientLight = new AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);

        // Resize Handler
        window.addEventListener('resize', () => this.onWindowResize());

        eventBus.emit('engine:init', { scene: this.scene, camera: this.camera });
    }

    private registerServices() {
        container.register('Renderer', this.renderer);
        container.register('Scene', this.scene);
        container.register('Camera', this.camera);
        container.register('Physics', this.physicsWorld);
        container.register('SceneManager', this.sceneManager);
        container.register('NetworkManager', this.networkManager);
        container.register('PluginSystem', this.pluginSystem);
        container.register('Leaderboards', leaderboards);
        container.register('Persistence', persistence);
        container.register('Engine', this);
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        eventBus.emit('engine:start');
        this.loop();
    }

    public stop() {
        this.isRunning = false;
        eventBus.emit('engine:stop');
    }

    private loop = () => {
        if (!this.isRunning) return;

        requestAnimationFrame(this.loop);

        const delta = this.clock.getDelta();
        const now = performance.now();

        // FPS Calculation
        this.frameCount++;
        if (now - this.lastFPSUpdate > 1000) {
            this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            eventBus.emit('engine:fps', this.currentFPS);
        }

        perfMonitor.start('total');

        // Update Physics
        perfMonitor.start('physics');
        this.physicsWorld.step(1 / 60, delta, 3);
        perfMonitor.end('physics');

        // Update Scene Entities
        perfMonitor.start('update');
        this.sceneManager.update(delta);
        this.pluginSystem.update(delta); // Run plugin updates
        perfMonitor.end('update');

        // Update Callbacks
        this.onUpdateCallbacks.forEach(callback => callback(delta));

        // Render
        perfMonitor.start('render');
        this.renderer.render(this.scene, this.camera);
        perfMonitor.end('render');

        perfMonitor.end('total');
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        eventBus.emit('engine:resize', { width: window.innerWidth, height: window.innerHeight });
    }

    public addEntity(entity: Entity) {
        this.sceneManager.addEntity(entity);
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getPhysicsWorld(): CANNON.World {
        return this.physicsWorld;
    }

    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }

    public getSceneManager(): SceneManager {
        return this.sceneManager;
    }

    public onUpdate(callback: (delta: number) => void) {
        this.onUpdateCallbacks.add(callback);
    }
}
