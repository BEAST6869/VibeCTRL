import React from 'react';
import BrutalHeader from '../ui/brutal/BrutalHeader';
import BrutalButton from '../ui/brutal/BrutalButton';
import BrutalCard from '../ui/brutal/BrutalCard';
import Icon from '../ui/icons/Icon';

const Landing = () => {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <BrutalHeader title="VibeCTRL" subtitle="Control with your gestures" />
      <BrutalCard offset="down" className="asym-1">
        <p style={{ fontSize: 16 }}>
          Real-time hand landmark recognition with a bold Neo‑Brutalist UI. Train gestures, map to actions, and test live.
        </p>
        <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
          <BrutalButton aria-label="Go to dashboard" onClick={() => window.location.assign('/dashboard')}>
            <Icon name="start" /> Start Camera
          </BrutalButton>
          <BrutalButton variant="outline" aria-label="Open settings" onClick={() => window.location.assign('/settings')}>
            <Icon name="settings" /> Settings
          </BrutalButton>
        </div>
      </BrutalCard>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <BrutalCard offset="left" className="asym-2">
          <strong>Bold Colors</strong>
          <p>Vivid cyan, magenta, and lemon on stark black borders.</p>
        </BrutalCard>
        <BrutalCard offset="right">
          <strong>Hard Shadows</strong>
          <p>Sharp, offset shadows without gradients or blur.</p>
        </BrutalCard>
      </div>
    </div>
  );
};

export default Landing;
