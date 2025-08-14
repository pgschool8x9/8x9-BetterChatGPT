export interface ThemeColors {
  // 基本色
  primary: string;
  secondary: string;
  accent: string;
  
  // 背景色
  background: string;
  surface: string;
  card: string;
  
  // テキスト色
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // 状態色
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // ボーダー・区切り線
  border: string;
  divider: string;
  
  // 入力フィールド
  input: string;
  inputBorder: string;
  inputFocus: string;
  
  // ボタン
  button: string;
  buttonHover: string;
  buttonText: string;
  
  // ホバー効果
  hover: string;
}

export interface ThemeGradients {
  primary: string;
  background: string;
  surface: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version: string;
  colors: ThemeColors;
  gradients?: ThemeGradients;
  shadows?: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface ThemeMetadata {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version: string;
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ThemeVariant = 'light' | 'dark' | 'auto';

export interface ThemeSettings {
  currentTheme: string;
  variant: ThemeVariant;
  autoSwitchTime?: {
    lightStart: string; // "06:00"
    darkStart: string;  // "18:00"
  };
  enableTransitions: boolean;
  customThemes: string[]; // theme IDs
}