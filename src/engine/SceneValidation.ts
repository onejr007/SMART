/**
 * SceneValidation.ts
 * [P1] Validation & linting scene
 * Deteksi masalah sebelum publish (missing collider, too many lights, broken refs)
 */

import * as THREE from 'three';

export interface ValidationRule {
  id: string;
  name: string;
  severity: 'error' | 'warning' | 'info';
  check: (scene: THREE.Scene) => ValidationIssue[];
}

export interface ValidationIssue {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  objectId?: string;
  objectName?: string;
  suggestion?: string;
}

export interface ValidationConfig {
  maxLights: number;
  maxDrawCalls: number;
  maxTriangles: number;
  requireColliders: boolean;
  checkBrokenRefs: boolean;
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxLights: 8,
  maxDrawCalls: 100,
  maxTriangles: 100000,
  requireColliders: true,
  checkBrokenRefs: true
};

export class SceneValidationManager {
  private config: ValidationConfig;
  private rules: Map<string, ValidationRule> = new Map();
  
  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    this.config = { ...config };
    this.registerDefaultRules();
  }
  
  private registerDefaultRules(): void {
    // Rule: Too many lights
    this.registerRule({
      id: 'too-many-lights',
      name: 'Too Many Lights',
      severity: 'warning',
      check: (scene: THREE.Scene) => {
        const issues: ValidationIssue[] = [];
        let lightCount = 0;
        
        scene.traverse((object) => {
          if (object instanceof THREE.Light) {
            lightCount++;
          }
        });
        
        if (lightCount > this.config.maxLights) {
          issues.push({
            ruleId: 'too-many-lights',
            severity: 'warning',
            message: `Scene has ${lightCount} lights, recommended maximum is ${this.config.maxLights}`,
            suggestion: 'Consider using baked lighting or reducing dynamic lights'
          });
        }
        
        return issues;
      }
    });
    
    // Rule: Missing colliders
    this.registerRule({
      id: 'missing-colliders',
      name: 'Missing Colliders',
      severity: 'warning',
      check: (scene: THREE.Scene) => {
        const issues: ValidationIssue[] = [];
        
        if (!this.config.requireColliders) return issues;
        
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh && 
              object.userData.type === 'physics' && 
              !object.userData.collider) {
            issues.push({
              ruleId: 'missing-colliders',
              severity: 'warning',
              message: `Mesh "${object.name}" is marked as physics but has no collider`,
              objectId: object.uuid,
              objectName: object.name,
              suggestion: 'Add a collider component or remove physics flag'
            });
          }
        });
        
        return issues;
      }
    });
    
    // Rule: High triangle count
    this.registerRule({
      id: 'high-triangle-count',
      name: 'High Triangle Count',
      severity: 'warning',
      check: (scene: THREE.Scene) => {
        const issues: ValidationIssue[] = [];
        let totalTriangles = 0;
        
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            const geometry = object.geometry;
            if (geometry.index) {
              totalTriangles += geometry.index.count / 3;
            } else if (geometry.attributes.position) {
              totalTriangles += geometry.attributes.position.count / 3;
            }
          }
        });
        
        if (totalTriangles > this.config.maxTriangles) {
          issues.push({
            ruleId: 'high-triangle-count',
            severity: 'warning',
            message: `Scene has ${Math.floor(totalTriangles)} triangles, recommended maximum is ${this.config.maxTriangles}`,
            suggestion: 'Consider using LOD or simplifying meshes'
          });
        }
        
        return issues;
      }
    });
    
    // Rule: Broken material references
    this.registerRule({
      id: 'broken-material-refs',
      name: 'Broken Material References',
      severity: 'error',
      check: (scene: THREE.Scene) => {
        const issues: ValidationIssue[] = [];
        
        if (!this.config.checkBrokenRefs) return issues;
        
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (!object.material) {
              issues.push({
                ruleId: 'broken-material-refs',
                severity: 'error',
                message: `Mesh "${object.name}" has no material`,
                objectId: object.uuid,
                objectName: object.name,
                suggestion: 'Assign a material to this mesh'
              });
            }
          }
        });
        
        return issues;
      }
    });
    
    // Rule: Empty meshes
    this.registerRule({
      id: 'empty-meshes',
      name: 'Empty Meshes',
      severity: 'warning',
      check: (scene: THREE.Scene) => {
        const issues: ValidationIssue[] = [];
        
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (!object.geometry || 
                !object.geometry.attributes.position || 
                object.geometry.attributes.position.count === 0) {
              issues.push({
                ruleId: 'empty-meshes',
                severity: 'warning',
                message: `Mesh "${object.name}" has no geometry`,
                objectId: object.uuid,
                objectName: object.name,
                suggestion: 'Remove this mesh or assign geometry'
              });
            }
          }
        });
        
        return issues;
      }
    });
    
    // Rule: Unused objects
    this.registerRule({
      id: 'unused-objects',
      name: 'Unused Objects',
      severity: 'info',
      check: (scene: THREE.Scene) => {
        const issues: ValidationIssue[] = [];
        
        scene.traverse((object) => {
          if (!object.visible && object.children.length === 0) {
            issues.push({
              ruleId: 'unused-objects',
              severity: 'info',
              message: `Object "${object.name}" is invisible and has no children`,
              objectId: object.uuid,
              objectName: object.name,
              suggestion: 'Consider removing this object'
            });
          }
        });
        
        return issues;
      }
    });
  }
  
  public registerRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
    console.log(`📝 Registered validation rule: ${rule.name}`);
  }
  
  public validateScene(scene: THREE.Scene): ValidationIssue[] {
    const allIssues: ValidationIssue[] = [];
    
    console.log('🔍 Validating scene...');
    
    for (const rule of this.rules.values()) {
      const issues = rule.check(scene);
      allIssues.push(...issues);
    }
    
    // Sort by severity
    allIssues.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    console.log(`✅ Validation complete: ${allIssues.length} issues found`);
    return allIssues;
  }
  
  public getIssuesBySeverity(issues: ValidationIssue[]): {
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    info: ValidationIssue[];
  } {
    return {
      errors: issues.filter(i => i.severity === 'error'),
      warnings: issues.filter(i => i.severity === 'warning'),
      info: issues.filter(i => i.severity === 'info')
    };
  }
  
  public canPublish(issues: ValidationIssue[]): boolean {
    const { errors } = this.getIssuesBySeverity(issues);
    return errors.length === 0;
  }
  
  public generateReport(issues: ValidationIssue[]): string {
    const { errors, warnings, info } = this.getIssuesBySeverity(issues);
    
    let report = '=== Scene Validation Report ===\n\n';
    
    if (errors.length > 0) {
      report += `❌ Errors (${errors.length}):\n`;
      errors.forEach(issue => {
        report += `  - ${issue.message}\n`;
        if (issue.suggestion) {
          report += `    💡 ${issue.suggestion}\n`;
        }
      });
      report += '\n';
    }
    
    if (warnings.length > 0) {
      report += `⚠️ Warnings (${warnings.length}):\n`;
      warnings.forEach(issue => {
        report += `  - ${issue.message}\n`;
        if (issue.suggestion) {
          report += `    💡 ${issue.suggestion}\n`;
        }
      });
      report += '\n';
    }
    
    if (info.length > 0) {
      report += `ℹ️ Info (${info.length}):\n`;
      info.forEach(issue => {
        report += `  - ${issue.message}\n`;
      });
      report += '\n';
    }
    
    if (issues.length === 0) {
      report += '✅ No issues found!\n';
    }
    
    return report;
  }
  
  public getStats() {
    return {
      totalRules: this.rules.size,
      config: this.config
    };
  }
}
