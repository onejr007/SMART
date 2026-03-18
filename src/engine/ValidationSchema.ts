/**
 * Data Validation Schema (Rekomendasi #15)
 * Client-side validation untuk data Firebase
 */

export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  properties?: Record<string, ValidationRule>;
  items?: ValidationRule;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class DataValidator {
  public static validate(data: any, schema: ValidationRule, path: string = 'root'): ValidationResult {
    const errors: string[] = [];
    
    // Check required
    if (schema.required && (data === undefined || data === null)) {
      errors.push(`${path} is required`);
      return { valid: false, errors };
    }
    
    if (data === undefined || data === null) {
      return { valid: true, errors: [] };
    }
    
    // Check type
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    if (actualType !== schema.type) {
      errors.push(`${path} must be of type ${schema.type}, got ${actualType}`);
      return { valid: false, errors };
    }
    
    // String validation
    if (schema.type === 'string') {
      const str = data as string;
      
      if (schema.minLength !== undefined && str.length < schema.minLength) {
        errors.push(`${path} must be at least ${schema.minLength} characters`);
      }
      
      if (schema.maxLength !== undefined && str.length > schema.maxLength) {
        errors.push(`${path} must be at most ${schema.maxLength} characters`);
      }
      
      if (schema.pattern && !schema.pattern.test(str)) {
        errors.push(`${path} does not match required pattern`);
      }
      
      if (schema.allowedValues && !schema.allowedValues.includes(str)) {
        errors.push(`${path} must be one of: ${schema.allowedValues.join(', ')}`);
      }
    }
    
    // Number validation
    if (schema.type === 'number') {
      const num = data as number;
      
      if (schema.min !== undefined && num < schema.min) {
        errors.push(`${path} must be at least ${schema.min}`);
      }
      
      if (schema.max !== undefined && num > schema.max) {
        errors.push(`${path} must be at most ${schema.max}`);
      }
    }
    
    // Object validation
    if (schema.type === 'object' && schema.properties) {
      const obj = data as Record<string, any>;
      
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const result = this.validate(obj[key], propSchema, `${path}.${key}`);
        errors.push(...result.errors);
      }
    }
    
    // Array validation
    if (schema.type === 'array' && schema.items) {
      const arr = data as any[];
      
      arr.forEach((item, index) => {
        const result = this.validate(item, schema.items!, `${path}[${index}]`);
        errors.push(...result.errors);
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Schema definitions
export const GameMetadataSchema: ValidationRule = {
  type: 'object',
  required: true,
  properties: {
    title: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100,
    },
    author: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 50,
    },
    authorId: {
      type: 'string',
      required: true,
      pattern: /^[a-zA-Z0-9_-]+$/,
    },
    thumbnail: {
      type: 'string',
      maxLength: 500,
    },
    createdAt: {
      type: 'number',
      required: true,
      min: 0,
    },
    updatedAt: {
      type: 'number',
      required: true,
      min: 0,
    },
  },
};

export const EntitySchema: ValidationRule = {
  type: 'object',
  required: true,
  properties: {
    uuid: {
      type: 'string',
      required: true,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    },
    name: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 50,
    },
    position: {
      type: 'object',
      required: true,
      properties: {
        x: { type: 'number', required: true },
        y: { type: 'number', required: true },
        z: { type: 'number', required: true },
      },
    },
    rotation: {
      type: 'object',
      required: true,
      properties: {
        x: { type: 'number', required: true },
        y: { type: 'number', required: true },
        z: { type: 'number', required: true },
      },
    },
    scale: {
      type: 'object',
      properties: {
        x: { type: 'number', required: true, min: 0.01, max: 100 },
        y: { type: 'number', required: true, min: 0.01, max: 100 },
        z: { type: 'number', required: true, min: 0.01, max: 100 },
      },
    },
    mass: {
      type: 'number',
      required: true,
      min: 0,
      max: 10000,
    },
  },
};

export const SceneSchema: ValidationRule = {
  type: 'object',
  required: true,
  properties: {
    version: {
      type: 'string',
      required: true,
      pattern: /^\d+\.\d+\.\d+$/,
    },
    metadata: GameMetadataSchema,
    entities: {
      type: 'array',
      required: true,
      items: EntitySchema,
    },
    config: {
      type: 'object',
    },
  },
};

export const LeaderboardEntrySchema: ValidationRule = {
  type: 'object',
  required: true,
  properties: {
    score: {
      type: 'number',
      required: true,
      min: 0,
      max: 999999999,
    },
    playerName: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 30,
    },
    timestamp: {
      type: 'number',
      required: true,
      min: 0,
    },
  },
};
