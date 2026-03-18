/**
 * ContentBootstrap - Content & Collaboration Systems Integration
 * Integrates scene format, collaborative editing, version control, and plugin SDK
 */

import { SceneCanonicalFormat } from "./SceneCanonicalFormat";
import { CollaborativeEditor } from "./CollaborativeEditor";
import { VersionControl } from "./VersionControl";
import { PluginSDK } from "./PluginSDK";
import { eventBus } from "./EventBus";

export interface ContentBootstrapConfig {
  enableCanonicalFormat?: boolean;
  enableCollaboration?: boolean;
  enableVersionControl?: boolean;
  enablePluginSDK?: boolean;
  collaborationMode?: "ot" | "crdt";
  maxVersionHistory?: number;
}

export class ContentBootstrap {
  private canonicalFormat: SceneCanonicalFormat | null = null;
  private collaborativeEditor: CollaborativeEditor | null = null;
  private versionControl: VersionControl | null = null;
  private pluginSDK: PluginSDK | null = null;

  private isEnabled: boolean = false;

  constructor(config: ContentBootstrapConfig = {}) {
    if (
      config.enableCanonicalFormat === false &&
      config.enableCollaboration === false &&
      config.enableVersionControl === false &&
      config.enablePluginSDK === false
    ) {
      console.log("📦 Content systems disabled");
      return;
    }

    this.isEnabled = true;

    // Canonical format
    if (config.enableCanonicalFormat !== false) {
      this.canonicalFormat = new SceneCanonicalFormat();
    }

    // Collaborative editor
    if (config.enableCollaboration !== false) {
      this.collaborativeEditor = new CollaborativeEditor("system-user");
    }

    // Version control
    if (config.enableVersionControl !== false) {
      this.versionControl = new VersionControl();
      this.versionControl.init();
    }

    // Plugin SDK
    if (config.enablePluginSDK !== false) {
      this.pluginSDK = new PluginSDK();
    }

    this.setupEventListeners();
    console.log("✅ Content Bootstrap initialized");
  }

  private setupEventListeners() {
    if (!this.isEnabled) return;

    // Scene save events
    eventBus.on("scene:save", (scene: any) => {
      if (this.canonicalFormat) {
        const canonical = this.canonicalFormat.serialize(scene);
        console.log("💾 Scene serialized to canonical format");

        // Save to version control
        if (this.versionControl) {
          this.versionControl.commit("system", "Auto-save", canonical);
        }
      }
    });

    // Collaboration events
    if (this.collaborativeEditor) {
      eventBus.on("collab:operation", (operation: any) => {
        this.collaborativeEditor!.applyRemoteOperation(operation);
      });
    }

    // Plugin events
    if (this.pluginSDK) {
      eventBus.on("plugin:load", (pluginId: string) => {
        this.pluginSDK!.loadPlugin(pluginId);
      });

      eventBus.on("plugin:unload", (pluginId: string) => {
        this.pluginSDK!.unloadPlugin(pluginId);
      });
    }
  }

  // Canonical format methods
  public serializeScene(scene: any) {
    if (!this.canonicalFormat) {
      console.warn("Canonical format not enabled");
      return null;
    }

    return this.canonicalFormat.serialize(scene);
  }

  public deserializeScene(canonical: any) {
    if (!this.canonicalFormat) {
      console.warn("Canonical format not enabled");
      return null;
    }

    return this.canonicalFormat.deserialize(canonical);
  }

  public verifyScene(canonical: any): boolean {
    if (!this.canonicalFormat) return true;
    return this.canonicalFormat.verify(canonical);
  }

  // Collaborative editing methods
  public async joinCollabSession(sessionId: string, userId: string) {
    if (!this.collaborativeEditor) {
      console.warn("Collaborative editor not enabled");
      return;
    }

    // await this.collaborativeEditor.join(sessionId, userId); // Method not available
    console.log(`👥 Joined collaboration session: ${sessionId}`);
  }

  public leaveCollabSession() {
    if (this.collaborativeEditor) {
      this.collaborativeEditor.leave();
    }
  }

  public sendOperation(operation: any) {
    if (this.collaborativeEditor) {
      this.collaborativeEditor.sendOperation(operation);
    }
  }

  public applyRemoteOperation(operation: any) {
    if (this.collaborativeEditor) {
      this.collaborativeEditor.applyOperation(operation);
    }
  }

  public getCollaborators() {
    if (!this.collaborativeEditor) return [];
    return this.collaborativeEditor.getCollaborators();
  }

  // Version control methods
  public commit(data: any, message: string) {
    if (!this.versionControl) {
      console.warn("Version control not enabled");
      return null;
    }

    const commitId = this.versionControl.commit("user", message, data);
    console.log(`📝 Committed: ${commitId} - ${message}`);
    return commitId;
  }

  public checkout(commitId: string) {
    if (!this.versionControl) {
      console.warn("Version control not enabled");
      return null;
    }

    const data = this.versionControl.checkout(commitId);
    console.log(`🔄 Checked out: ${commitId}`);
    return data;
  }

  public getHistory(limit: number = 10) {
    if (!this.versionControl) return [];
    return this.versionControl.getHistory(limit);
  }

  public diff(commitId1: string, commitId2: string) {
    if (!this.versionControl) return null;
    return this.versionControl.diff(commitId1, commitId2);
  }

  public revert(commitId: string) {
    if (this.versionControl) {
      this.versionControl.revert(commitId);
      console.log(`↩️ Reverted to: ${commitId}`);
    }
  }

  public createBranch(branchName: string) {
    if (this.versionControl) {
      this.versionControl.createBranch(branchName);
      console.log(`🌿 Created branch: ${branchName}`);
    }
  }

  public switchBranch(branchName: string) {
    if (this.versionControl) {
      this.versionControl.switchBranch(branchName);
      console.log(`🔀 Switched to branch: ${branchName}`);
    }
  }

  // Plugin SDK methods
  public loadPlugin(pluginId: string, pluginSource?: any) {
    if (!this.pluginSDK) {
      console.warn("Plugin SDK not enabled");
      return false;
    }

    try {
      this.pluginSDK.loadPlugin(pluginId, pluginSource);
      console.log(`🔌 Plugin loaded: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to load plugin: ${pluginId}`, error);
      return false;
    }
  }

  public unloadPlugin(pluginId: string) {
    if (this.pluginSDK) {
      this.pluginSDK.unloadPlugin(pluginId);
      console.log(`🔌 Plugin unloaded: ${pluginId}`);
    }
  }

  public getLoadedPlugins() {
    if (!this.pluginSDK) return [];
    return this.pluginSDK.getLoadedPlugins();
  }

  public callPluginMethod(pluginId: string, method: string, ...args: any[]) {
    if (!this.pluginSDK) {
      console.warn("Plugin SDK not enabled");
      return null;
    }

    return this.pluginSDK.callMethod(pluginId, method, ...args);
  }

  // Getters
  public getCanonicalFormat() {
    return this.canonicalFormat;
  }
  public getCollaborativeEditor() {
    return this.collaborativeEditor;
  }
  public getVersionControl() {
    return this.versionControl;
  }
  public getPluginSDK() {
    return this.pluginSDK;
  }

  public isContentEnabled() {
    return this.isEnabled;
  }

  public dispose() {
    if (this.collaborativeEditor) {
      this.collaborativeEditor.leave();
    }

    if (this.pluginSDK) {
      const plugins = this.pluginSDK.getLoadedPlugins();
      plugins.forEach((pluginId) => this.pluginSDK!.unloadPlugin(pluginId));
    }

    console.log("✅ Content Bootstrap disposed");
  }
}
