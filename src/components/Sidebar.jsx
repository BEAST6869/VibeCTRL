import React from 'react';
import { NavLink } from 'react-router-dom';
import BrutalHeader from '../ui/brutal/BrutalHeader';
import Icon from '../ui/icons/Icon';

const Sidebar = ({ hidden = false }) => {
  return (
    <aside className={`sidebar ${hidden ? 'hidden' : ''}`}>
      <BrutalHeader title="VibeCTRL" subtitle="Gesture Demo" />
      <nav aria-label="Primary">
        <div className="nav-group" style={{ marginTop: 12 }}>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/" end>
            <Icon name="home" /> Landing
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/dashboard">
            <Icon name="camera" /> Dashboard
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/settings">
            <Icon name="settings" /> Settings
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
