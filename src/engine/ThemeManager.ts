/**
 * ThemeManager.ts
 * Dark/Light Theme Toggle (Quick Win #2)
 * Theme switcher untuk UI
 */

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: string = 'dark';
  private themes: Map<string, Theme> = new Map();
  private onThemeChange?: (theme: Theme) => void;

  private constructor() {
    this.setupDefaultThemes();
    this.loadSavedTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private setupDefaultThemes(): void {
    // Dark theme
    this.themes.set('dark', {
      name: 'Dark',
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        background: '#0a0a0a',
        surface: '#1a1a2e',
        text: '#ffffff',
        textSecondary: '#aaaaaa',
        border: '#444444',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8'
      }
    });

    // Light theme
    this.themes.set('light', {
      name: 'Light',
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        background: '#f5f5f5',
        surface: '#ffffff',
        text: '#000000',
        textSecondary: '#666666',
        border: '#dddddd',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8'
      }
    });

    // Blue theme
    this.themes.set('blue', {
      name: 'Blue',
      colors: {
        primary: '#0072ff',
        secondary: '#00c6ff',
        background: '#0a1929',
        surface: '#132f4c',
        text: '#ffffff',
        textSecondary: '#b2bac2',
        border: '#1e3a5f',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8'
      }
    });
  }

  public setTheme(themeName: string): boolean {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.error(`Theme ${themeName} not found`);
      return false;
    }

    this.currentTheme = themeName;
    this.applyTheme(theme);
    this.saveTheme();

    if (this.onThemeChange) {
      this.onThemeChange(theme);
    }

    return true;
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.primary);
    }
  }

  public getCurrentTheme(): Theme | undefined {
    return this.themes.get(this.currentTheme);
  }

  public getCurrentThemeName(): string {
    return this.currentTheme;
  }

  public getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  public registerTheme(id: string, theme: Theme): void {
    this.themes.set(id, theme);
  }

  public toggleTheme(): void {
    const themes = Array.from(this.themes.keys());
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  private loadSavedTheme(): void {
    try {
      const saved = localStorage.getItem('theme');
      if (saved && this.themes.has(saved)) {
        this.setTheme(saved);
      } else {
        // Apply default theme
        const defaultTheme = this.themes.get(this.currentTheme);
        if (defaultTheme) {
          this.applyTheme(defaultTheme);
        }
      }
    } catch (error) {
      console.error('Failed to load saved theme:', error);
    }
  }

  private saveTheme(): void {
    try {
      localStorage.setItem('theme', this.currentTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  public setOnThemeChange(callback: (theme: Theme) => void): void {
    this.onThemeChange = callback;
  }

  public getThemeCSS(): string {
    const theme = this.getCurrentTheme();
    if (!theme) return '';

    return Object.entries(theme.colors)
      .map(([key, value]) => `--color-${key}: ${value};`)
      .join('\n');
  }
}
