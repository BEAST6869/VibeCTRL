import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Help from './pages/Help';
import OverlayMini from './components/OverlayMini';
import './App.css';

function App() {
  const [sidebarHidden, setSidebarHidden] = React.useState(false);
  const isExtension = typeof window !== 'undefined' && window.location && window.location.protocol === 'chrome-extension:';
  const Router = isExtension ? HashRouter : BrowserRouter;

  // Add body classes in extension context for tighter sizing in pop-out
  React.useEffect(() => {
    if (!isExtension) return;
    const body = document.body;
    body.classList.add('ext-context');
    const isDetached = (window.location.hash || '').includes('detached=1');
    if (isDetached) body.classList.add('ext-detached'); else body.classList.remove('ext-detached');
    return () => {
      body.classList.remove('ext-context');
      body.classList.remove('ext-detached');
    };
  }, [isExtension]);

  // Embed mode: used by in-page overlay iframe (no sidebar/topbar)
  const isEmbed = isExtension && (window.location.hash || '').includes('embed=1');

  if (isEmbed) {
    return (
      <Router>
        <div style={{ background: 'transparent', width: '100%', height: '100%' }}>
          <main className="content" style={{ padding: 0, width: '100%', height: '100%' }}>
            <div style={{ width: '100%', height: '100%' }}>
              <Routes>
                <Route path="/overlay" element={<OverlayMini />} />
                <Route path="*" element={<OverlayMini />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className={`app-layout ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
        <Sidebar hidden={sidebarHidden} />
        <Topbar sidebarHidden={sidebarHidden} onToggleSidebar={() => setSidebarHidden(v => !v)} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/dashboards" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
