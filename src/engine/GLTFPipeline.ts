// 9. Pipeline glTF standar (KTX2, Meshopt, Draco)
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
// Note: MeshoptDecoder import may vary by Three.js version
// import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export class GLTFPipeline {
  private loader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private ktx2Loader: KTX2Loader;

  constructor(renderer: THREE.WebGLRenderer) {
    this.loader = new GLTFLoader();
    
    // Draco decoder
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');
    this.loader.setDRACOLoader(this.dracoLoader);
    
    // KTX2 decoder
    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('/basis/');
    this.ktx2Loader.detectSupport(renderer);
    this.loader.setKTX2Loader(this.ktx2Loader);
    
    // Meshopt decoder - commented out due to import issues
    // this.loader.setMeshoptDecoder(MeshoptDecoder);
  }

  async load(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        reject
      );
    });
  }

  dispose(): void {
    this.dracoLoader.dispose();
    this.ktx2Loader.dispose();
  }
}
