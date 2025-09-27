import React, { useEffect, useState } from 'react';
import BrutalCard from '../ui/brutal/BrutalCard';
import BrutalHeader from '../ui/brutal/BrutalHeader';
import GestureController from '../components/GestureController';
import MappingEditor from '../components/MappingEditor';

const Dashboard = () => {
  const [labels, setLabels] = useState([]);

  // Listen for model metadata from GestureController and update labels
  useEffect(() => {
    const fromLocal = () => {
      try {
        const metaStr = localStorage.getItem('gesture-model-metadata');
        if (metaStr) {
          const meta = JSON.parse(metaStr);
          if (Array.isArray(meta.indexToLabel)) setLabels(meta.indexToLabel);
        }
      } catch {}
    };
    const onMeta = (e) => {
      if (e?.detail?.labels && Array.isArray(e.detail.labels)) {
        setLabels(e.detail.labels);
      } else {
        fromLocal();
      }
    };
    window.addEventListener('vibe:model-metadata', onMeta);
    // initial attempt
    fromLocal();
    return () => window.removeEventListener('vibe:model-metadata', onMeta);
  }, []);

  return (
    <div className="dashboard-grid-polished">
      <div className="dash-left">
        <BrutalHeader title="Camera & Training" subtitle="Train model and run inference" />
        <BrutalCard offset="right" style={{ marginTop: 8 }}>
          <GestureController mode="full" enableCalibration={false} showMappingEditor={false} />
        </BrutalCard>
      </div>
      <div className="dash-right">
        <BrutalHeader title="Gesture Mappings" subtitle="Universal across all pages" />
        <BrutalCard offset="down" style={{ marginTop: 8 }}>
          <MappingEditor labels={labels} />
        </BrutalCard>
      </div>
    </div>
  );
};

export default Dashboard;
