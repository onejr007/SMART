import { GLTFLoader, DRACOLoader } from 'three-stdlib';
import * as THREE from 'three';
import { eventBus } from './EventBus';

class AssetManager {
    private loader: GLTFLoader;
    private dracoLoader: DRACOLoader;
    private cache: Map<string, THREE.Group>;
    private loadingTasks: Map<string, Promise<THREE.Group>>;

    constructor() {
        this.loader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        // Set path to draco decoders (usually hosted or from node_modules)
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        this.loader.setDRACOLoader(this.dracoLoader);

        this.cache = new Map();
        this.loadingTasks = new Map();
    }

    public async loadModel(url: string, expectedHash?: string): Promise<THREE.Group> {
        // Check cache
        if (this.cache.has(url)) {
            return this.cache.get(url)!.clone();
        }

        // Check if already loading
        if (this.loadingTasks.has(url)) {
            const group = await this.loadingTasks.get(url)!;
            return group.clone();
        }

        // Load new model
        const task = new Promise<THREE.Group>((resolve, reject) => {
            this.loader.load(
                url,
                async (gltf) => {
                    const scene = gltf.scene;

                    // Integrity Check (Security Recommendation #2)
                    if (expectedHash) {
                        try {
                            const response = await fetch(url);
                            const buffer = await response.arrayBuffer();
                            const actualHash = await this.calculateHash(buffer);
                            if (actualHash !== expectedHash) {
                                console.error(`Integrity check failed for ${url}. Expected: ${expectedHash}, Actual: ${actualHash}`);
                                eventBus.emit('asset:integrity-failed', { url, expectedHash, actualHash });
                                reject(new Error('Integrity check failed'));
                                return;
                            }
                        } catch (hashError) {
                            console.warn('Could not verify asset hash:', hashError);
                        }
                    }
                    
                    // Pre-process model (shadows, etc)
                    scene.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    this.cache.set(url, scene);
                    this.loadingTasks.delete(url);
                    eventBus.emit('asset:loaded', { url, asset: scene });
                    resolve(scene);
                },
                (xhr) => {
                    const progress = (xhr.loaded / xhr.total) * 100;
                    eventBus.emit('asset:progress', { url, progress });
                },
                (error) => {
                    console.error(`Error loading asset ${url}:`, error);
                    this.loadingTasks.delete(url);
                    eventBus.emit('asset:error', { url, error });
                    reject(error);
                }
            );
        });

        this.loadingTasks.set(url, task);
        const result = await task;
        return result.clone();
    }

    private async calculateHash(buffer: ArrayBuffer): Promise<string> {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    public clearCache() {
        this.cache.clear();
    }
}

export const assetManager = new AssetManager();
