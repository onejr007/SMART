// Main Application JavaScript
// Handles global app functionality

class AIWebFramework {
  constructor() {
    this.components = new Map();
    this.pages = new Map();
    this.init();
  }
  
  init() {
    this.setupGlobalEventListeners();
    this.initializeComponents();
    this.setupAIHelpers();
    console.log('🤖 AI Web Framework initialized');
  }
  
  setupGlobalEventListeners() {
    // Global click handler for component interactions
    document.addEventListener('click', this.handleGlobalClick.bind(this));
    
    // Global form submission handler
    document.addEventListener('submit', this.handleGlobalSubmit.bind(this));
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }
  
  initializeComponents() {
    // Auto-initialize all components with data-component attribute
    document.querySelectorAll('[data-component]').forEach(element => {
      const componentName = element.dataset.component;
      const options = element.dataset.options ? JSON.parse(element.dataset.options) : {};
      
      this.registerComponent(componentName, element, options);
    });
  }
  
  registerComponent(name, element, options = {}) {
    if (!this.components.has(name)) {
      this.components.set(name, []);
    }
    
    this.components.get(name).push({
      element,
      options,
      initialized: false
    });
    
    // Try to initialize if component class exists
    this.tryInitializeComponent(name, element, options);
  }
  
  tryInitializeComponent(name, element, options) {
    const className = this.toPascalCase(name);
    
    if (window[className]) {
      try {
        new window[className](element, options);
        console.log(`✅ Component ${className} initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${className}:`, error);
      }
    }
  }
  
  handleGlobalClick(event) {
    // Handle component-specific clicks
    const component = event.target.closest('[data-component]');
    if (component) {
      const componentName = component.dataset.component;
      this.emitComponentEvent(componentName, 'click', event);
    }
  }
  
  handleGlobalSubmit(event) {
    // Handle form submissions
    const form = event.target;
    if (form.tagName === 'FORM') {
      const component = form.closest('[data-component]');
      if (component) {
        const componentName = component.dataset.component;
        this.emitComponentEvent(componentName, 'submit', event);
      }
    }
  }
  
  handleKeyboardShortcuts(event) {
    // AI-friendly keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'r':
          if (event.shiftKey) {
            event.preventDefault();
            this.reloadComponents();
          }
          break;
        case 'g':
          if (event.shiftKey) {
            event.preventDefault();
            this.openGenerator();
          }
          break;
      }
    }
  }
  
  emitComponentEvent(componentName, eventType, originalEvent) {
    const customEvent = new CustomEvent(`component:${componentName}:${eventType}`, {
      detail: {
        component: componentName,
        originalEvent,
        timestamp: Date.now()
      }
    });
    
    document.dispatchEvent(customEvent);
  }
  
  reloadComponents() {
    // Reload all components
    this.components.clear();
    this.initializeComponents();
    console.log('🔄 Components reloaded');
  }
  
  openGenerator() {
    // Navigate to generator section
    const generator = document.getElementById('generator');
    if (generator) {
      generator.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  setupAIHelpers() {
    // Expose helpful methods for AI
    window.aiFramework = {
      // Component management
      getComponents: () => Array.from(this.components.keys()),
      getComponentInstances: (name) => this.components.get(name) || [],
      
      // Dynamic component creation
      createComponent: this.createComponent.bind(this),
      removeComponent: this.removeComponent.bind(this),
      
      // Utility functions
      generateId: () => 'ai-' + Math.random().toString(36).substring(2, 11),
      toPascalCase: this.toPascalCase.bind(this),
      toKebabCase: this.toKebabCase.bind(this),
      
      // API helpers
      api: {
        get: this.apiGet.bind(this),
        post: this.apiPost.bind(this),
        generateComponent: this.apiGenerateComponent.bind(this),
        generatePage: this.apiGeneratePage.bind(this)
      }
    };
  }
  
  createComponent(name, parentElement, options = {}) {
    const element = document.createElement('div');
    element.setAttribute('data-component', name);
    if (Object.keys(options).length > 0) {
      element.setAttribute('data-options', JSON.stringify(options));
    }
    
    parentElement.appendChild(element);
    this.registerComponent(name, element, options);
    
    return element;
  }
  
  removeComponent(element) {
    const componentName = element.dataset.component;
    if (componentName && this.components.has(componentName)) {
      const instances = this.components.get(componentName);
      const index = instances.findIndex(instance => instance.element === element);
      if (index > -1) {
        instances.splice(index, 1);
      }
    }
    
    element.remove();
  }
  
  // Utility methods
  toPascalCase(str) {
    return str.replace(/(?:^|-)(.)/g, (_, char) => char.toUpperCase());
  }
  
  toKebabCase(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  }
  
  // API methods
  async apiGet(endpoint) {
    try {
      const response = await fetch(endpoint);
      return await response.json();
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  }
  
  async apiPost(endpoint, data) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('API POST error:', error);
      throw error;
    }
  }
  
  async apiGenerateComponent(name, type, content) {
    return this.apiPost('/api/generate/component', { name, type, content });
  }
  
  async apiGeneratePage(name, components, layout) {
    return this.apiPost('/api/generate/page', { name, components, layout });
  }
}

// Initialize framework when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AIWebFramework();
});

// Export for module use
export default AIWebFramework;