import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Plugin } from '../PluginSystem';
import { Engine } from '../Core';

export class ProceduralTerrainPlugin implements Plugin {
    public name = 'ProceduralTerrain';
    public version = '1.0.0';
    
    private scene!: THREE.Scene;
    private physicsWorld!: CANNON.World;
    private terrainMesh!: THREE.Mesh;
    private terrainBody!: CANNON.Body;

    public initialize(engine: Engine): void {
        this.scene = engine.getScene();
        this.physicsWorld = engine.getPhysicsWorld();
        this.generateTerrain();
    }

    private generateTerrain() {
        const size = 100;
        const resolution = 50;
        const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
        
        // Simpel Noise menggunakan Math.sin/cos untuk simulasi terrain
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            // Generate height
            vertices[i + 2] = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2 + 
                             Math.sin(x * 0.5) * 0.5;
        }
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x3a5a40, 
            wireframe: false,
            flatShading: true 
        });
        
        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.rotation.x = -Math.PI / 2;
        this.terrainMesh.receiveShadow = true;
        this.scene.add(this.terrainMesh);

        // Physics Terrain (Heightfield)
        const matrix: number[][] = [];
        for (let i = 0; i <= resolution; i++) {
            matrix.push([]);
            for (let j = 0; j <= resolution; j++) {
                const idx = (i * (resolution + 1) + j) * 3;
                matrix[i].push(vertices[idx + 2]);
            }
        }

        const hfShape = new CANNON.Heightfield(matrix, {
            elementSize: size / resolution
        });
        
        this.terrainBody = new CANNON.Body({ mass: 0 });
        this.terrainBody.addShape(hfShape);
        
        // Posisi cannon heightfield perlu disesuaikan karena THREE Plane pusatnya di 0,0
        this.terrainBody.position.set(-size / 2, 0, size / 2);
        this.terrainBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        
        this.physicsWorld.addBody(this.terrainBody);
    }

    public dispose(): void {
        if (this.terrainMesh) {
            this.scene.remove(this.terrainMesh);
            this.terrainMesh.geometry.dispose();
            (this.terrainMesh.material as THREE.Material).dispose();
        }
        if (this.terrainBody) {
            this.physicsWorld.removeBody(this.terrainBody);
        }
    }
}
