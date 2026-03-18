/**
 * PostProcessing.ts
 * Post-Processing Pipeline (#21)
 * Bloom, motion blur, depth of field effects
 * Color grading dan tone mapping
 */

import * as THREE from 'three';
import { EffectComposer } from 'three-stdlib';
import { RenderPass } from 'three-stdlib';
import { UnrealBloomPass } from 'three-stdlib';
import { ShaderPass } from 'three-stdlib';

export interface PostProcessingConfig {
  bloom?: {
    enabled: boolean;
    strength?: number;
    radius?: number;
    threshold?: number;
  };
  colorGrading?: {
    enabled: boolean;
    exposure?: number;
    contrast?: number;
    saturation?: number;
  };
  vignette?: {
    enabled: boolean;
    intensity?: number;
    smoothness?: number;
  };
}

export class PostProcessingPipeline {
  private composer: EffectComposer;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private bloomPass?: UnrealBloomPass;
  private colorGradingPass?: ShaderPass;
  private vignettePass?: ShaderPass;
  private config: PostProcessingConfig;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: PostProcessingConfig = {}
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.config = config;

    this.composer = new EffectComposer(renderer);
    this.setupPasses();
  }

  private setupPasses(): void {
    // Base render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom pass
    if (this.config.bloom?.enabled) {
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.config.bloom.strength || 1.5,
        this.config.bloom.radius || 0.4,
        this.config.bloom.threshold || 0.85
      );
      this.composer.addPass(this.bloomPass);
    }

    // Color grading pass
    if (this.config.colorGrading?.enabled) {
      this.colorGradingPass = new ShaderPass(this.createColorGradingShader());
      this.composer.addPass(this.colorGradingPass);
    }

    // Vignette pass
    if (this.config.vignette?.enabled) {
      this.vignettePass = new ShaderPass(this.createVignetteShader());
      this.vignettePass.renderToScreen = true;
      this.composer.addPass(this.vignettePass);
    }
  }

  private createColorGradingShader(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        exposure: { value: this.config.colorGrading?.exposure || 1.0 },
        contrast: { value: this.config.colorGrading?.contrast || 1.0 },
        saturation: { value: this.config.colorGrading?.saturation || 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float exposure;
        uniform float contrast;
        uniform float saturation;
        varying vec2 vUv;

        vec3 adjustContrast(vec3 color, float contrast) {
          return (color - 0.5) * contrast + 0.5;
        }

        vec3 adjustSaturation(vec3 color, float saturation) {
          float gray = dot(color, vec3(0.299, 0.587, 0.114));
          return mix(vec3(gray), color, saturation);
        }

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec3 color = texel.rgb;
          
          // Exposure
          color *= exposure;
          
          // Contrast
          color = adjustContrast(color, contrast);
          
          // Saturation
          color = adjustSaturation(color, saturation);
          
          gl_FragColor = vec4(color, texel.a);
        }
      `
    });
  }

  private createVignetteShader(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        intensity: { value: this.config.vignette?.intensity || 0.5 },
        smoothness: { value: this.config.vignette?.smoothness || 0.5 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float intensity;
        uniform float smoothness;
        varying vec2 vUv;

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          float vignette = smoothstep(0.8, 0.8 - smoothness, dist * intensity);
          
          gl_FragColor = vec4(texel.rgb * vignette, texel.a);
        }
      `
    });
  }

  public render(delta: number): void {
    this.composer.render(delta);
  }

  public setBloomStrength(strength: number): void {
    if (this.bloomPass) {
      this.bloomPass.strength = strength;
    }
  }

  public setExposure(exposure: number): void {
    if (this.colorGradingPass) {
      this.colorGradingPass.uniforms.exposure.value = exposure;
    }
  }

  public setContrast(contrast: number): void {
    if (this.colorGradingPass) {
      this.colorGradingPass.uniforms.contrast.value = contrast;
    }
  }

  public setSaturation(saturation: number): void {
    if (this.colorGradingPass) {
      this.colorGradingPass.uniforms.saturation.value = saturation;
    }
  }

  public setVignetteIntensity(intensity: number): void {
    if (this.vignettePass) {
      this.vignettePass.uniforms.intensity.value = intensity;
    }
  }

  public setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  public dispose(): void {
    this.composer.dispose();
  }
}
