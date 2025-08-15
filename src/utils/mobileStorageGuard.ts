// モバイルでのPull-to-Refresh時のLocalStorage保護機能

export const isMobileDevice = (): boolean => {
  return typeof window !== 'undefined' && 
    ('ontouchstart' in window || 
     /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
};

export const createStorageGuard = (storageKey: string) => {
  let lastKnownState: string | null = null;
  
  // 定期的にlocalStorageの状態をバックアップ
  const startGuard = () => {
    if (!isMobileDevice()) return;
    
    const checkAndBackup = () => {
      try {
        const currentState = localStorage.getItem(storageKey);
        if (currentState && currentState !== '{}' && currentState !== 'null') {
          lastKnownState = currentState;
          // セッションストレージにもバックアップ
          sessionStorage.setItem(`${storageKey}_backup`, currentState);
          
          // タイムスタンプ付きバックアップの容量制御
          const sessionKeys = Object.keys(sessionStorage);
          const mobileBackupKeys = sessionKeys.filter(key => 
            key.startsWith(`${storageKey}_mobile_backup_`)
          ).sort();
          
          // 古いバックアップを削除（最新5個のみ保持）
          if (mobileBackupKeys.length >= 5) {
            for (let i = 0; i < mobileBackupKeys.length - 4; i++) {
              sessionStorage.removeItem(mobileBackupKeys[i]);
            }
          }
          
          // 新しいバックアップを作成
          sessionStorage.setItem(`${storageKey}_mobile_backup_${Date.now()}`, currentState);
        }
      } catch (error) {
        console.warn('Storage guard backup failed:', error);
        // 容量超過の場合、古いバックアップを全削除
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          const sessionKeys = Object.keys(sessionStorage);
          const mobileBackupKeys = sessionKeys.filter(key => 
            key.startsWith(`${storageKey}_mobile_backup_`)
          );
          mobileBackupKeys.forEach(key => sessionStorage.removeItem(key));
        }
      }
    };
    
    // 初回チェック
    checkAndBackup();
    
    // モバイルではより頻繁にチェック（2秒ごと）
    const interval = setInterval(checkAndBackup, 2000);
    
    // ページイベントリスナー追加
    const events = ['visibilitychange', 'beforeunload', 'pagehide', 'focus', 'blur'];
    const eventHandler = () => {
      checkAndBackup();
    };
    
    events.forEach(event => {
      document.addEventListener(event, eventHandler);
    });
    
    // タッチイベントでもバックアップ（モバイル特有）
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', checkAndBackup, { passive: true });
    }
    
    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, eventHandler);
      });
      if ('ontouchstart' in window) {
        document.removeEventListener('touchstart', checkAndBackup);
      }
    };
  };
  
  // Pull-to-Refresh後の復旧
  const attemptRecovery = () => {
    if (!isMobileDevice()) return false;
    
    try {
      const currentState = localStorage.getItem(storageKey);
      
      // 現在の状態が空または不正な場合
      if (!currentState || currentState === '{}' || currentState === 'null') {
        
        // まずはセッションストレージからの復旧を試行
        const backup = sessionStorage.getItem(`${storageKey}_backup`);
        
        if (backup && backup !== '{}' && backup !== 'null') {
          console.log('Attempting mobile storage recovery from sessionStorage');
          localStorage.setItem(storageKey, backup);
          return true;
        }
        
        // モバイル用タイムスタンプ付きバックアップから最新を復旧
        const sessionKeys = Object.keys(sessionStorage);
        const mobileBackupKeys = sessionKeys.filter(key => 
          key.startsWith(`${storageKey}_mobile_backup_`)
        ).sort().reverse(); // 最新順
        
        for (const key of mobileBackupKeys) {
          const mobileBackup = sessionStorage.getItem(key);
          if (mobileBackup && mobileBackup !== '{}' && mobileBackup !== 'null') {
            console.log('Attempting mobile storage recovery from timestamped backup');
            localStorage.setItem(storageKey, mobileBackup);
            return true;
          }
        }
        
        // 最後に知られた状態からの復旧を試行
        if (lastKnownState && lastKnownState !== '{}' && lastKnownState !== 'null') {
          console.log('Attempting mobile storage recovery from memory');
          localStorage.setItem(storageKey, lastKnownState);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('Storage recovery failed:', error);
      return false;
    }
  };
  
  return {
    startGuard,
    attemptRecovery
  };
};