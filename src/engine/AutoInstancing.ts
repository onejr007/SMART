// 7. GPU instancing otomatis
import * as THREE from 'three';

export class AutoInstancing {
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();

  private getMeshKey(geometry: THREE.BufferGeometry, material: THREE.Material): string {
    return `${geometry.uuid}_${material.uuid}`;
  }

  processScene(scene: THREE.Scene): void {
    const meshGroups = new Map<string, THREE.Mesh[]>();

    // Group identical meshes
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !(obj instanceof THREE.InstancedMesh)) {
        const key = this.getMeshKey(obj.geometry, obj.material as THREE.Material);
        if (!meshGroups.has(key)) {
          meshGroups.set(key, []);
        }
        meshGroups.get(key)!.push(obj);
      }
    });

    // Convert to instanced meshes
    for (const [key, meshes] of meshGroups) {
      if (meshes.length >= 3) { // Minimum 3 instances
        this.createInstancedMesh(meshes, scene);
      }
    }
  }

  private createInstancedMesh(meshes: THREE.Mesh[], scene: THREE.Scene): void {
    const first = meshes[0];
    const instanced = new THREE.InstancedMesh(
      first.geometry,
      first.material,
      meshes.length
    );

    const matrix = new THREE.Matrix4();
    meshes.forEach((mesh, i) => {
      mesh.updateMatrix();
      instanced.setMatrixAt(i, mesh.matrix);
      mesh.parent?.remove(mesh);
    });

    instanced.instanceMatrix.needsUpdate = true;
    scene.add(instanced);

    const key = this.getMeshKey(first.geometry, first.material as THREE.Material);
    this.instancedMeshes.set(key, instanced);
  }

  dispose(): void {
    this.instancedMeshes.clear();
  }
}
