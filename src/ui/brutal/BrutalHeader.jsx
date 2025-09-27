import React from 'react';
import Icon from '../icons/Icon';

const BrutalHeader = ({ title, subtitle = null, className = '' }) => {
  return (
    <div className={`brutal-header ${className}`}>
      <Icon name="bolt" size={20} style={{ color: 'var(--accent-2)' }} />
      <div>
        <div className="brutal-title">{title}</div>
        {subtitle && <div style={{ color: 'var(--muted)', fontWeight: 600 }}>{subtitle}</div>}
      </div>
    </div>
  );
};

export default BrutalHeader;
