import * as THREE from 'three';
import { Plugin } from '../PluginSystem';
import { Engine } from '../Core';
import { eventBus } from '../EventBus';

export class DayNightCyclePlugin implements Plugin {
    public name = 'DayNightCycle';
    public version = '1.0.0';
    
    private sun!: THREE.DirectionalLight;
    private ambient!: THREE.AmbientLight;
    private scene!: THREE.Scene;
    private time: number = 0;
    private cycleSpeed: number = 0.1; // Kecepatan siklus

    public initialize(engine: Engine): void {
        this.scene = engine.getScene();
        
        // Cari lampu matahari yang ada atau buat baru
        this.sun = this.scene.children.find(c => (c as THREE.DirectionalLight).isDirectionalLight) as THREE.DirectionalLight;
        this.ambient = this.scene.children.find(c => (c as THREE.AmbientLight).isAmbientLight) as THREE.AmbientLight;

        if (!this.sun) {
            this.sun = new THREE.DirectionalLight(0xffffff, 1);
            this.sun.castShadow = true;
            this.scene.add(this.sun);
        }

        console.log('[DayNightCycle] Plugin initialized.');
    }

    public update(delta: number): void {
        this.time += delta * this.cycleSpeed;
        
        // Kalkulasi posisi matahari (Orbit)
        const x = Math.cos(this.time) * 50;
        const y = Math.sin(this.time) * 50;
        const z = Math.sin(this.time * 0.5) * 20;

        this.sun.position.set(x, y, z);
        
        // Intensitas cahaya berdasarkan waktu (Siang/Malam)
        const intensity = Math.max(0, Math.sin(this.time));
        this.sun.intensity = intensity;
        
        if (this.ambient) {
            this.ambient.intensity = 0.2 + (intensity * 0.3);
        }

        // Ubah warna langit (Sky Color)
        const skyColor = new THREE.Color().setHSL(0.6, 0.5, 0.1 + (intensity * 0.4));
        this.scene.background = skyColor;

        if (this.time > Math.PI * 2) this.time = 0;
    }

    public dispose(): void {
        console.log('[DayNightCycle] Plugin disposed.');
    }
}
