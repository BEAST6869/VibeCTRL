import React, { useEffect, useRef } from 'react';
import useCameraPosition from '../hooks/useCameraPosition';

// Lightweight webcam preview (no ML). Draggable handle, snaps to corners, persistent state.
// Props:
// - defaultCorner: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
// - shape: 'rounded' | 'circle'
// - sizeCSS: string for CSS width (defaults to clamp sizing)
// - draggable: boolean (default true)
// - onToggle?: callback when minimized/hidden toggled
export default function CameraPreview({
  defaultCorner = 'top-right',
  shape = 'rounded',
  sizeCSS = 'clamp(120px, 12vw, 200px)',
  draggable = true,
  onToggle,
}) {
  const videoRef = useRef(null);
  const {
    corner, setCorner, hidden, setHidden, toggleHidden,
    containerRef, onPointerDown, onPointerMove, onPointerUp,
  } = useCameraPosition();

  useEffect(() => {
    if (defaultCorner) setCorner(defaultCorner);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCorner]);

  useEffect(() => {
    let stream;
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.warn('Camera preview failed:', e);
      }
    };
    if (!hidden) init();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [hidden]);

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
      aria-label="Camera preview"
      role="group"
      style={{
        '--camera-size': sizeCSS,
        pointerEvents: 'auto',
      }}
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
        <div className="camera-video-wrap" style={{ pointerEvents: 'none' }}>
          <video ref={videoRef} muted playsInline className="camera-video" />
        </div>
      )}
    </div>
  );
}
