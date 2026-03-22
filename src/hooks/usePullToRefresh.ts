import { useState, useEffect, useCallback } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const PULL_THRESHOLD = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Solo permitir pull-to-refresh si estamos en el tope del scroll
    if (window.scrollY === 0) {
      setStartY(e.touches[0].pageY);
    } else {
      setStartY(0);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY === 0) return;

    const currentY = e.touches[0].pageY;
    const distance = currentY - startY;

    if (distance > 0) {
      // Aplicar una resistencia al deslizar
      const resistedDistance = Math.min(distance * 0.5, PULL_THRESHOLD + 20);
      setPullDistance(resistedDistance);
      
      // Evitar el scroll nativo del navegador mientras se hace el pull
      if (distance > 10 && e.cancelable) {
        e.preventDefault();
      }
    }
  }, [startY]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isRefreshing, pullDistance };
}
