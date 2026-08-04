import React, { useState } from 'react';
import Navbar from './components/Navbar';
import UrlShortenerWidget from './components/UrlShortenerWidget';
import UrlsTable from './components/UrlsTable';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '0 16px 60px' }}>
        <UrlShortenerWidget onUrlCreated={handleRefresh} />
        <UrlsTable refreshTrigger={refreshTrigger} onUrlDeleted={handleRefresh} />
      </main>

      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 500, marginBottom: '4px' }}>
          Made with <span className="heart-icon">❤️</span> by <span className="revanth-gradient">Revanth</span>
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          High-Throughput Microservices URL Shortener • Cloudflare Pages & AWS EC2
        </p>
      </footer>
    </div>
  );
}
