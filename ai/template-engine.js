// AI Template Engine
// Intelligent template generation based on context and patterns

class AITemplateEngine {
  constructor(contextManager) {
    this.context = contextManager;
    this.templates = {
      component: {
        simple: this.getSimpleComponentTemplate,
        medium: this.getMediumComponentTemplate,
        complex: this.getComplexComponentTemplate
      },
      page: {
        landing: this.getLandingPageTemplate,
        dashboard: this.getDashboardPageTemplate,
        form: this.getFormPageTemplate,
        content: this.getContentPageTemplate
      }
    };
  }
  
  generateComponent(name, type, options = {}) {
    const complexity = this.determineComplexity(options);
    const template = this.templates.component[complexity];
    
    return template.call(this, name, type, options);
  }
  
  generatePage(name, layout, options = {}) {
    const pageType = this.determinePageType(layout, options);
    const template = this.templates.page[pageType] || this.templates.page.content;
    
    return template.call(this, name, layout, options);
  }
  
  determineComplexity(options) {
    let score = 0;
    
    if (options.content && options.content.length > 200) score += 2;
    if (options.props && Object.keys(options.props).length > 3) score += 2;
    if (options.events && options.events.length > 2) score += 1;
    if (options.dependencies && options.dependencies.length > 0) score += 1;
    
    if (score >= 4) return 'complex';
    if (score >= 2) return 'medium';
    return 'simple';
  }
  
  determinePageType(layout, options) {
    if (layout === 'dashboard') return 'dashboard';
    if (options.components && options.components.some(c => c.includes('Form'))) return 'form';
    if (options.meta && options.meta.purpose === 'landing') return 'landing';
    return 'content';
  }
  
  getSimpleComponentTemplate(name, type, options) {
    const timestamp = new Date().toISOString();
    return `/**
 * @ai-metadata
 * @generated-by: Trae-v1
 * @prompt: ${options.aiMetadata?.prompt || 'N/A'}
 * @timestamp: ${timestamp}
 * @type: ${type}
 * @complexity: Simple
 */
class ${name} {
  /**
   * Initialize the component
   * @param {HTMLElement} element - The DOM element
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    this.element = element;
    this.options = { ...this.getDefaultOptions(), ...options };
    this.init();
  }
  
  /**
   * Get default options
   * @returns {Object} Default configuration
   */
  getDefaultOptions() {
    return {
      theme: 'default',
      autoInit: true,
      ${type === 'form' ? 'validation: true,' : ''}
      ${type === 'data' ? 'autoRefresh: false,' : ''}
      ${type === 'ui' ? 'responsive: true,' : ''}
    };
  }
  
  /**
   * Initialize component logic
   */
  init() {
    if (this.options.autoInit) {
      this.render();
      this.bindEvents();
    }
  }
  
  /**
   * Render the component HTML
   */
  render() {
    this.element.innerHTML = \`
      <div class="${name.toLowerCase()}-component" data-type="${type}">
        ${this.getContentTemplate(options.content, type)}
      </div>
    \`;
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    ${this.getEventBindings(type)}
  }
  
  ${this.getTypeSpecificMethods(type)}
}

// Auto-register
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-component="${name.toLowerCase()}"]').forEach(el => {
    const options = el.dataset.options ? JSON.parse(el.dataset.options) : {};
    new ${name}(el, options);
  });
});

export default ${name};`;
  }
  
  getMediumComponentTemplate(name, type, options) {
    return `// AI-Generated Component: ${name}
// Type: ${type} | Complexity: Medium
// Generated: ${new Date().toISOString()}
${options.aiMetadata?.prompt || options.aiMetadata?.aiPrompt ? `// AI Prompt: ${options.aiMetadata?.prompt || options.aiMetadata?.aiPrompt}` : ''}

class ${name} {
  constructor(element, options = {}) {
    this.element = element;
    this.options = { ...this.getDefaultOptions(), ...options };
    this.state = this.getInitialState();
    this.events = new Map();
    this.init();
  }
  
  getDefaultOptions() {
    return {
      theme: 'default',
      autoInit: true,
      responsive: true,
      ${type === 'data' ? 'caching: true, refreshInterval: 30000,' : ''}
      ${type === 'form' ? 'validation: true, autoSave: false,' : ''}
      ${type === 'ui' ? 'animation: true, accessibility: true,' : ''}
    };
  }
  
  getInitialState() {
    return {
      initialized: false,
      loading: false,
      error: null,
      ${type === 'data' ? 'data: null, lastFetch: null,' : ''}
      ${type === 'form' ? 'values: {}, errors: {}, touched: {},' : ''}
    };
  }
  
  init() {
    if (this.options.autoInit) {
      this.render();
      this.bindEvents();
      this.setupAccessibility();
      this.setState({ initialized: true });
    }
  }
  
  render() {
    const { loading, error } = this.state;
    
    this.element.innerHTML = \`
      <div class="${name.toLowerCase()}-component" 
           data-type="${type}" 
           data-theme="\${this.options.theme}"
           \${loading ? 'data-loading="true"' : ''}
           \${error ? 'data-error="true"' : ''}>
        
        \${loading ? this.getLoadingTemplate() : ''}
        \${error ? this.getErrorTemplate(error) : ''}
        \${!loading && !error ? this.getMainTemplate() : ''}
      </div>
    \`;
    
    this.afterRender();
  }
  
  getMainTemplate() {
    return \`
      ${this.getContentTemplate(options.content, type)}
    \`;
  }
  
  getLoadingTemplate() {
    return '<div class="loading">Loading...</div>';
  }
  
  getErrorTemplate(error) {
    return \`<div class="error">Error: \${error}</div>\`;
  }
  
  bindEvents() {
    ${this.getEventBindings(type)}
    
    // Custom events
    ${options.events ? options.events.map(event => 
      `this.on('${event.name}', this.handle${event.name.charAt(0).toUpperCase() + event.name.slice(1)}.bind(this));`
    ).join('\n    ') : ''}
  }
  
  setupAccessibility() {
    this.element.setAttribute('role', '${this.getAriaRole(type)}');
    if (this.options.accessibility) {
      this.element.setAttribute('tabindex', '0');
    }
  }
  
  setState(newState) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    if (this.shouldRerender(prevState, this.state)) {
      this.render();
    }
    
    this.emit('stateChange', { prevState, newState: this.state });
  }
  
  shouldRerender(prevState, newState) {
    return prevState.loading !== newState.loading || 
           prevState.error !== newState.error;
  }
  
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(handler);
  }
  
  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(handler => handler(data));
    }
  }
  
  afterRender() {
    // Override in subclasses
  }
  
  ${this.getTypeSpecificMethods(type)}
  
  destroy() {
    this.events.clear();
    this.element.innerHTML = '';
    this.emit('destroyed');
  }
}

export default ${name};`;
  }
  
  getComplexComponentTemplate(name, type, options) {
    // Complex template with full lifecycle, state management, etc.
    return this.getMediumComponentTemplate(name, type, options) + `

// Advanced features for complex components
${name}.prototype.setupAdvancedFeatures = function() {
  // Performance monitoring
  this.performance = {
    renderTime: 0,
    updateCount: 0
  };
  
  // Plugin system
  this.plugins = new Map();
  
  // Dependency injection
  this.dependencies = new Map();
};

${name}.prototype.addPlugin = function(name, plugin) {
  this.plugins.set(name, plugin);
  plugin.init(this);
};

${name}.prototype.measurePerformance = function(fn, label) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(\`\${label}: \${end - start}ms\`);
  return result;
};`;
  }
  
  getContentTemplate(content, type) {
    if (content) return content;
    
    const templates = {
      ui: '<div class="ui-content"><p>UI Component Content</p></div>',
      data: '<div class="data-content"><div class="data-placeholder">Loading data...</div></div>',
      form: '<form class="form-content"><div class="form-fields"></div><button type="submit">Submit</button></form>',
      layout: '<div class="layout-content"><slot></slot></div>',
      navigation: '<nav class="nav-content"><ul class="nav-list"></ul></nav>',
      media: '<div class="media-content"><div class="media-placeholder">Media content</div></div>',
      utility: '<div class="utility-content">Utility component</div>'
    };
    
    return templates[type] || templates.ui;
  }
  
  getEventBindings(type) {
    const bindings = {
      ui: 'this.element.addEventListener("click", this.handleClick.bind(this));',
      data: 'this.element.addEventListener("refresh", this.handleRefresh.bind(this));',
      form: `this.element.addEventListener("submit", this.handleSubmit.bind(this));
    this.element.addEventListener("input", this.handleInput.bind(this));`,
      navigation: 'this.element.addEventListener("navigate", this.handleNavigate.bind(this));',
      media: 'this.element.addEventListener("load", this.handleMediaLoad.bind(this));'
    };
    
    return bindings[type] || bindings.ui;
  }
  
  getTypeSpecificMethods(type) {
    const methods = {
      ui: `handleClick(event) {
    this.emit('click', { event, element: event.target });
  }`,
      data: `handleRefresh() {
    this.setState({ loading: true });
    // Implement data fetching
  }
  
  fetchData() {
    // Override this method
    return Promise.resolve({});
  }`,
      form: `handleSubmit(event) {
    event.preventDefault();
    this.validate() && this.submit();
  }
  
  handleInput(event) {
    const { name, value } = event.target;
    this.setState({
      values: { ...this.state.values, [name]: value }
    });
  }
  
  validate() {
    // Implement validation
    return true;
  }
  
  submit() {
    this.emit('submit', this.state.values);
  }`
    };
    
    return methods[type] || methods.ui;
  }
  
  getAriaRole(type) {
    const roles = {
      ui: 'region',
      data: 'region',
      form: 'form',
      navigation: 'navigation',
      media: 'img'
    };
    
    return roles[type] || 'region';
  }
  
  // Page templates
  getLandingPageTemplate(name, layout, options) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.meta?.title || name}</title>
    <meta name="description" content="${options.meta?.description || 'Landing page generated by AI'}">
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/components.css">
    <!-- AI-Generated Landing Page: ${name} -->
</head>
<body data-layout="landing">
    <div id="app">
        <header data-component="hero">
            <div class="container">
                <h1>${name}</h1>
                <p class="hero-subtitle">Welcome to our amazing platform</p>
                <div class="cta-buttons">
                    <button class="btn-primary">Get Started</button>
                    <button class="btn-secondary">Learn More</button>
                </div>
            </div>
        </header>
        
        <main>
            <section data-component="features" class="features-section">
                <div class="container">
                    <h2>Features</h2>
                    <div class="features-grid">
                        ${options.components ? options.components.map(comp => 
                          `<div data-component="${comp.toLowerCase()}"></div>`
                        ).join('\n                        ') : ''}
                    </div>
                </div>
            </section>
        </main>
        
        <footer data-component="footer">
            <div class="container">
                <p>&copy; ${new Date().getFullYear()} ${name} - AI Generated</p>
            </div>
        </footer>
    </div>
    
    <script src="/js/hot-reload.js"></script>
    <script type="module" src="/js/app.js"></script>
</body>
</html>`;
  }
  
  getDashboardPageTemplate(name, layout, options) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} Dashboard</title>
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/dashboard.css">
</head>
<body data-layout="dashboard">
    <div id="app">
        <aside data-component="sidebar" class="dashboard-sidebar">
            <nav data-component="navigation"></nav>
        </aside>
        
        <main class="dashboard-main">
            <header data-component="topbar" class="dashboard-header">
                <h1>${name}</h1>
                <div data-component="user-menu"></div>
            </header>
            
            <div class="dashboard-content">
                <div class="dashboard-grid">
                    ${options.components ? options.components.map(comp => 
                      `<div class="dashboard-widget" data-component="${comp.toLowerCase()}"></div>`
                    ).join('\n                    ') : ''}
                </div>
            </div>
        </main>
    </div>
    
    <script src="/js/hot-reload.js"></script>
    <script type="module" src="/js/app.js"></script>
</body>
</html>`;
  }
  
  getFormPageTemplate(name, layout, options) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} Form</title>
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/components.css">
</head>
<body data-layout="form">
    <div id="app">
        <header data-component="header">
            <div class="container">
                <h1>${name}</h1>
            </div>
        </header>
        
        <main class="form-main">
            <div class="container">
                <div class="form-container">
                    ${options.components ? options.components.map(comp => 
                      `<div data-component="${comp.toLowerCase()}"></div>`
                    ).join('\n                    ') : '<div data-component="main-form"></div>'}
                </div>
            </div>
        </main>
    </div>
    
    <script src="/js/hot-reload.js"></script>
    <script type="module" src="/js/app.js"></script>
</body>
</html>`;
  }
  
  getContentPageTemplate(name, layout, options) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/components.css">
</head>
<body data-layout="${layout}">
    <div id="app">
        <header data-component="header">
            <div class="container">
                <h1>${name}</h1>
            </div>
        </header>
        
        <main data-component="main">
            <div class="container">
                <article class="content-article">
                    <h2>Welcome to ${name}</h2>
                    <p>This page was generated by AI and is ready for your content.</p>
                    
                    ${options.components ? options.components.map(comp => 
                      `<section data-component="${comp.toLowerCase()}"></section>`
                    ).join('\n                    ') : ''}
                </article>
            </div>
        </main>
        
        <footer data-component="footer">
            <div class="container">
                <p>&copy; ${new Date().getFullYear()} ${name} - AI Generated</p>
            </div>
        </footer>
    </div>
    
    <script src="/js/hot-reload.js"></script>
    <script type="module" src="/js/app.js"></script>
</body>
</html>`;
  }
}

export default AITemplateEngine;
