import { ThemeConfig, ThemeMetadata, ThemeSettings } from './theme-types';
import { themeEngine } from './theme-engine';

// プリセットテーマのインポート
import lightTheme from './presets/light.json';
import darkTheme from './presets/dark.json';

export class ThemeManager {
  private static instance: ThemeManager;
  private themes: Map<string, ThemeConfig> = new Map();
  private settings: ThemeSettings;
  private storageKey = 'better-chatgpt-theme-settings';

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  constructor() {
    this.settings = this.loadSettings();
    this.initializeThemes();
    this.injectUtilityCSS();
  }

  private initializeThemes(): void {
    // プリセットテーマの登録
    this.registerTheme(lightTheme as ThemeConfig);
    this.registerTheme(darkTheme as ThemeConfig);

    // カスタムテーマの読み込み
    this.loadCustomThemes();

    // 初期テーマの適用
    this.applyCurrentTheme();
  }

  private injectUtilityCSS(): void {
    themeEngine.injectUtilityCSS();
  }

  registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.id, theme);
  }

  getTheme(id: string): ThemeConfig | undefined {
    return this.themes.get(id);
  }

  getAllThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  getThemeMetadata(): ThemeMetadata[] {
    return Array.from(this.themes.values()).map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      author: theme.author,
      version: theme.version,
      isCustom: !['light', 'dark'].includes(theme.id),
    }));
  }

  setCurrentTheme(themeId: string): boolean {
    const theme = this.getTheme(themeId);
    if (!theme) {
      console.warn(`Theme '${themeId}' not found`);
      return false;
    }

    this.settings.currentTheme = themeId;
    this.saveSettings();
    this.applyTheme(theme);
    return true;
  }

  getCurrentTheme(): ThemeConfig | undefined {
    return this.getTheme(this.settings.currentTheme);
  }

  getCurrentThemeId(): string {
    return this.settings.currentTheme;
  }

  private applyCurrentTheme(): void {
    const theme = this.getCurrentTheme();
    if (theme) {
      this.applyTheme(theme);
    } else {
      // フォールバック
      this.setCurrentTheme('dark');
    }
  }

  private applyTheme(theme: ThemeConfig): void {
    themeEngine.applyCSSVariables(theme);
    
    // トランジション効果の適用
    if (this.settings.enableTransitions) {
      document.documentElement.classList.add('theme-transition');
    }

    // カスタムイベントの発火
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme }
    }));
  }

  createCustomTheme(themeData: Partial<ThemeConfig>): ThemeConfig {
    const baseTheme = this.getCurrentTheme() || this.getTheme('dark')!;
    const customTheme: ThemeConfig = {
      id: themeData.id || `custom-${Date.now()}`,
      name: themeData.name || 'Custom Theme',
      description: themeData.description || 'User created theme',
      author: themeData.author || 'User',
      version: '1.0.0',
      colors: { ...baseTheme.colors, ...themeData.colors },
      gradients: baseTheme.gradients ? { ...baseTheme.gradients, ...themeData.gradients } : themeData.gradients,
      shadows: baseTheme.shadows ? { ...baseTheme.shadows, ...themeData.shadows } : themeData.shadows,
    };

    this.registerTheme(customTheme);
    this.saveCustomTheme(customTheme);
    return customTheme;
  }

  updateCustomTheme(themeId: string, updates: Partial<ThemeConfig>): boolean {
    const theme = this.getTheme(themeId);
    if (!theme) return false;

    const updatedTheme: ThemeConfig = {
      ...theme,
      ...updates,
      id: themeId, // IDは変更不可
    };

    this.registerTheme(updatedTheme);
    this.saveCustomTheme(updatedTheme);

    // 現在適用中のテーマの場合は再適用
    if (this.settings.currentTheme === themeId) {
      this.applyTheme(updatedTheme);
    }

    return true;
  }

  deleteCustomTheme(themeId: string): boolean {
    // プリセットテーマは削除不可
    if (['light', 'dark'].includes(themeId)) {
      return false;
    }

    const theme = this.getTheme(themeId);
    if (!theme) return false;

    this.themes.delete(themeId);
    this.removeCustomTheme(themeId);

    // 削除されたテーマが現在適用中の場合はデフォルトに戻す
    if (this.settings.currentTheme === themeId) {
      this.setCurrentTheme('dark');
    }

    return true;
  }

  importTheme(themeJson: string): ThemeConfig | null {
    try {
      const themeData = JSON.parse(themeJson) as ThemeConfig;
      
      // 基本的なバリデーション
      if (!themeData.id || !themeData.name || !themeData.colors) {
        throw new Error('Invalid theme format');
      }

      // IDの重複チェック
      if (this.themes.has(themeData.id)) {
        themeData.id = `${themeData.id}-imported-${Date.now()}`;
      }

      this.registerTheme(themeData);
      this.saveCustomTheme(themeData);
      return themeData;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return null;
    }
  }

  exportTheme(themeId: string): string | null {
    const theme = this.getTheme(themeId);
    if (!theme) return null;

    return JSON.stringify(theme, null, 2);
  }

  previewTheme(theme: ThemeConfig): () => void {
    return themeEngine.previewTheme(theme);
  }

  private loadSettings(): ThemeSettings {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const settings = JSON.parse(stored);
        return {
          currentTheme: settings.currentTheme || 'dark',
          variant: settings.variant || 'dark',
          enableTransitions: settings.enableTransitions !== false,
          customThemes: settings.customThemes || [],
        };
      }
    } catch (error) {
      console.warn('Failed to load theme settings:', error);
    }

    // デフォルト設定
    return {
      currentTheme: 'dark',
      variant: 'dark',
      enableTransitions: true,
      customThemes: [],
    };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save theme settings:', error);
    }
  }

  private loadCustomThemes(): void {
    this.settings.customThemes.forEach(themeId => {
      try {
        const themeData = localStorage.getItem(`theme-${themeId}`);
        if (themeData) {
          const theme = JSON.parse(themeData) as ThemeConfig;
          this.registerTheme(theme);
        }
      } catch (error) {
        console.warn(`Failed to load custom theme ${themeId}:`, error);
      }
    });
  }

  private saveCustomTheme(theme: ThemeConfig): void {
    try {
      localStorage.setItem(`theme-${theme.id}`, JSON.stringify(theme));
      
      // カスタムテーマIDの追加
      if (!this.settings.customThemes.includes(theme.id)) {
        this.settings.customThemes.push(theme.id);
        this.saveSettings();
      }
    } catch (error) {
      console.warn('Failed to save custom theme:', error);
    }
  }

  private removeCustomTheme(themeId: string): void {
    try {
      localStorage.removeItem(`theme-${themeId}`);
      
      // カスタムテーマIDの削除
      this.settings.customThemes = this.settings.customThemes.filter(id => id !== themeId);
      this.saveSettings();
    } catch (error) {
      console.warn('Failed to remove custom theme:', error);
    }
  }

  // 設定の更新
  updateSettings(updates: Partial<ThemeSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();

    // トランジション設定の即座反映
    if ('enableTransitions' in updates) {
      if (updates.enableTransitions) {
        document.documentElement.classList.add('theme-transition');
      } else {
        document.documentElement.classList.remove('theme-transition');
      }
    }
  }

  getSettings(): ThemeSettings {
    return { ...this.settings };
  }
}

export const themeManager = ThemeManager.getInstance();