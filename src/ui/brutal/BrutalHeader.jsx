import React from 'react';

const BrutalHeader = ({ title, subtitle = null, className = '' }) => {
  return (
    <div className={`brutal-header ${className}`}>
      <span aria-hidden="true" style={{ width: 14, height: 14, background: 'var(--accent-2)', border: 'var(--border-thick) solid #000', display: 'inline-block' }} />
      <div>
        <div className="brutal-title">{title}</div>
        {subtitle && <div style={{ color: 'var(--muted)', fontWeight: 600 }}>{subtitle}</div>}
      </div>
    </div>
  );
};

export default BrutalHeader;
