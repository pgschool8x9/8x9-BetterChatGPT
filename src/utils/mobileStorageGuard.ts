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
        }
      } catch (error) {
        console.warn('Storage guard backup failed:', error);
      }
    };
    
    // 初回チェック
    checkAndBackup();
    
    // 5秒ごとにチェック
    const interval = setInterval(checkAndBackup, 5000);
    
    // ページが隠れた時にもバックアップ
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        checkAndBackup();
      }
    });
    
    return () => clearInterval(interval);
  };
  
  // Pull-to-Refresh後の復旧
  const attemptRecovery = () => {
    if (!isMobileDevice()) return false;
    
    try {
      const currentState = localStorage.getItem(storageKey);
      
      // 現在の状態が空または不正な場合
      if (!currentState || currentState === '{}' || currentState === 'null') {
        
        // セッションストレージからの復旧を試行
        const backup = sessionStorage.getItem(`${storageKey}_backup`);
        
        if (backup && backup !== '{}' && backup !== 'null') {
          console.log('Attempting mobile storage recovery from sessionStorage');
          localStorage.setItem(storageKey, backup);
          return true;
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