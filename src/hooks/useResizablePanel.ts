import { useState, useCallback } from 'react';

const MIN_HEIGHT = 15; // minimum 15% of container
const MAX_HEIGHT = 80; // maximum 80% of container
const DEFAULT_HEIGHT = 40; // default 40% of container

interface UseResizablePanelReturn {
  chatPanelHeight: number;
  setHeight: (height: number) => void;
  handleDrag: (deltaY: number, containerHeight: number) => void;
  isDragging: boolean;
  startDrag: () => void;
  endDrag: () => void;
}

export function useResizablePanel(): UseResizablePanelReturn {
  const [chatPanelHeight, setChatPanelHeight] = useState(DEFAULT_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);

  const setHeight = useCallback((height: number) => {
    const clampedHeight = Math.min(Math.max(height, MIN_HEIGHT), MAX_HEIGHT);
    setChatPanelHeight(clampedHeight);
  }, []);

  const handleDrag = useCallback((deltaY: number, containerHeight: number) => {
    // deltaY negative = dragging up = increase chat panel height
    // deltaY positive = dragging down = decrease chat panel height
    const deltaPercent = (deltaY / containerHeight) * 100;
    setChatPanelHeight((prev) => {
      const newHeight = prev - deltaPercent;
      return Math.min(Math.max(newHeight, MIN_HEIGHT), MAX_HEIGHT);
    });
  }, []);

  const startDrag = useCallback(() => {
    setIsDragging(true);
  }, []);

  const endDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    chatPanelHeight,
    setHeight,
    handleDrag,
    isDragging,
    startDrag,
    endDrag,
  };
}
