import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useStore from '@store/store';
import {
  getStorageUsage,
  cleanupImageData,
  cleanupIndexedDBFiles,
  clearAllIndexedDBFiles,
  formatBytes,
  StorageUsage,
} from '@utils/storageManager';

const StorageManager = () => {
  const { t } = useTranslation();
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const setChats = useStore((state) => state.setChats);
  const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);

  const updateStorageUsage = async () => {
    try {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
      console.log('ストレージ使用量を更新しました:', usage);
    } catch (error) {
      console.error('ストレージ使用量の取得に失敗しました:', error);
    }
  };

  useEffect(() => {
    updateStorageUsage();
  }, []);

  const handleCleanupAllFiles = async () => {
    if (!window.confirm('すべての画像ファイルを削除しますか？この操作は取り消せません。')) {
      return;
    }

    setIsLoading(true);
    try {
      // localStorageの画像データを削除
      const localStorageCleaned = cleanupImageData();
      
      // IndexedDBの全ファイルを削除
      const indexedDBCleaned = await clearAllIndexedDBFiles();
      
      const totalCleaned = localStorageCleaned + indexedDBCleaned;
      
      await updateStorageUsage();
      toast.success(`全ての画像ファイルを削除しました: ${formatBytes(totalCleaned)}`);
    } catch (error) {
      console.error('File cleanup error:', error);
      toast.error('ファイルの削除に失敗しました');
    }
    setIsLoading(false);
  };

  const clearConversation = () => {
    if (window.confirm('すべての会話を削除しますか？この操作は取り消せません。')) {
      setChats([]);
      setCurrentChatIndex(-1);
      toast.success('会話をクリアしました');
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500';
    if (percent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!storageUsage) {
    return (
      <div className='flex flex-col items-center gap-2 p-4'>
        <div className='text-sm text-gray-900 dark:text-gray-300'>ストレージ使用量を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg'>
      <div className='text-sm font-semibold text-gray-900 dark:text-gray-300'>ストレージ管理</div>
      
      <div className='w-full'>
        <div className='space-y-1 text-sm mb-2 text-gray-900 dark:text-gray-300'>
          <div className='text-center'>
            <span>合計使用量: {(storageUsage.usedMB + (storageUsage.indexedDBUsedMB || 0)).toFixed(2)} MB</span>
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400 text-center'>
            <span>チャット履歴: {storageUsage.usedMB} MB / 画像: {storageUsage.indexedDBUsedMB || 0} MB</span>
          </div>
        </div>
        
        <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3'>
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getUsageColor(storageUsage.usagePercent)}`}
            style={{ width: `${Math.min(storageUsage.usagePercent, 100)}%` }}
          />
        </div>
        
        <div className='text-center text-sm mt-1 text-gray-900 dark:text-gray-300'>
          <span>{storageUsage.usagePercent}% 使用中</span>
        </div>
      </div>

      <div className='flex flex-col gap-2 w-full items-center'>
        <button
          onClick={handleCleanupAllFiles}
          disabled={isLoading}
          className='btn btn-neutral btn-warning'
        >
          🗑️ 全ての画像ファイルを削除
        </button>
        
        <button
          onClick={clearConversation}
          disabled={isLoading}
          className='btn btn-neutral'
        >
          会話をクリア
        </button>
      </div>

      {storageUsage.usagePercent > 80 && (
        <div className='text-sm text-red-500 text-center'>
          ⚠️ ストレージ使用量が上限に近づいています。データの削除を検討してください。
        </div>
      )}
    </div>
  );
};

export default StorageManager;