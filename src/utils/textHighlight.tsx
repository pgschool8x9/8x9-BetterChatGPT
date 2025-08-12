import React from 'react';

/**
 * テキスト内の検索語をハイライトしてJSX要素を返す
 * @param text ハイライト対象のテキスト
 * @param searchTerm 検索語（ハイライトする語）
 * @returns JSX要素
 */
export const highlightText = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm.trim()) {
    return text;
  }

  try {
    // 特殊文字をエスケープして正規表現を作成
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark
            key={index}
            className="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white rounded px-0.5"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  } catch (error) {
    // 正規表現エラーの場合は元のテキストを返す
    return text;
  }
};