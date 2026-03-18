import { Engine } from "../engine/Core";
import { Entity } from "../engine/Entity";
import { FPSController } from "../engine/Controller";
import { CharacterController } from "../engine/CharacterController";
import { InputManager } from "../engine/Input";
import { PlayerStats } from "../engine/components/PlayerStats";
import { PhysicsInteraction } from "../engine/components/PhysicsInteraction";
import { abuseControl } from "../engine/AbuseControl";
import { DayNightCyclePlugin } from "../engine/plugins/DayNightCyclePlugin";
import { QuestSystemPlugin } from "../engine/plugins/QuestSystemPlugin";
import { leaderboards, LeaderboardEntry } from "../engine/LeaderboardManager";
import { replaySystem } from "../engine/ReplaySystem";
import { assetStreaming, AssetPriority } from "../engine/AssetPriority";
import { assetManager } from "../engine/AssetManager";
import { uuidManager } from "../engine/UUIDManager";
import { eventBus } from "../engine/EventBus";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { Game } from "./App";

export class GameFacade {
  private engine: Engine;
  private inputManager: InputManager | null = null;
  private controller: FPSController | CharacterController | null = null;
  private onKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private game: Game,
    private user: any,
  ) {
    this.engine = new Engine(this.canvas, {
      enablePhysicsOptimization: true,
      enableDynamicResolution: true,
      enableSpatialGrid: true,
      enableLOD: true,
      enableWorkers: false,
      enableTelemetry: true,
      enableErrorReporting: true,
      enableWatchdog: true,
      enableContent: true,
      enableSecurity: true,
      enableAssetStreaming: true,
      enableFPSController: true,
      enableInputManager: true,
      enableNetworking: true,
      enableOffscreenRenderer: true,
      enableServiceWorker: true,
      enableSystemBoundaries: true,
      targetFPS: 60,
      advanced: {
        enableNetwork: true,
        enableSocial: true,
        enableSecurity: true,
        enableAdvancedRendering: true,
        enableContent: true,
      },
    });

    const engineBootstrap = this.engine.getBootstrap();
    if (engineBootstrap) {
      this.inputManager = engineBootstrap.getInputManager();
      this.controller = engineBootstrap.initializeFPSController(this.canvas);
    }

    this.setupInputMapping();
    this.initNavMesh();
    this.registerPlugins();
    this.initPlayer();
    this.setupGameLoop();
    this.loadGameScene();
  }

  public async start(): Promise<void> {
    await this.engine.start();
  }

  public getEventBus() {
    return eventBus;
  }

  public stop() {
    this.engine.stop();
    this.engine.dispose();
    if (this.onKeyDown) {
      window.removeEventListener("keydown", this.onKeyDown);
      this.onKeyDown = null;
    }
  }

  private setupInputMapping() {
    const bootstrap = this.engine.getBootstrap();
    const inputMapping = bootstrap ? bootstrap.getInputMapping() : null;
    if (inputMapping) {
      inputMapping.setMapping("move_forward", "KeyW");
      inputMapping.setMapping("move_backward", "KeyS");
      inputMapping.setMapping("move_left", "KeyA");
      inputMapping.setMapping("move_right", "KeyD");
      inputMapping.setMapping("jump", "Space");
      inputMapping.setMapping("interact", "KeyE");
      inputMapping.setMapping("throw", "KeyQ");
    }
  }

  private initNavMesh() {
    const navMesh = this.engine.getNavMesh();
    for (let x = -20; x <= 20; x += 5) {
      for (let z = -20; z <= 20; z += 5) {
        navMesh.addNode(new THREE.Vector3(x, 0, z));
      }
    }
    const nodes = (navMesh as any).nodes;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].position.distanceTo(nodes[j].position);
        if (dist < 7) {
          navMesh.connectNodes(nodes[i], nodes[j]);
        }
      }
    }
  }

  private registerPlugins() {
    const pluginSystem = this.engine.getPluginSystem();
    pluginSystem.registerPlugin(new DayNightCyclePlugin());
    const questPlugin = new QuestSystemPlugin();
    pluginSystem.registerPlugin(questPlugin);
    questPlugin.addQuest({
      id: "quest-1",
      title: "Explore the World",
      description: "Find the hidden treasure",
      status: "pending",
      objectives: ["TreasureZone"],
      rewards: { coins: 100, experience: 50 },
    });
    questPlugin.startQuest("quest-1");
  }

  private initPlayer() {
    const playerEntity = new Entity({
      position: this.engine.getCamera().position.clone(),
      name: "Player",
    });

    const stats = new PlayerStats(
      this.user?.uid || this.user?.displayName || "unknown",
      this.game.id,
    );
    playerEntity.addComponent(stats);

    const physicsInteraction = new PhysicsInteraction(this.engine.getCamera());
    playerEntity.addComponent(physicsInteraction);

    this.engine.addEntity(playerEntity);

    this.onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyE") {
        physicsInteraction.pickObject();
      }
      if (e.code === "KeyQ") {
        physicsInteraction.throwObject();
        eventBus.emit("scoreUpdated", 10);
      }
    };
    window.addEventListener("keydown", this.onKeyDown);
  }

  private setupGameLoop() {
    this.engine.onUpdate((delta) => {
      if (this.controller && this.inputManager) {
        (this.controller as FPSController).update(delta, this.inputManager);
      }
      assetStreaming.setCameraPosition(this.engine.getCamera().position);
    });
  }

  private loadGameScene() {
    if (this.game.scene && this.game.scene.length > 0) {
      this.game.scene.forEach((entData: any) => {
        const entity = new Entity({
          position: new THREE.Vector3(
            entData.position.x,
            entData.position.y,
            entData.position.z,
          ),
          rotation: new THREE.Euler(
            entData.rotation.x,
            entData.rotation.y,
            entData.rotation.z,
          ),
          size: new THREE.Vector3(
            entData.scale.x,
            entData.scale.y,
            entData.scale.z,
          ),
          mass: entData.mass > 0 ? entData.mass : 1,
          name: entData.name || `Entity_${Date.now()}`,
          color:
            entData.name === "EditorFloor"
              ? 0x333333
              : Math.random() * 0xffffff,
        });
        this.engine.addEntity(entity);
      });
    } else {
      const floor = new Entity({
        position: new THREE.Vector3(0, -1, 0),
        size: new THREE.Vector3(50, 1, 50),
        mass: 0,
        color: 0x228b22,
        name: "Floor",
      });
      this.engine.addEntity(floor);

      for (let i = 0; i < 20; i++) {
        const box = new Entity({
          position: new THREE.Vector3(
            Math.random() * 20 - 10,
            5 + i * 2,
            Math.random() * 20 - 10,
          ),
          size: new THREE.Vector3(1, 1, 1),
          mass: 1,
          color: Math.random() * 0xffffff,
          name: `Box_${i}`,
        });
        this.engine.addEntity(box);
      }
    }
  }

  public toggleLeaderboard = async (show: boolean, gameId: string) => {
    if (show) {
      const data = await leaderboards.getTopScores(gameId, 10);
      return data;
    }
    return [];
  };

  public submitScore = async (
    gameId: string,
    userId: string,
    score: number,
  ) => {
    if (score > 0) {
      await leaderboards.submitScore(gameId, userId, score);
    }
  };

  public toggleRecording = (isRecording: boolean) => {
    if (!isRecording) {
      replaySystem.startRecording();
      return true;
    } else {
      const replayData = replaySystem.stopRecording();
      replaySystem.saveToFile(
        replayData,
        `replay_${this.game.title}_${Date.now()}.json`,
      );
      return false;
    }
  };

  public getBootstrap() {
    return this.engine.getBootstrap();
  }

  public getImprovisationBootstrap() {
    return this.engine.getImprovisationBootstrap();
  }
}
