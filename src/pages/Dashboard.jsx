import React from 'react';
import BrutalCard from '../ui/brutal/BrutalCard';
import BrutalHeader from '../ui/brutal/BrutalHeader';
import BrutalButton from '../ui/brutal/BrutalButton';
import GestureController from '../components/GestureController';
import DemoArea from '../components/DemoArea';

const Dashboard = () => {
  return (
    <div className="dashboard-grid">
      <div>
        <BrutalHeader title="Live Camera" subtitle="Hand landmarks with overlay" />
        <BrutalCard offset="right" style={{ marginTop: 8 }}>
          {/* Wrap existing GestureController without modifying its logic */}
          <GestureController />
        </BrutalCard>
      </div>
      <div>
        <BrutalHeader title="Gesture Status" subtitle="Current label & confidence" />
        <BrutalCard offset="down" style={{ marginTop: 8 }}>
          <p style={{ marginBottom: 8 }}>Status renders over the camera feed. Use this card for quick controls:</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <BrutalButton variant="outline" aria-label="Play/Pause test" onClick={() => window.demoAreaActions?.toggleVideo?.()}>▶/⏸</BrutalButton>
            <BrutalButton variant="outline" aria-label="Vol up" onClick={() => window.demoAreaActions?.volumeUp?.()}>🔊 +</BrutalButton>
            <BrutalButton variant="outline" aria-label="Vol down" onClick={() => window.demoAreaActions?.volumeDown?.()}>🔉 −</BrutalButton>
            <BrutalButton variant="outline" aria-label="Prev slide" onClick={() => window.demoAreaActions?.prevSlide?.()}>← Prev</BrutalButton>
            <BrutalButton variant="outline" aria-label="Next slide" onClick={() => window.demoAreaActions?.nextSlide?.()}>Next →</BrutalButton>
          </div>
        </BrutalCard>
        <BrutalHeader title="Action History" className="asym-1" />
        <BrutalCard offset="left" style={{ marginTop: 8 }}>
          {/* The DemoArea includes a history list and media; reuse it here */}
          <DemoArea />
        </BrutalCard>
      </div>
    </div>
  );
};

export default Dashboard;
