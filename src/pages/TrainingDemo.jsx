import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrutalCard from '../ui/brutal/BrutalCard';
import BrutalHeader from '../ui/brutal/BrutalHeader';
import Icon from '../ui/icons/Icon';
import GestureController from '../components/GestureController';
import { DEFAULT_LABELS } from '../constants';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const TrainingDemo = () => {
  const videoRef = useRef(null);
  const [volume, setVolume] = useState(0.5);
  const [recordingLabel, setRecordingLabel] = useState(null);
  const recordControlsRef = useRef({ startRecording: null, stopRecording: null });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    const onVol = () => setVolume(video.volume);
    video.addEventListener('volumechange', onVol);
    return () => video.removeEventListener('volumechange', onVol);
  }, []);

  const volumeUp = () => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = clamp(v.volume + 0.1, 0, 1);
    setVolume(v.volume);
  };
  const volumeDown = () => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = clamp(v.volume - 0.1, 0, 1);
    setVolume(v.volume);
  };

  useEffect(() => {
    // Expose page-level actions for GestureController hooks
    window.trainingDemoActions = {
      volumeUp,
      volumeDown,
    };
    return () => {
      delete window.trainingDemoActions;
    };
  }, []);

  const onRegisterControls = (controls) => {
    recordControlsRef.current = controls || { startRecording: null, stopRecording: null };
  };

  const startRecord = (label) => {
    setRecordingLabel(label);
    recordControlsRef.current.startRecording && recordControlsRef.current.startRecording(label);
  };
  const stopRecord = () => {
    recordControlsRef.current.stopRecording && recordControlsRef.current.stopRecording();
    setRecordingLabel(null);
  };

  const labels = useMemo(() => DEFAULT_LABELS.slice(0, 6), []);

  return (
    <div className="training-demo">
      <BrutalHeader title="Training & Demo" subtitle="Volume control + sample recording" />

      <BrutalCard offset="right" style={{ marginTop: 12 }}>
        <div className="video-wrapper">
          <video
            ref={videoRef}
            className="demo-video-large"
            controls
            loop
            muted={false}
            playsInline
            poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYwIiBoZWlnaHQ9IjU0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjMDAwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCI+RGVtbyBWaWRlbzwvdGV4dD48L3N2Zz4="
          >
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          </video>

          <div className="volume-chip">
            <Icon name="volume-up" /> {Math.round(volume * 100)}%
          </div>

          <div className="camera-pip">
            <GestureController mode="pip" onRegisterControls={onRegisterControls} />
          </div>
        </div>
      </BrutalCard>

      <BrutalHeader title="Record Samples" className="asym-1" />
      <BrutalCard offset="left" style={{ marginTop: 12 }}>
        <p style={{ marginBottom: 8 }}>
          Hold a label to record 2–5 seconds of samples. Release to stop.
        </p>
        <div className="recording-controls-inline">
          {labels.map((label) => (
            <button
              key={label}
              className={`record-button ${recordingLabel === label ? 'recording' : ''}`}
              onMouseDown={() => startRecord(label)}
              onMouseUp={stopRecord}
              onMouseLeave={stopRecord}
              onTouchStart={() => startRecord(label)}
              onTouchEnd={stopRecord}
              onTouchCancel={stopRecord}
              aria-pressed={recordingLabel === label}
              title={`Record samples for ${label}`}
            >
              📹 {label}
            </button>
          ))}
        </div>
      </BrutalCard>
    </div>
  );
};

export default TrainingDemo;
