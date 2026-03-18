/**
 * @ai-metadata
 * @generated-by: Trae-v1
 * @prompt: CLI Generation: component Button
 * @timestamp: 2026-03-17T13:16:37.815Z
 * @type: ui
 * @complexity: Simple
 */
class Button {
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
      theme: "default",
      autoInit: true,

      responsive: true,
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
    this.element.textContent = "";

    const container = document.createElement("div");
    container.className = "button-component";
    container.setAttribute("data-type", "ui");

    const content = document.createElement("div");
    content.className = "ui-content";

    const p = document.createElement("p");
    p.textContent = "UI Component Content";

    content.appendChild(p);
    container.appendChild(content);
    this.element.appendChild(container);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.element.addEventListener("click", this.handleClick.bind(this));
  }

  handleClick(event) {
    this.emit("click", { event, element: event.target });
  }
}

// Auto-register
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('[data-component="button"]').forEach((el) => {
    const options = el.dataset.options ? JSON.parse(el.dataset.options) : {};
    new Button(el, options);
  });
});

export default Button;
