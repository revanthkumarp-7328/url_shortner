import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import UrlShortenerWidget from './components/UrlShortenerWidget';
import DashboardAnalytics from './components/DashboardAnalytics';
import UrlsTable from './components/UrlsTable';
import { authAPI } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, padding: '0 20px 60px' }}>
        <UrlShortenerWidget
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
          onUrlCreated={handleRefresh}
        />

        {user && (
          <>
            <DashboardAnalytics refreshTrigger={refreshTrigger} />
            <UrlsTable
              user={user}
              refreshTrigger={refreshTrigger}
              onUrlDeleted={handleRefresh}
            />
          </>
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '28px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 500, marginBottom: '6px' }}>
          Made with <span className="heart-icon">❤️</span> by <span className="revanth-gradient">Revanth</span>
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          Production URL Shortener Microservices • Cloudflare Pages & AWS EC2
        </p>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          handleRefresh();
        }}
      />
    </div>
  );
}
