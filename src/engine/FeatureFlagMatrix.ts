/**
 * FeatureFlagMatrix.ts
 * [P1] Terapkan "Feature Flag Matrix"
 * Kombinasi flag yang valid untuk mencegah state aneh
 */

export interface FeatureFlags {
  enablePhysics: boolean;
  enableRendering: boolean;
  enableNetworking: boolean;
  enableSecurity: boolean;
  enableEditor: boolean;
  enableAudio: boolean;
  enableProfiling: boolean;
  enableDebugTools: boolean;
}

export interface FlagRule {
  flag: keyof FeatureFlags;
  requires?: (keyof FeatureFlags)[];
  conflicts?: (keyof FeatureFlags)[];
  implies?: (keyof FeatureFlags)[];
}

export const FLAG_RULES: FlagRule[] = [
  {
    flag: 'enableNetworking',
    requires: ['enableSecurity'],
    implies: []
  },
  {
    flag: 'enableEditor',
    requires: ['enableRendering'],
    conflicts: ['enableNetworking'],
    implies: ['enableDebugTools', 'enableProfiling']
  },
  {
    flag: 'enableDebugTools',
    requires: ['enableRendering']
  },
  {
    flag: 'enableProfiling',
    requires: ['enableRendering']
  }
];

export class FeatureFlagValidator {
  private rules: FlagRule[];
  
  constructor(rules: FlagRule[] = FLAG_RULES) {
    this.rules = rules;
  }
  
  public validate(flags: FeatureFlags): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const rule of this.rules) {
      const flagValue = flags[rule.flag];
      
      if (!flagValue) continue;
      
      // Check requirements
      if (rule.requires) {
        for (const required of rule.requires) {
          if (!flags[required]) {
            errors.push(`${rule.flag} requires ${required} to be enabled`);
          }
        }
      }
      
      // Check conflicts
      if (rule.conflicts) {
        for (const conflict of rule.conflicts) {
          if (flags[conflict]) {
            errors.push(`${rule.flag} conflicts with ${conflict}`);
          }
        }
      }
      
      // Check implications
      if (rule.implies) {
        for (const implied of rule.implies) {
          if (!flags[implied]) {
            warnings.push(`${rule.flag} typically implies ${implied} should be enabled`);
          }
        }
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
  
  public autoFix(flags: FeatureFlags): FeatureFlags {
    const fixed = { ...flags };
    
    for (const rule of this.rules) {
      if (!fixed[rule.flag]) continue;
      
      // Auto-enable requirements
      if (rule.requires) {
        for (const required of rule.requires) {
          if (!fixed[required]) {
            console.log(`🔧 Auto-enabling ${required} (required by ${rule.flag})`);
            fixed[required] = true;
          }
        }
      }
      
      // Auto-enable implications
      if (rule.implies) {
        for (const implied of rule.implies) {
          if (!fixed[implied]) {
            console.log(`💡 Auto-enabling ${implied} (implied by ${rule.flag})`);
            fixed[implied] = true;
          }
        }
      }
      
      // Auto-disable conflicts
      if (rule.conflicts) {
        for (const conflict of rule.conflicts) {
          if (fixed[conflict]) {
            console.log(`⚠️ Auto-disabling ${conflict} (conflicts with ${rule.flag})`);
            fixed[conflict] = false;
          }
        }
      }
    }
    
    return fixed;
  }
  
  public getRecommendations(flags: FeatureFlags): string[] {
    const recommendations: string[] = [];
    
    // Check for common patterns
    if (flags.enableNetworking && !flags.enableSecurity) {
      recommendations.push('Enable security when using networking for protection');
    }
    
    if (flags.enableEditor && flags.enableNetworking) {
      recommendations.push('Editor mode typically runs offline; consider disabling networking');
    }
    
    if (flags.enableProfiling && !flags.enableDebugTools) {
      recommendations.push('Enable debug tools for better profiling experience');
    }
    
    return recommendations;
  }
}

export class FeatureFlagManager {
  private flags: FeatureFlags;
  private validator: FeatureFlagValidator;
  private locked: boolean = false;
  
  constructor(initialFlags: Partial<FeatureFlags> = {}) {
    this.flags = {
      enablePhysics: true,
      enableRendering: true,
      enableNetworking: false,
      enableSecurity: false,
      enableEditor: false,
      enableAudio: true,
      enableProfiling: false,
      enableDebugTools: false,
      ...initialFlags
    };
    
    this.validator = new FeatureFlagValidator();
  }
  
  public setFlags(flags: Partial<FeatureFlags>, autoFix: boolean = true): boolean {
    if (this.locked) {
      console.error('❌ Feature flags are locked and cannot be changed');
      return false;
    }
    
    const newFlags = { ...this.flags, ...flags };
    
    if (autoFix) {
      const fixed = this.validator.autoFix(newFlags);
      this.flags = fixed;
    } else {
      const result = this.validator.validate(newFlags);
      
      if (!result.valid) {
        console.error('❌ Invalid feature flag combination:');
        result.errors.forEach(err => console.error(`  - ${err}`));
        return false;
      }
      
      if (result.warnings.length > 0) {
        console.warn('⚠️ Feature flag warnings:');
        result.warnings.forEach(warn => console.warn(`  - ${warn}`));
      }
      
      this.flags = newFlags;
    }
    
    const recommendations = this.validator.getRecommendations(this.flags);
    if (recommendations.length > 0) {
      console.log('💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    return true;
  }
  
  public getFlags(): FeatureFlags {
    return { ...this.flags };
  }
  
  public isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }
  
  public lock(): void {
    this.locked = true;
    console.log('🔒 Feature flags locked');
  }
  
  public unlock(): void {
    this.locked = false;
    console.log('🔓 Feature flags unlocked');
  }
  
  public isLocked(): boolean {
    return this.locked;
  }
}
