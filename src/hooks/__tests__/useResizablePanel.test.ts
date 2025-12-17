import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResizablePanel } from '../useResizablePanel';

describe('useResizablePanel', () => {
  it('returns default chat panel height of 40%', () => {
    const { result } = renderHook(() => useResizablePanel());

    expect(result.current.chatPanelHeight).toBe(40);
  });

  it('updates height when setHeight is called', () => {
    const { result } = renderHook(() => useResizablePanel());

    act(() => {
      result.current.setHeight(50);
    });

    expect(result.current.chatPanelHeight).toBe(50);
  });

  it('enforces minimum height of 15%', () => {
    const { result } = renderHook(() => useResizablePanel());

    act(() => {
      result.current.setHeight(5);
    });

    expect(result.current.chatPanelHeight).toBe(15);
  });

  it('enforces maximum height of 80%', () => {
    const { result } = renderHook(() => useResizablePanel());

    act(() => {
      result.current.setHeight(95);
    });

    expect(result.current.chatPanelHeight).toBe(80);
  });

  it('calculates height from drag delta correctly', () => {
    const { result } = renderHook(() => useResizablePanel());
    const containerHeight = 1000;

    // Dragging up (negative delta) should increase chat panel height
    act(() => {
      result.current.handleDrag(-100, containerHeight);
    });

    // Started at 40%, moved up 100px in 1000px container = +10%
    expect(result.current.chatPanelHeight).toBe(50);
  });

  it('provides isDragging state', () => {
    const { result } = renderHook(() => useResizablePanel());

    expect(result.current.isDragging).toBe(false);

    act(() => {
      result.current.startDrag();
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.endDrag();
    });

    expect(result.current.isDragging).toBe(false);
  });
});
