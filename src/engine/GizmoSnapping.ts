/**
 * GizmoSnapping.ts
 * P1 Editor #3 - Gizmo snapping system
 * Grid snap, angle snap, surface align, pivot/local/world mode
 */

import * as THREE from 'three';

export type TransformMode = 'translate' | 'rotate' | 'scale';
export type TransformSpace = 'world' | 'local' | 'pivot';
export type SnapMode = 'grid' | 'angle' | 'surface' | 'vertex' | 'none';

export interface GizmoConfig {
  enableSnapping: boolean;
  gridSize: number;
  angleStep: number;
  transformSpace: TransformSpace;
  showGrid: boolean;
  showGizmo: boolean;
}

export class GizmoSnappingManager {
  private config: GizmoConfig;
  private currentMode: TransformMode = 'translate';
  private snapMode: SnapMode = 'grid';
  private selectedObjects: THREE.Object3D[] = [];
  private pivotPoint: THREE.Vector3 = new THREE.Vector3();
  private onTransformChange?: (objects: THREE.Object3D[]) => void;

  constructor(config: Partial<GizmoConfig> = {}) {
    this.config = {
      enableSnapping: true,
      gridSize: 1.0,
      angleStep: 15,
      transformSpace: 'world',
      showGrid: true,
      showGizmo: true,
      ...config
    };
  }

  public setTransformMode(mode: TransformMode): void {
    this.currentMode = mode;
    console.log(`Transform mode: ${mode}`);
  }

  public setTransformSpace(space: TransformSpace): void {
    this.config.transformSpace = space;
    console.log(`Transform space: ${space}`);
  }

  public setSnapMode(mode: SnapMode): void {
    this.snapMode = mode;
    console.log(`Snap mode: ${mode}`);
  }

  public setGridSize(size: number): void {
    this.config.gridSize = Math.max(0.1, size);
  }

  public setAngleStep(degrees: number): void {
    this.config.angleStep = Math.max(1, degrees);
  }

  public toggleSnapping(): void {
    this.config.enableSnapping = !this.config.enableSnapping;
    console.log(`Snapping: ${this.config.enableSnapping ? 'ON' : 'OFF'}`);
  }

  public selectObjects(objects: THREE.Object3D[]): void {
    this.selectedObjects = objects;
    this.updatePivotPoint();
  }

  public translate(delta: THREE.Vector3): void {
    if (this.selectedObjects.length === 0) return;

    const snappedDelta = this.config.enableSnapping && this.snapMode === 'grid'
      ? this.snapToGrid(delta)
      : delta;

    for (const object of this.selectedObjects) {
      if (this.config.transformSpace === 'world') {
        object.position.add(snappedDelta);
      } else if (this.config.transformSpace === 'local') {
        const localDelta = snappedDelta.clone().applyQuaternion(object.quaternion);
        object.position.add(localDelta);
      }
    }

    this.notifyTransformChange();
  }

  public rotate(axis: THREE.Vector3, angle: number): void {
    if (this.selectedObjects.length === 0) return;

    const snappedAngle = this.config.enableSnapping && this.snapMode === 'angle'
      ? this.snapToAngle(angle)
      : angle;

    const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, snappedAngle);

    for (const object of this.selectedObjects) {
      if (this.config.transformSpace === 'world') {
        object.quaternion.multiply(quaternion);
      } else if (this.config.transformSpace === 'local') {
        const localQuaternion = quaternion.clone();
        object.quaternion.multiply(localQuaternion);
      } else if (this.config.transformSpace === 'pivot') {
        // Rotate around pivot point
        const offset = object.position.clone().sub(this.pivotPoint);
        offset.applyQuaternion(quaternion);
        object.position.copy(this.pivotPoint).add(offset);
        object.quaternion.multiply(quaternion);
      }
    }

    this.notifyTransformChange();
  }

  public scale(scaleFactor: THREE.Vector3): void {
    if (this.selectedObjects.length === 0) return;

    for (const object of this.selectedObjects) {
      object.scale.multiply(scaleFactor);
    }

    this.notifyTransformChange();
  }

  public snapToGrid(position: THREE.Vector3): THREE.Vector3 {
    const gridSize = this.config.gridSize;
    return new THREE.Vector3(
      Math.round(position.x / gridSize) * gridSize,
      Math.round(position.y / gridSize) * gridSize,
      Math.round(position.z / gridSize) * gridSize
    );
  }

  public snapToAngle(angle: number): number {
    const step = THREE.MathUtils.degToRad(this.config.angleStep);
    return Math.round(angle / step) * step;
  }

  public snapToSurface(position: THREE.Vector3, normal: THREE.Vector3): THREE.Vector3 {
    // Align to surface normal
    return position.clone().add(normal.clone().multiplyScalar(0.01));
  }

  public alignToSurface(normal: THREE.Vector3): void {
    if (this.selectedObjects.length === 0) return;

    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal.normalize());

    for (const object of this.selectedObjects) {
      object.quaternion.copy(quaternion);
    }

    this.notifyTransformChange();
  }

  public resetTransform(): void {
    for (const object of this.selectedObjects) {
      object.position.set(0, 0, 0);
      object.rotation.set(0, 0, 0);
      object.scale.set(1, 1, 1);
    }

    this.notifyTransformChange();
  }

  private updatePivotPoint(): void {
    if (this.selectedObjects.length === 0) {
      this.pivotPoint.set(0, 0, 0);
      return;
    }

    // Calculate center of selected objects
    const center = new THREE.Vector3();
    for (const object of this.selectedObjects) {
      center.add(object.position);
    }
    center.divideScalar(this.selectedObjects.length);
    this.pivotPoint.copy(center);
  }

  public setPivotPoint(point: THREE.Vector3): void {
    this.pivotPoint.copy(point);
  }

  public getPivotPoint(): THREE.Vector3 {
    return this.pivotPoint.clone();
  }

  public setOnTransformChange(callback: (objects: THREE.Object3D[]) => void): void {
    this.onTransformChange = callback;
  }

  private notifyTransformChange(): void {
    if (this.onTransformChange) {
      this.onTransformChange(this.selectedObjects);
    }
  }

  public getConfig(): GizmoConfig {
    return { ...this.config };
  }

  public getStats() {
    return {
      transformMode: this.currentMode,
      transformSpace: this.config.transformSpace,
      snapMode: this.snapMode,
      snappingEnabled: this.config.enableSnapping,
      gridSize: this.config.gridSize,
      angleStep: this.config.angleStep,
      selectedObjects: this.selectedObjects.length,
      pivotPoint: {
        x: this.pivotPoint.x.toFixed(2),
        y: this.pivotPoint.y.toFixed(2),
        z: this.pivotPoint.z.toFixed(2)
      }
    };
  }

  public dispose(): void {
    this.selectedObjects = [];
  }
}
