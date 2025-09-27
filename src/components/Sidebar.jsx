import React from 'react';
import { NavLink } from 'react-router-dom';
import BrutalHeader from '../ui/brutal/BrutalHeader';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <BrutalHeader title="VibeCTRL" subtitle="Gesture Demo" />
      <nav aria-label="Primary">
        <div className="nav-group" style={{ marginTop: 12 }}>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/" end>
            🏁 Landing
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/dashboard">
            📹 Dashboard
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/settings">
            ⚙️ Settings
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
