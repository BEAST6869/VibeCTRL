import React from 'react';
import BrutalButton from '../ui/brutal/BrutalButton';
import Icon from '../ui/icons/Icon';

const Topbar = ({ sidebarHidden = false, onToggleSidebar = null }) => {
  return (
    <header className="topbar">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span aria-hidden className="big-border" style={{ width: 18, height: 18, background: 'var(--accent-1)', display: 'inline-block' }} />
        <strong>Neo‑Brutal UI</strong>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <BrutalButton
          variant="outline"
          aria-label={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
          onClick={() => onToggleSidebar && onToggleSidebar()}
        >
          <Icon name="menu" /> {sidebarHidden ? 'Show' : 'Hide'} Sidebar
        </BrutalButton>
        <BrutalButton variant="outline" aria-label="Get Help" onClick={() => window.location.assign('/help')}>
          <Icon name="help" /> Help
        </BrutalButton>
        <BrutalButton variant="invert" aria-label="Start camera" onClick={() => window.location.assign('/dashboard')}>
          <Icon name="start" /> Start Camera
        </BrutalButton>
      </div>
    </header>
  );
};

export default Topbar;
