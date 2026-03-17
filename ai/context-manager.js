// AI Context Manager
// Manages context and metadata for AI operations

import fs from 'fs/promises';
import path from 'path';

class AIContextManager {
  constructor() {
    this.contextFile = 'ai/context.json';
    this.context = {
      project: {
        name: 'AI Web Framework',
        version: '1.0.0',
        description: 'AI-friendly web development framework'
      },
      components: {},
      pages: {},
      patterns: {},
      history: [],
      preferences: {
        naming: 'PascalCase',
        cssFramework: 'custom',
        jsFramework: 'vanilla',
        aiAssistance: 'enabled'
      }
    };
    this.ready = this.init();
  }
  
  async init() {
    try {
      await this.loadContext();
    } catch (error) {
      console.log('Creating new AI context...');
      await this.saveContext();
    }
  }
  
  async loadContext() {
    const data = await fs.readFile(this.contextFile, 'utf8');
    this.context = { ...this.context, ...JSON.parse(data) };
  }

  async ensureReady() {
    await this.ready;
  }
  
  async saveContext() {
    await fs.mkdir(path.dirname(this.contextFile), { recursive: true });
    await fs.writeFile(this.contextFile, JSON.stringify(this.context, null, 2));
  }
  
  // Component context management
  addComponent(name, metadata) {
    const prompt = metadata.prompt || metadata.aiPrompt || 'N/A';
    this.context.components[name] = {
      ...metadata,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      usage: 0,
      dependencies: metadata.dependencies || [],
      aiMetadata: {
        prompt,
        agent: metadata.generatedBy || 'AI-Agent',
        version: '1.0.0'
      }
    };
    this.addToHistory('component_created', { name, metadata });
    this.saveContext();
  }
  
  updateComponent(name, updates) {
    if (this.context.components[name]) {
      this.context.components[name] = {
        ...this.context.components[name],
        ...updates,
        lastModified: new Date().toISOString()
      };
      this.addToHistory('component_updated', { name, updates });
      this.saveContext();
    } else {
      console.warn(`Component ${name} not found for update.`);
    }
  }
  
  getComponent(name) {
    return this.context.components[name] || null;
  }
  
  getAllComponents() {
    return this.context.components;
  }
  
  // Page context management
  addPage(name, metadata) {
    this.context.pages[name] = {
      ...metadata,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      views: 0
    };
    this.addToHistory('page_created', { name, metadata });
    this.saveContext();
  }
  
  // Pattern learning
  addPattern(type, pattern, success = true) {
    if (!this.context.patterns[type]) {
      this.context.patterns[type] = [];
    }
    
    this.context.patterns[type].push({
      pattern,
      success,
      timestamp: new Date().toISOString(),
      frequency: 1
    });
    
    // Keep only last 100 patterns per type
    if (this.context.patterns[type].length > 100) {
      this.context.patterns[type] = this.context.patterns[type].slice(-100);
    }
    
    this.saveContext();
  }
  
  getSuccessfulPatterns(type) {
    return (this.context.patterns[type] || [])
      .filter(p => p.success)
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  // History management
  addToHistory(action, data) {
    this.context.history.push({
      action,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 history items
    if (this.context.history.length > 1000) {
      this.context.history = this.context.history.slice(-1000);
    }
  }
  
  getRecentHistory(limit = 10) {
    return this.context.history.slice(-limit).reverse();
  }
  
  // AI suggestions
  suggestComponentName(type, description) {
    const patterns = this.getSuccessfulPatterns('component_naming');
    const typePatterns = patterns.filter(p => p.pattern.type === type);
    
    if (typePatterns.length > 0) {
      // Use successful patterns to suggest names
      const commonWords = typePatterns
        .map(p => p.pattern.name)
        .join(' ')
        .split(/[A-Z]/)
        .filter(w => w.length > 2);
      
      return this.generateNameFromWords(commonWords, description);
    }
    
    return this.generateNameFromDescription(description);
  }
  
  generateNameFromWords(words, description) {
    // Simple name generation logic
    const descWords = description.toLowerCase().split(' ');
    const relevantWords = words.filter(w => 
      descWords.some(dw => dw.includes(w.toLowerCase()))
    );
    
    if (relevantWords.length > 0) {
      return relevantWords[0].charAt(0).toUpperCase() + relevantWords[0].slice(1) + 'Component';
    }
    
    return this.generateNameFromDescription(description);
  }
  
  generateNameFromDescription(description) {
    return description
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '') + 'Component';
  }
  
  // Analytics for AI
  getAnalytics() {
    const componentCount = Object.keys(this.context.components).length;
    const pageCount = Object.keys(this.context.pages).length;
    const recentActivity = this.getRecentHistory(20);
    
    const componentTypes = Object.values(this.context.components)
      .reduce((acc, comp) => {
        acc[comp.type] = (acc[comp.type] || 0) + 1;
        return acc;
      }, {});
    
    return {
      summary: {
        components: componentCount,
        pages: pageCount,
        patterns: Object.keys(this.context.patterns).length,
        historyItems: this.context.history.length
      },
      componentTypes,
      recentActivity,
      preferences: this.context.preferences
    };
  }
  
  // Export context for AI analysis
  exportForAI() {
    return {
      project: this.context.project,
      structure: {
        components: Object.keys(this.context.components),
        pages: Object.keys(this.context.pages)
      },
      patterns: this.context.patterns,
      preferences: this.context.preferences,
      analytics: this.getAnalytics()
    };
  }
}

export default AIContextManager;
