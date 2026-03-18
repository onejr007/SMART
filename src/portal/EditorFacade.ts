
import { Engine } from '../engine/Core';
import { Entity } from '../engine/Entity';
import * as THREE from 'three';
import { OrbitControls, TransformControls } from 'three-stdlib';
import { persistence } from '../engine/PersistenceManager';
import { DayNightCyclePlugin } from '../engine/plugins/DayNightCyclePlugin';
import { ProceduralTerrainPlugin } from '../engine/plugins/ProceduralTerrainPlugin';
import { QuestSystemPlugin } from '../engine/plugins/QuestSystemPlugin';
import { AIController } from '../engine/components/AIController';
import { StateMachine } from '../engine/components/StateMachine';
import { TriggerVolume } from '../engine/components/TriggerVolume';
import { VisualScripting } from '../engine/components/VisualScripting';
import { uuidManager } from '../engine/UUIDManager';
import { OffscreenRenderer } from '../engine/OffscreenRenderer';

export class EditorFacade {
    private engine: Engine;
    private orbitControls: OrbitControls;
    private transformControls: TransformControls;
    private offscreenRenderer: OffscreenRenderer;
    private onDblClick: ((event: MouseEvent) => void) | null = null;

    constructor(private canvas: HTMLCanvasElement, private onEntitySelected: (entity: Entity | null) => void) {
        this.engine = new Engine(this.canvas, {
            enablePhysicsOptimization: true,
            enableDynamicResolution: true,
            enableSpatialGrid: true,
            enableLOD: true,
            enableWorkers: true,
            enableTelemetry: true,
            enableErrorReporting: true,
            enableWatchdog: true,
            enableContent: true,
            enableSecurity: true,
            enableAssetStreaming: true,
            enableInputManager: true,
            enableNetworking: false,
            enableOffscreenRenderer: true,
            enableServiceWorker: true,
            enableSystemBoundaries: true,
            targetFPS: 60,
            workerPoolSize: 2,
            advanced: {
                enableNetwork: false,
                enableSocial: false,
                enableSecurity: true,
                enableAdvancedRendering: true,
                enableContent: true
            }
        });

        this.orbitControls = new OrbitControls(this.engine.getCamera(), this.canvas);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;

        this.transformControls = new TransformControls(this.engine.getCamera(), this.canvas);
        (this.transformControls as any).addEventListener('dragging-changed', (event: any) => {
            this.orbitControls.enabled = !event.value;
        });
        (this.transformControls as any).addEventListener('change', () => {
            const transformObj = (this.transformControls as any).object;
            if (transformObj && transformObj.userData?.entity) {
                const entity = transformObj.userData.entity as Entity;
                entity.body.position.copy(entity.mesh.position as any);
                entity.body.quaternion.copy(entity.mesh.quaternion as any);
            }
        });
        this.engine.getScene().add(this.transformControls);

        this.offscreenRenderer = new OffscreenRenderer(256, 256);

        this.initEditorScene();
        this.setupRaycasting();
        this.setupUpdateLoop();
    }

    public start() {
        this.engine.start();
        
        // Enable editor features in ImprovisationBootstrap
        const improvisationBootstrap = this.engine.getImprovisationBootstrap();
        if (improvisationBootstrap) {
            improvisationBootstrap.updateConfig({
                mode: 'editor',
                features: {
                    networking: false,
                    physics: true,
                    rendering: true,
                    editor: true,
                    persistence: true
                }
            });
        }
    }

    public stop() {
        this.engine.stop();
        this.engine.dispose();
        this.orbitControls.dispose();
        this.transformControls.dispose();
        if (this.onDblClick) {
            window.removeEventListener('dblclick', this.onDblClick);
            this.onDblClick = null;
        }
    }

    private initEditorScene() {
        const floor = new Entity({
            position: new THREE.Vector3(0, -1, 0),
            size: new THREE.Vector3(50, 1, 50),
            mass: 0,
            color: 0x333333,
            name: 'EditorFloor'
        });
        floor.mesh.userData = { entity: floor };
        this.engine.addEntity(floor);
    }

    private setupRaycasting() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseClick = (event: MouseEvent) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.engine.getCamera());

            const sceneMeshes = Array.from(this.engine.getScene().children).filter(
                (c: THREE.Object3D) => c.userData?.entity && c.userData.entity.name !== 'EditorFloor'
            );

            const interactableMeshes: THREE.Object3D[] = [];
            sceneMeshes.forEach((container: THREE.Object3D) => {
                container.children.forEach((mesh: THREE.Object3D) => interactableMeshes.push(mesh));
            });

            const intersects = raycaster.intersectObjects(interactableMeshes, true);

            if (intersects.length > 0) {
                let object = intersects[0].object;
                while (object.parent && !object.userData?.entity) {
                    object = object.parent;
                }

                if (object.userData?.entity) {
                    this.transformControls.attach(object);
                    this.onEntitySelected(object.userData.entity);
                }
            } else {
                const gizmoHelper = (this.transformControls as any).getHelper ? (this.transformControls as any).getHelper() : null;
                if (gizmoHelper) {
                    const gizmoIntersects = raycaster.intersectObjects([gizmoHelper], true);
                    if (gizmoIntersects.length === 0) {
                        this.transformControls.detach();
                        this.onEntitySelected(null);
                    }
                } else {
                    this.transformControls.detach();
                    this.onEntitySelected(null);
                }
            }
        };

        this.onDblClick = onMouseClick;
        window.addEventListener('dblclick', onMouseClick);
    }

    private setupUpdateLoop() {
        this.engine.onUpdate(() => {
            this.orbitControls.update();
        });
    }

    public addCube(): Entity {
        const uuid = uuidManager.generateUUID();
        const name = `Cube_${Date.now()}`;
        uuidManager.register(name, uuid);

        const cube = new Entity({
            position: new THREE.Vector3(0, 5, 0),
            size: new THREE.Vector3(1, 1, 1),
            mass: 0,
            color: Math.random() * 0xffffff,
            name
        });

        cube.mesh.userData = { entity: cube, uuid };
        this.engine.addEntity(cube);
        this.transformControls.attach(cube.mesh);
        return cube;
    }

    public addNPC(): Entity {
        const uuid = uuidManager.generateUUID();
        const name = `NPC_${Date.now()}`;
        uuidManager.register(name, uuid);

        const npc = new Entity({
            position: new THREE.Vector3(Math.random() * 10 - 5, 2, Math.random() * 10 - 5),
            size: new THREE.Vector3(1, 2, 1),
            mass: 0,
            color: 0x00ff00,
            name
        });

        const aiController = new AIController(3.0);
        npc.addComponent(aiController);

        const stateMachine = new StateMachine();
        const navMesh = this.engine.getNavMesh();

        stateMachine.addState({
            name: 'patrol',
            onUpdate: (delta) => {
                if (Math.random() < 0.01) {
                    const target = new THREE.Vector3(Math.random() * 20 - 10, 2, Math.random() * 20 - 10);
                    const path = navMesh.findPath(npc.mesh.position, target);
                    if (path.length > 1) {
                        aiController.setTarget(path[1]);
                    } else {
                        aiController.setTarget(target);
                    }
                }
            }
        });
        stateMachine.transitionTo('patrol');
        npc.addComponent(stateMachine);

        npc.mesh.userData = { entity: npc, uuid };
        this.engine.addEntity(npc);
        return npc;
    }

    public addTriggerZone(): Entity {
        const uuid = uuidManager.generateUUID();
        const name = `TriggerZone_${Date.now()}`;
        uuidManager.register(name, uuid);

        const trigger = new Entity({
            position: new THREE.Vector3(0, 1, -5),
            size: new THREE.Vector3(3, 3, 3),
            mass: 0,
            color: 0xffff00,
            name
        });

        const triggerVolume = new TriggerVolume(
            (other) => console.log(`Entity ${other.name} entered trigger ${trigger.name}`),
            (other) => console.log(`Entity ${other.name} exited trigger ${trigger.name}`)
        );
        trigger.addComponent(triggerVolume);

        const visualScript = new VisualScripting();
        visualScript.addNode({ id: 'node-1', type: 'ON_TRIGGER_ENTER', params: {}, next: ['node-2'] }, true);
        visualScript.addNode({ id: 'node-2', type: 'CHANGE_COLOR', params: { color: 0xff0000 } });
        trigger.addComponent(visualScript);

        trigger.mesh.userData = { entity: trigger, uuid };
        this.engine.addEntity(trigger);
        return trigger;
    }

    public toggleDayNight(enable: boolean) {
        const pluginSystem = this.engine.getPluginSystem();
        if (enable) {
            pluginSystem.registerPlugin(new DayNightCyclePlugin());
        } else {
            pluginSystem.unregisterPlugin('DayNightCycle');
        }
    }

    public toggleTerrain(enable: boolean) {
        const pluginSystem = this.engine.getPluginSystem();
        if (enable) {
            pluginSystem.registerPlugin(new ProceduralTerrainPlugin());
        } else {
            pluginSystem.unregisterPlugin('ProceduralTerrain');
        }
    }

    public toggleQuests(enable: boolean) {
        const pluginSystem = this.engine.getPluginSystem();
        if (enable) {
            pluginSystem.registerPlugin(new QuestSystemPlugin());
        } else {
            pluginSystem.unregisterPlugin('QuestSystem');
        }
    }

    public setTransformMode(mode: 'translate' | 'rotate' | 'scale') {
        this.transformControls.setMode(mode);
    }

    public attachToEntity(entity: Entity) {
        this.transformControls.attach(entity.mesh);
        this.onEntitySelected(entity);
    }

    public getBootstrap() {
        return this.engine.getBootstrap();
    }
    
    public getImprovisationBootstrap() {
        return this.engine.getImprovisationBootstrap();
    }
    
    public getEntities(): Entity[] {
        return this.engine.getSceneManager().getAllEntities();
    }

    public async saveScene(currentUser: string, title: string, entities: Entity[], playerSchema: any): Promise<string> {
        const sceneManager = this.engine.getSceneManager();
        const bootstrap = this.engine.getBootstrap();
        const contentBootstrap = bootstrap?.getContentBootstrap();

        if (contentBootstrap) {
            const sceneData = sceneManager.serialize();
            const commitId = contentBootstrap.commit(sceneData, `Save: ${title}`);

            this.offscreenRenderer.draw((ctx) => {
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(0, 0, 256, 256);
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.fillText(title, 10, 30);
                ctx.fillText(`Entities: ${entities.length}`, 10, 50);
                ctx.fillText(`UUID: ${commitId?.substring(0, 8)}`, 10, 70);
            });

            await this.offscreenRenderer.toBlob();
        }

        return await persistence.saveGame(title, sceneManager, playerSchema);
    }
}
