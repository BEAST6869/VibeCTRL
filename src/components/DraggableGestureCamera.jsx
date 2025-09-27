import React, { useEffect } from 'react';
import useCameraPosition from '../hooks/useCameraPosition';
import GestureController from './GestureController';

// Draggable container rendering GestureController in pip mode
// Props:
// - defaultCorner, shape, sizeCSS, draggable, onToggle — same semantics as CameraPreview
export default function DraggableGestureCamera({
  defaultCorner = 'top-right',
  shape = 'rounded',
  sizeCSS = 'clamp(120px, 12vw, 220px)',
  draggable = true,
  onToggle,
}) {
  const {
    corner, setCorner, hidden, toggleHidden,
    containerRef, onPointerDown, onPointerMove, onPointerUp,
  } = useCameraPosition();

  useEffect(() => {
    if (defaultCorner) setCorner(defaultCorner);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCorner]);

  useEffect(() => {
    if (typeof onToggle === 'function') onToggle(hidden);
  }, [hidden, onToggle]);

  const classes = [
    'camera-preview',
    `corner-${corner}`,
    shape === 'circle' ? 'shape-circle' : 'shape-rounded',
    hidden ? 'is-hidden' : '',
  ].join(' ');

  return (
    <div
      ref={containerRef}
      className={classes}
      aria-label="Camera preview (gesture demo)"
      role="group"
      style={{ '--camera-size': sizeCSS, pointerEvents: 'auto' }}
    >
      <div
        className="camera-controls"
        onPointerDown={draggable ? onPointerDown : undefined}
        onPointerMove={draggable ? onPointerMove : undefined}
        onPointerUp={draggable ? onPointerUp : undefined}
        title={draggable ? 'Drag to move (snaps to corner). Press C to toggle.' : 'Press C to toggle camera'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleHidden(); }}
      >
        <span className="handle" />
        <button className="min-btn" onClick={toggleHidden} aria-label={hidden ? 'Show camera' : 'Hide camera'}>
          {hidden ? '◻' : '×'}
        </button>
      </div>
      {!hidden && (
        // Pointer events off to avoid blocking page; overlays are visible
        <div style={{ pointerEvents: 'none' }}>
          <GestureController mode="pip" />
        </div>
      )}
    </div>
  );
}
