import React, { useEffect, useRef } from 'react';
import useStore from '@store/store';
import useSwipe from '@hooks/useSwipe';

import ChatContent from './ChatContent';

const Chat = () => {
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const setHideSideMenu = useStore((state) => state.setHideSideMenu);
  const menuWidth = useStore((state) => state.menuWidth);
  const chatRef = useRef<HTMLDivElement>(null);

  // スワイプハンドラー
  const swipeHandlers = useSwipe({
    onSwipeRight: () => {
      // 右スワイプでサイドメニューを開く（モバイル時のみ）
      if (hideSideMenu && window.innerWidth < 768) {
        setHideSideMenu(false);
      }
    },
    onSwipeLeft: () => {
      // 左スワイプでサイドメニューを閉じる
      if (!hideSideMenu) {
        setHideSideMenu(true);
      }
    },
  }, {
    minSwipeDistance: 10, // スワイプ距離を長めに設定
    maxSwipeTime: 400,     // スワイプ時間を少し長めに設定
    maxVerticalMovement: 10, // 縦方向の許容範囲を広めに設定
  });

  // タッチイベントをDOMに直接追加
  useEffect(() => {
    const chatElement = chatRef.current;
    if (!chatElement) return;

    chatElement.addEventListener('touchstart', swipeHandlers.onTouchStart, { passive: false });
    chatElement.addEventListener('touchend', swipeHandlers.onTouchEnd, { passive: false });
    chatElement.addEventListener('touchmove', swipeHandlers.onTouchMove, { passive: false });

    return () => {
      chatElement.removeEventListener('touchstart', swipeHandlers.onTouchStart);
      chatElement.removeEventListener('touchend', swipeHandlers.onTouchEnd);
      chatElement.removeEventListener('touchmove', swipeHandlers.onTouchMove);
    };
  }, [swipeHandlers]);

  return (
    <div
      ref={chatRef}
      className={`flex h-full flex-1 flex-col`}
      style={{ paddingLeft: hideSideMenu ? '0' : `${menuWidth}px` }}
    >
      <main className='relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch flex-1'>
        <ChatContent />
      </main>
    </div>
  );
};

export default Chat;
