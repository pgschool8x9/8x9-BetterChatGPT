import React, { useState, useEffect } from 'react';
import { themeManager, ThemeConfig, ThemeColors } from '@themes/index';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-2 bg-theme-surface rounded-lg theme-transition">
    <label className="text-sm font-medium text-theme-text">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-theme-border cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 px-2 py-1 text-xs bg-theme-input border border-theme-input-border rounded focus:border-theme-input-focus text-theme-text"
      />
    </div>
  </div>
);

interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  themeId?: string;
}

const ThemeEditor: React.FC<ThemeEditorProps> = ({ isOpen, onClose, themeId }) => {
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [colors, setColors] = useState<ThemeColors>({} as ThemeColors);
  const [isNew, setIsNew] = useState(true);
  const [previewRestore, setPreviewRestore] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (themeId) {
        const theme = themeManager.getTheme(themeId);
        if (theme) {
          setThemeName(theme.name);
          setThemeDescription(theme.description || '');
          setColors(theme.colors);
          setIsNew(false);
        }
      } else {
        // 新規テーマ作成
        const currentTheme = themeManager.getCurrentTheme();
        if (currentTheme) {
          setThemeName('New Custom Theme');
          setThemeDescription('');
          setColors(currentTheme.colors);
          setIsNew(true);
        }
      }
    }
  }, [isOpen, themeId]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);

    // リアルタイムプレビュー
    if (previewRestore) {
      previewRestore();
    }

    const previewTheme: ThemeConfig = {
      id: 'preview',
      name: 'Preview',
      version: '1.0.0',
      colors: newColors,
    };

    const restore = themeManager.previewTheme(previewTheme);
    setPreviewRestore(() => restore);
  };

  const handleSave = () => {
    const themeData: Partial<ThemeConfig> = {
      id: isNew ? undefined : themeId,
      name: themeName,
      description: themeDescription,
      colors,
    };

    if (isNew) {
      const newTheme = themeManager.createCustomTheme(themeData);
      themeManager.setCurrentTheme(newTheme.id);
    } else if (themeId) {
      themeManager.updateCustomTheme(themeId, themeData);
    }

    handleClose();
  };

  const handleClose = () => {
    if (previewRestore) {
      previewRestore();
      setPreviewRestore(null);
    }
    onClose();
  };

  const handleExport = () => {
    const exportTheme: ThemeConfig = {
      id: `custom-${Date.now()}`,
      name: themeName,
      description: themeDescription,
      author: 'User',
      version: '1.0.0',
      colors,
    };

    const themeJson = JSON.stringify(exportTheme, null, 2);
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${themeName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const colorGroups = {
    '基本色': ['primary', 'secondary', 'accent'] as (keyof ThemeColors)[],
    '背景色': ['background', 'surface', 'card'] as (keyof ThemeColors)[],
    'テキスト': ['text', 'textSecondary', 'textMuted'] as (keyof ThemeColors)[],
    '状態色': ['success', 'warning', 'error', 'info'] as (keyof ThemeColors)[],
    'ボーダー': ['border', 'divider'] as (keyof ThemeColors)[],
    '入力フィールド': ['input', 'inputBorder', 'inputFocus'] as (keyof ThemeColors)[],
    'ボタン': ['button', 'buttonHover', 'buttonText'] as (keyof ThemeColors)[],
    'その他': ['hover'] as (keyof ThemeColors)[],
  };

  const getColorLabel = (key: string): string => {
    const labels: Record<string, string> = {
      primary: 'プライマリ',
      secondary: 'セカンダリ',
      accent: 'アクセント',
      background: '背景',
      surface: 'サーフェス',
      card: 'カード',
      text: 'メインテキスト',
      textSecondary: 'サブテキスト',
      textMuted: '薄いテキスト',
      success: '成功',
      warning: '警告',
      error: 'エラー',
      info: '情報',
      border: 'ボーダー',
      divider: '区切り線',
      input: '入力背景',
      inputBorder: '入力ボーダー',
      inputFocus: '入力フォーカス',
      button: 'ボタン',
      buttonHover: 'ボタンホバー',
      buttonText: 'ボタンテキスト',
      hover: 'ホバー',
    };
    return labels[key] || key;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-theme-card border border-theme-border rounded-lg shadow-theme-large max-w-4xl w-full max-h-[90vh] overflow-hidden theme-transition">
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text">
            {isNew ? 'カスタムテーマを作成' : 'テーマを編集'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-theme-hover rounded-lg theme-transition text-theme-text"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* テーマ情報 */}
            <div className="space-y-4">
              <h3 className="font-medium text-theme-text">テーマ情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">テーマ名</label>
                  <input
                    type="text"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input-border rounded-lg focus:border-theme-input-focus text-theme-text theme-transition"
                    placeholder="テーマ名を入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">説明</label>
                  <input
                    type="text"
                    value={themeDescription}
                    onChange={(e) => setThemeDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input-border rounded-lg focus:border-theme-input-focus text-theme-text theme-transition"
                    placeholder="テーマの説明"
                  />
                </div>
              </div>
            </div>

            {/* カラー設定 */}
            <div className="space-y-6">
              <h3 className="font-medium text-theme-text">カラー設定</h3>
              {Object.entries(colorGroups).map(([groupName, colorKeys]) => (
                <div key={groupName} className="space-y-2">
                  <h4 className="text-sm font-medium text-theme-text-secondary">{groupName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {colorKeys.map((key) => (
                      <ColorInput
                        key={String(key)}
                        label={getColorLabel(String(key))}
                        value={colors[key] || '#000000'}
                        onChange={(value) => handleColorChange(key, value)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between p-6 border-t border-theme-border">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-theme-text-secondary hover:bg-theme-hover rounded-lg theme-transition"
          >
            エクスポート
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-theme-text-secondary hover:bg-theme-hover rounded-lg theme-transition"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-theme-primary text-theme-button-text rounded-lg hover:bg-theme-button-hover theme-transition"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeEditor;