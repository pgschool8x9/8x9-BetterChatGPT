import { ThemeConfig, ThemeColors } from './theme-types';

export class ThemeEngine {
  private static instance: ThemeEngine;
  private currentTheme: ThemeConfig | null = null;
  private cssVariablePrefix = '--theme-';

  static getInstance(): ThemeEngine {
    if (!ThemeEngine.instance) {
      ThemeEngine.instance = new ThemeEngine();
    }
    return ThemeEngine.instance;
  }

  applyCSSVariables(theme: ThemeConfig): void {
    const root = document.documentElement;
    
    // 色変数の適用
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVarName = `${this.cssVariablePrefix}${this.kebabCase(key)}`;
      root.style.setProperty(cssVarName, value);
    });

    // グラデーション変数の適用
    if (theme.gradients) {
      Object.entries(theme.gradients).forEach(([key, value]) => {
        const cssVarName = `${this.cssVariablePrefix}gradient-${this.kebabCase(key)}`;
        root.style.setProperty(cssVarName, value);
      });
    }

    // シャドウ変数の適用
    if (theme.shadows) {
      Object.entries(theme.shadows).forEach(([key, value]) => {
        const cssVarName = `${this.cssVariablePrefix}shadow-${this.kebabCase(key)}`;
        root.style.setProperty(cssVarName, value);
      });
    }

    // テーマ属性の設定
    root.setAttribute('data-theme', theme.id);
    this.currentTheme = theme;
  }

  getCurrentTheme(): ThemeConfig | null {
    return this.currentTheme;
  }

  generateTailwindClasses(colors: ThemeColors): Record<string, string> {
    const classes: Record<string, string> = {};
    
    Object.entries(colors).forEach(([key, value]) => {
      const className = this.kebabCase(key);
      classes[`bg-theme-${className}`] = `var(${this.cssVariablePrefix}${className})`;
      classes[`text-theme-${className}`] = `var(${this.cssVariablePrefix}${className})`;
      classes[`border-theme-${className}`] = `var(${this.cssVariablePrefix}${className})`;
    });

    return classes;
  }

  createThemeCSS(theme: ThemeConfig): string {
    let css = `:root[data-theme="${theme.id}"] {\n`;
    
    // 色変数
    Object.entries(theme.colors).forEach(([key, value]) => {
      css += `  ${this.cssVariablePrefix}${this.kebabCase(key)}: ${value};\n`;
    });

    // グラデーション変数
    if (theme.gradients) {
      Object.entries(theme.gradients).forEach(([key, value]) => {
        css += `  ${this.cssVariablePrefix}gradient-${this.kebabCase(key)}: ${value};\n`;
      });
    }

    // シャドウ変数
    if (theme.shadows) {
      Object.entries(theme.shadows).forEach(([key, value]) => {
        css += `  ${this.cssVariablePrefix}shadow-${this.kebabCase(key)}: ${value};\n`;
      });
    }

    css += '}\n';
    return css;
  }

  generateUtilityClasses(): string {
    const utilityClasses = `
    /* テーマベースのユーティリティクラス */
    .bg-theme-primary { background-color: var(--theme-primary); }
    .bg-theme-secondary { background-color: var(--theme-secondary); }
    .bg-theme-accent { background-color: var(--theme-accent); }
    .bg-theme-background { background-color: var(--theme-background); }
    .bg-theme-surface { background-color: var(--theme-surface); }
    .bg-theme-card { background-color: var(--theme-card); }
    .bg-theme-input { background-color: var(--theme-input); }
    .bg-theme-button { background-color: var(--theme-button); }
    .bg-theme-hover { background-color: var(--theme-hover); }

    .text-theme-primary { color: var(--theme-primary); }
    .text-theme-secondary { color: var(--theme-secondary); }
    .text-theme-accent { color: var(--theme-accent); }
    .text-theme-text { color: var(--theme-text); }
    .text-theme-text-secondary { color: var(--theme-text-secondary); }
    .text-theme-text-muted { color: var(--theme-text-muted); }
    .text-theme-button-text { color: var(--theme-button-text); }

    .border-theme-border { border-color: var(--theme-border); }
    .border-theme-divider { border-color: var(--theme-divider); }
    .border-theme-input-border { border-color: var(--theme-input-border); }

    .shadow-theme-small { box-shadow: var(--theme-shadow-small); }
    .shadow-theme-medium { box-shadow: var(--theme-shadow-medium); }
    .shadow-theme-large { box-shadow: var(--theme-shadow-large); }

    /* ホバー効果 */
    .hover\\:bg-theme-hover:hover { background-color: var(--theme-hover); }
    .hover\\:bg-theme-button-hover:hover { background-color: var(--theme-button-hover); }
    .focus\\:border-theme-input-focus:focus { border-color: var(--theme-input-focus); }

    /* 状態色 */
    .text-theme-success { color: var(--theme-success); }
    .text-theme-warning { color: var(--theme-warning); }
    .text-theme-error { color: var(--theme-error); }
    .text-theme-info { color: var(--theme-info); }

    .bg-theme-success { background-color: var(--theme-success); }
    .bg-theme-warning { background-color: var(--theme-warning); }
    .bg-theme-error { background-color: var(--theme-error); }
    .bg-theme-info { background-color: var(--theme-info); }

    /* グラデーション */
    .bg-gradient-theme-primary { background: var(--theme-gradient-primary); }
    .bg-gradient-theme-background { background: var(--theme-gradient-background); }
    .bg-gradient-theme-surface { background: var(--theme-gradient-surface); }

    /* トランジション */
    .theme-transition {
      transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
    }
    `;

    return utilityClasses;
  }

  injectUtilityCSS(): void {
    const existingStyle = document.getElementById('theme-utilities');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'theme-utilities';
    style.textContent = this.generateUtilityClasses();
    document.head.appendChild(style);
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  previewTheme(theme: ThemeConfig): () => void {
    const originalTheme = this.currentTheme;
    this.applyCSSVariables(theme);

    return () => {
      if (originalTheme) {
        this.applyCSSVariables(originalTheme);
      }
    };
  }

  exportThemeAsCSS(theme: ThemeConfig): string {
    return this.createThemeCSS(theme) + this.generateUtilityClasses();
  }
}

export const themeEngine = ThemeEngine.getInstance();