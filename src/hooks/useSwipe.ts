import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  maxVerticalMovement?: number;
}

export const useSwipe = (
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) => {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    maxVerticalMovement = 100,
  } = options;

  const startPos = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!startPos.current) return;

    const touch = e.changedTouches[0];
    const endPos = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = endPos.x - startPos.current.x;
    const deltaY = endPos.y - startPos.current.y;
    const deltaTime = endPos.time - startPos.current.time;

    // スワイプが十分な距離と速度かチェック
    if (
      Math.abs(deltaX) >= minSwipeDistance &&
      deltaTime <= maxSwipeTime &&
      Math.abs(deltaY) <= maxVerticalMovement
    ) {
      if (deltaX > 0) {
        handlers.onSwipeRight?.();
      } else {
        handlers.onSwipeLeft?.();
      }
    }

    // 縦方向のスワイプもサポート
    if (
      Math.abs(deltaY) >= minSwipeDistance &&
      deltaTime <= maxSwipeTime &&
      Math.abs(deltaX) <= maxVerticalMovement
    ) {
      if (deltaY > 0) {
        handlers.onSwipeDown?.();
      } else {
        handlers.onSwipeUp?.();
      }
    }

    startPos.current = null;
  }, [handlers, minSwipeDistance, maxSwipeTime, maxVerticalMovement]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // スワイプ中のデフォルト動作を防ぐ
    if (startPos.current) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - startPos.current.x;
      
      // 左スワイプが検出された場合、デフォルトの戻る動作を防ぐ
      if (deltaX > 20) {
        e.preventDefault();
      }
    }
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
  };
};

export default useSwipe;