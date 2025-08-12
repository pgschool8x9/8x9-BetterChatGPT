// ストレージ管理ユーティリティ
import { indexedDBManager } from './indexedDBManager';

export interface StorageUsage {
  used: number;
  quota: number;
  usedMB: number;
  quotaMB: number;
  usagePercent: number;
  indexedDBUsed?: number;
  indexedDBUsedMB?: number;
}

// localStorageの各キーのサイズを調査
export const analyzeLocalStorageUsage = (): void => {
  console.log('=== localStorage 分析 ===');
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      const size = value.length;
      totalSize += size;
      console.log(`${key}: ${formatBytes(size)}`);
    }
  }
  
  console.log(`合計: ${formatBytes(totalSize)}`);
  console.log('========================');
};

// ストレージ使用量を取得
export const getStorageUsage = async (): Promise<StorageUsage> => {
  let indexedDBUsed = 0;
  
  try {
    indexedDBUsed = await indexedDBManager.getUsage();
  } catch (error) {
    console.warn('IndexedDB使用量の取得に失敗しました:', error);
  }
  
  // localStorageの分析も実行
  analyzeLocalStorageUsage();

  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    
    return {
      used,
      quota,
      usedMB: Math.round(used / (1024 * 1024) * 100) / 100,
      quotaMB: Math.round(quota / (1024 * 1024) * 100) / 100,
      usagePercent: quota > 0 ? Math.round((used / quota) * 100 * 100) / 100 : 0,
      indexedDBUsed,
      indexedDBUsedMB: Math.round(indexedDBUsed / (1024 * 1024) * 100) / 100
    };
  }
  
  // フォールバック: localStorageのサイズを概算
  let localStorageSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      localStorageSize += key.length + value.length;
    }
  }
  return {
    used: localStorageSize,
    quota: 10 * 1024 * 1024, // 10MB（概算）
    usedMB: Math.round(localStorageSize / (1024 * 1024) * 100) / 100,
    quotaMB: 10,
    usagePercent: Math.round((localStorageSize / (10 * 1024 * 1024)) * 100 * 100) / 100,
    indexedDBUsed,
    indexedDBUsedMB: Math.round(indexedDBUsed / (1024 * 1024) * 100) / 100
  };
};

// 永続ストレージをリクエスト
export const requestPersistentStorage = async (): Promise<boolean> => {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return await navigator.storage.persist();
  }
  return false;
};

// localStorage内の画像データを削除（base64画像）
export const cleanupImageData = (): number => {
  let cleanedSize = 0;
  let imageCount = 0;
  
  try {
    console.log('cleanupImageData: 開始');
    const chatsData = localStorage.getItem('chats');
    
    if (!chatsData) {
      console.log('cleanupImageData: chatsデータが存在しません');
      return 0;
    }
    
    const originalSize = chatsData.length;
    console.log('cleanupImageData: 元のchatsデータサイズ:', formatBytes(originalSize));
    
    const chats = JSON.parse(chatsData);
    let hasChanges = false;
    
    for (const chat of chats) {
      if (chat.messages) {
        for (const message of chat.messages) {
          if (message.content && Array.isArray(message.content)) {
            for (const content of message.content) {
              if (content.type === 'image_url' && content.image_url?.url?.startsWith('data:image/')) {
                const originalImageSize = content.image_url.url.length;
                cleanedSize += originalImageSize;
                imageCount++;
                console.log(`cleanupImageData: 画像削除 #${imageCount}, サイズ:`, formatBytes(originalImageSize));
                content.image_url.url = ''; // 画像データを削除
                hasChanges = true;
              }
            }
          }
        }
      }
    }
    
    if (hasChanges) {
      localStorage.setItem('chats', JSON.stringify(chats));
      const newSize = localStorage.getItem('chats')?.length || 0;
      console.log('cleanupImageData: 新しいchatsデータサイズ:', formatBytes(newSize));
      console.log('cleanupImageData: 実際のサイズ減少:', formatBytes(originalSize - newSize));
    }
    
    console.log(`cleanupImageData: 結果 - ${imageCount}個の画像を削除, 理論上のサイズ削除:`, formatBytes(cleanedSize));
  } catch (error) {
    console.error('画像データの削除中にエラーが発生しました:', error);
  }
  
  return cleanedSize;
};

// IndexedDBの古いファイルを削除
export const cleanupIndexedDBFiles = async (daysOld: number = 30): Promise<number> => {
  try {
    return await indexedDBManager.cleanupOldFiles(daysOld);
  } catch (error) {
    console.error('IndexedDBファイルの削除中にエラーが発生しました:', error);
    return 0;
  }
};

// IndexedDBの全ファイルを削除
export const clearAllIndexedDBFiles = async (): Promise<number> => {
  try {
    return await indexedDBManager.clearAllFiles();
  } catch (error) {
    console.error('IndexedDBのクリア中にエラーが発生しました:', error);
    return 0;
  }
};

// 古いチャットデータを削除（指定された日数より古いもの）
export const cleanupOldChats = (daysOld: number = 30): number => {
  let cleanedSize = 0;
  
  try {
    const chatsData = localStorage.getItem('chats');
    if (chatsData) {
      const originalSize = chatsData.length;
      const chats = JSON.parse(chatsData);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const filteredChats = chats.filter((chat: any) => {
        if (chat.lastModified) {
          const chatDate = new Date(chat.lastModified);
          return chatDate > cutoffDate;
        }
        return true; // 日付が不明な場合は保持
      });
      
      if (filteredChats.length !== chats.length) {
        localStorage.setItem('chats', JSON.stringify(filteredChats));
        const newSize = JSON.stringify(filteredChats).length;
        cleanedSize = originalSize - newSize;
      }
    }
  } catch (error) {
    console.error('古いチャットの削除中にエラーが発生しました:', error);
  }
  
  return cleanedSize;
};

// その他のlocalStorageキャッシュをクリア
export const cleanupOtherCache = (): number => {
  let cleanedSize = 0;
  
  const keysToKeep = ['chats', 'folders', 'theme', 'config'];
  const allKeys = Object.keys(localStorage);
  
  for (const key of allKeys) {
    if (!keysToKeep.includes(key)) {
      const itemSize = localStorage.getItem(key)?.length || 0;
      cleanedSize += itemSize;
      localStorage.removeItem(key);
    }
  }
  
  return cleanedSize;
};

// ストレージを完全にクリア（設定以外）
export const clearAllStorageExceptSettings = (): number => {
  let cleanedSize = 0;
  
  try {
    const config = localStorage.getItem('config');
    const theme = localStorage.getItem('theme');
    
    const allData = JSON.stringify(localStorage);
    cleanedSize = allData.length;
    
    localStorage.clear();
    
    // 設定を復元
    if (config) localStorage.setItem('config', config);
    if (theme) localStorage.setItem('theme', theme);
    
    cleanedSize -= (config?.length || 0) + (theme?.length || 0);
  } catch (error) {
    console.error('ストレージのクリア中にエラーが発生しました:', error);
  }
  
  return cleanedSize;
};

// ファイルサイズを人間が読みやすい形式にフォーマット
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};