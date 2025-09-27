import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Help from './pages/Help';
import './App.css';

function App() {
  const [sidebarHidden, setSidebarHidden] = React.useState(false);
  return (
    <BrowserRouter>
      <div className={`app-layout ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
        <Sidebar hidden={sidebarHidden} />
        <Topbar sidebarHidden={sidebarHidden} onToggleSidebar={() => setSidebarHidden(v => !v)} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
