import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'camera_preview_position_v1';
const DEFAULT_STATE = { corner: 'top-right', hidden: false };

export default function useCameraPosition() {
  const [corner, setCorner] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw).corner : DEFAULT_STATE.corner;
    } catch {
      return DEFAULT_STATE.corner;
    }
  });
  const [hidden, setHidden] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? !!JSON.parse(raw).hidden : DEFAULT_STATE.hidden;
    } catch {
      return DEFAULT_STATE.hidden;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ corner, hidden }));
    } catch {}
  }, [corner, hidden]);

  const toggleHidden = useCallback(() => setHidden((h) => !h), []);

  // Keyboard shortcut: 'c' to toggle
  useEffect(() => {
    const onKey = (e) => {
      if (e.key && e.key.toLowerCase() === 'c') {
        toggleHidden();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleHidden]);

  // Drag snap logic
  const containerRef = useRef(null);
  const draggingRef = useRef(false);

  const onPointerDown = useCallback((e) => {
    draggingRef.current = true;
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    el.dataset.dragStartX = String(e.clientX);
    el.dataset.dragStartY = String(e.clientY);
    el.dataset.origRight = String(parseFloat(getComputedStyle(el).right));
    el.dataset.origBottom = String(parseFloat(getComputedStyle(el).bottom));
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const startX = parseFloat(el.dataset.dragStartX || '0');
    const startY = parseFloat(el.dataset.dragStartY || '0');
    const dX = e.clientX - startX;
    const dY = e.clientY - startY;

    // Apply as translate; final snap decides corner
    el.style.transform = `translate(${-dX}px, ${-dY}px)`;
  }, []);

  const onPointerUp = useCallback((e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const el = containerRef.current;
    if (!el) return;
    el.releasePointerCapture(e.pointerId);
    el.style.transform = '';

    // Determine nearest corner
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dist = {
      'top-left': Math.hypot(rect.left, rect.top),
      'top-right': Math.hypot(vw - rect.right, rect.top),
      'bottom-left': Math.hypot(rect.left, vh - rect.bottom),
      'bottom-right': Math.hypot(vw - rect.right, vh - rect.bottom),
    };
    let minCorner = 'top-right';
    let minVal = Number.POSITIVE_INFINITY;
    Object.entries(dist).forEach(([k, v]) => {
      if (v < minVal) { minVal = v; minCorner = k; }
    });
    setCorner(minCorner);
  }, []);

  return {
    corner,
    setCorner,
    hidden,
    setHidden,
    toggleHidden,
    containerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
