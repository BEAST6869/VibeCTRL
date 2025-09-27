import React from 'react';
import BrutalHeader from '../ui/brutal/BrutalHeader';
import BrutalCard from '../ui/brutal/BrutalCard';
import BrutalInput from '../ui/brutal/BrutalInput';
import BrutalButton from '../ui/brutal/BrutalButton';
import MappingEditor from '../components/MappingEditor';

const Settings = () => {
  const [threshold, setThreshold] = React.useState(0.7);
  const [cooldown, setCooldown] = React.useState(1200);
  const [voice, setVoice] = React.useState(false);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <BrutalHeader title="Settings" subtitle="Adjust thresholds and mappings" />
      <BrutalCard offset="up">
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ fontWeight: 800 }}>Confidence Threshold: {Math.round(threshold * 100)}%</label>
          <BrutalInput.Input
            type="range"
            min={0.3}
            max={0.95}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            aria-label="Confidence threshold"
          />
          <label style={{ fontWeight: 800 }}>Cooldown (ms): {cooldown}</label>
          <BrutalInput.Input
            type="range"
            min={500}
            max={3000}
            step={100}
            value={cooldown}
            onChange={(e) => setCooldown(parseInt(e.target.value))}
            aria-label="Cooldown milliseconds"
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} aria-label="Voice feedback" />
            Voice feedback
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <BrutalButton>Save</BrutalButton>
            <BrutalButton variant="outline">Reset</BrutalButton>
          </div>
          <p style={{ color: 'var(--muted)' }}>
            Note: These settings are UI-only here. The Dashboard contains the live controls wired to the gesture system.
          </p>
        </div>
      </BrutalCard>

      <BrutalHeader title="Gesture Mappings" subtitle="Map gestures to actions" />
      <BrutalCard>
        <MappingEditor labels={[]} />
      </BrutalCard>

      <BrutalHeader title="Import / Export" />
      <BrutalCard offset="right">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <BrutalButton variant="outline" aria-label="Export dataset" onClick={() => alert('Use Dashboard → Export Dataset')}>💾 Export Dataset</BrutalButton>
          <BrutalButton variant="outline" aria-label="Export model" onClick={() => alert('Use Dashboard → Export Model')}>📤 Export Model</BrutalButton>
          <BrutalButton variant="invert" aria-label="Open dashboard" onClick={() => window.location.assign('/dashboard')}>Open Dashboard</BrutalButton>
        </div>
      </BrutalCard>
    </div>
  );
};

export default Settings;
