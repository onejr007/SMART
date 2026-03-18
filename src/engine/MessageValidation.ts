/**
 * MessageValidation.ts
 * [P0] Message schema validation + versioning
 * Setiap packet punya type, version, dan schema validator
 */

export interface MessageSchema {
  type: string;
  version: string;
  fields: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      required: boolean;
      min?: number;
      max?: number;
      pattern?: RegExp;
      validator?: (value: any) => boolean;
    };
  };
}

export interface Message {
  type: string;
  version: string;
  timestamp: number;
  senderId: string;
  data: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class MessageValidationManager {
  private schemas: Map<string, Map<string, MessageSchema>> = new Map(); // type -> version -> schema
  private messageCount: number = 0;
  private validationErrors: number = 0;
  
  constructor() {
    this.registerDefaultSchemas();
  }
  
  private registerDefaultSchemas(): void {
    // Position update message
    this.registerSchema({
      type: 'position-update',
      version: '1.0.0',
      fields: {
        entityId: { type: 'string', required: true },
        position: { type: 'object', required: true },
        rotation: { type: 'object', required: false },
        velocity: { type: 'object', required: false }
      }
    });
    
    // Chat message
    this.registerSchema({
      type: 'chat',
      version: '1.0.0',
      fields: {
        message: { 
          type: 'string', 
          required: true,
          min: 1,
          max: 500
        },
        channel: { type: 'string', required: false }
      }
    });
    
    // Entity spawn
    this.registerSchema({
      type: 'entity-spawn',
      version: '1.0.0',
      fields: {
        entityId: { type: 'string', required: true },
        entityType: { type: 'string', required: true },
        position: { type: 'object', required: true },
        properties: { type: 'object', required: false }
      }
    });
    
    // Entity destroy
    this.registerSchema({
      type: 'entity-destroy',
      version: '1.0.0',
      fields: {
        entityId: { type: 'string', required: true }
      }
    });
  }
  
  public registerSchema(schema: MessageSchema): void {
    if (!this.schemas.has(schema.type)) {
      this.schemas.set(schema.type, new Map());
    }
    
    this.schemas.get(schema.type)!.set(schema.version, schema);
    console.log(`📝 Registered message schema: ${schema.type} v${schema.version}`);
  }
  
  public validateMessage(message: Message): ValidationResult {
    this.messageCount++;
    const errors: string[] = [];
    
    // Check if message has required fields
    if (!message.type) {
      errors.push('Missing message type');
    }
    
    if (!message.version) {
      errors.push('Missing message version');
    }
    
    if (!message.senderId) {
      errors.push('Missing sender ID');
    }
    
    if (!message.timestamp) {
      errors.push('Missing timestamp');
    }
    
    if (errors.length > 0) {
      this.validationErrors++;
      return { valid: false, errors };
    }
    
    // Get schema for this message type and version
    const typeSchemas = this.schemas.get(message.type);
    if (!typeSchemas) {
      errors.push(`Unknown message type: ${message.type}`);
      this.validationErrors++;
      return { valid: false, errors };
    }
    
    const schema = typeSchemas.get(message.version);
    if (!schema) {
      errors.push(`Unknown version ${message.version} for message type ${message.type}`);
      this.validationErrors++;
      return { valid: false, errors };
    }
    
    // Validate data against schema
    const dataErrors = this.validateData(message.data, schema);
    if (dataErrors.length > 0) {
      this.validationErrors++;
      return { valid: false, errors: dataErrors };
    }
    
    return { valid: true, errors: [] };
  }
  
  private validateData(data: any, schema: MessageSchema): string[] {
    const errors: string[] = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Message data must be an object');
      return errors;
    }
    
    // Check required fields
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      if (fieldSchema.required && !(fieldName in data)) {
        errors.push(`Missing required field: ${fieldName}`);
        continue;
      }
      
      if (!(fieldName in data)) continue;
      
      const value = data[fieldName];
      
      // Type validation
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== fieldSchema.type) {
        errors.push(`Field ${fieldName} has wrong type: expected ${fieldSchema.type}, got ${actualType}`);
        continue;
      }
      
      // String validation
      if (fieldSchema.type === 'string') {
        if (fieldSchema.min !== undefined && value.length < fieldSchema.min) {
          errors.push(`Field ${fieldName} is too short: minimum ${fieldSchema.min} characters`);
        }
        if (fieldSchema.max !== undefined && value.length > fieldSchema.max) {
          errors.push(`Field ${fieldName} is too long: maximum ${fieldSchema.max} characters`);
        }
        if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
          errors.push(`Field ${fieldName} does not match required pattern`);
        }
      }
      
      // Number validation
      if (fieldSchema.type === 'number') {
        if (fieldSchema.min !== undefined && value < fieldSchema.min) {
          errors.push(`Field ${fieldName} is too small: minimum ${fieldSchema.min}`);
        }
        if (fieldSchema.max !== undefined && value > fieldSchema.max) {
          errors.push(`Field ${fieldName} is too large: maximum ${fieldSchema.max}`);
        }
      }
      
      // Custom validator
      if (fieldSchema.validator && !fieldSchema.validator(value)) {
        errors.push(`Field ${fieldName} failed custom validation`);
      }
    }
    
    return errors;
  }
  
  public createMessage(type: string, version: string, senderId: string, data: any): Message {
    return {
      type,
      version,
      timestamp: Date.now(),
      senderId,
      data
    };
  }
  
  public getSchema(type: string, version: string): MessageSchema | undefined {
    return this.schemas.get(type)?.get(version);
  }
  
  public getSupportedVersions(type: string): string[] {
    const typeSchemas = this.schemas.get(type);
    return typeSchemas ? Array.from(typeSchemas.keys()) : [];
  }
  
  public getStats() {
    let totalSchemas = 0;
    for (const versions of this.schemas.values()) {
      totalSchemas += versions.size;
    }
    
    return {
      totalMessageTypes: this.schemas.size,
      totalSchemas,
      messagesValidated: this.messageCount,
      validationErrors: this.validationErrors,
      errorRate: this.messageCount > 0 ? (this.validationErrors / this.messageCount) * 100 : 0
    };
  }
  
  public dispose(): void {
    this.schemas.clear();
  }
}
