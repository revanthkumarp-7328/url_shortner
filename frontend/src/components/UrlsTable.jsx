import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, Lock, Power, Trash2, Edit2 } from 'lucide-react';
import { urlAPI } from '../services/api';

export default function UrlsTable({ refreshTrigger, onUrlDeleted }) {
  const [urls, setUrls] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadLocalUrls();
  }, [refreshTrigger]);

  const loadLocalUrls = () => {
    try {
      const stored = localStorage.getItem('zipurl_my_links');
      if (stored) {
        setUrls(JSON.parse(stored));
      } else {
        setUrls([]);
      }
    } catch (err) {
      console.error('Failed to load local URLs:', err);
    }
  };

  const handleCopy = (shortUrl, id) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditUrl = async (row) => {
    const newUrl = window.prompt('Enter new destination original URL:', row.originalUrl);
    if (!newUrl || newUrl.trim() === '' || newUrl.trim() === row.originalUrl) return;

    try {
      new URL(newUrl);
    } catch (_) {
      alert('Invalid URL format. Please include http:// or https://');
      return;
    }

    try {
      const res = await urlAPI.updateUrl(row.id, { originalUrl: newUrl.trim() });
      const updatedRecord = res.data.url;

      const updated = urls.map((u) => (u.id === row.id ? { ...u, originalUrl: updatedRecord.originalUrl } : u));
      setUrls(updated);
      localStorage.setItem('zipurl_my_links', JSON.stringify(updated));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update URL');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      // Call API backend to toggle state
      const res = await urlAPI.toggleActive(id);
      const newActive = res.data.isActive;

      // Update local storage state
      const updated = urls.map((u) => (u.id === id ? { ...u, isActive: newActive } : u));
      setUrls(updated);
      localStorage.setItem('zipurl_my_links', JSON.stringify(updated));
    } catch (err) {
      alert('Failed to update URL status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this short URL?')) return;
    try {
      // Call API backend to delete
      await urlAPI.deleteUrl(id);

      // Remove from local storage
      const updated = urls.filter((u) => u.id !== id);
      setUrls(updated);
      localStorage.setItem('zipurl_my_links', JSON.stringify(updated));

      if (onUrlDeleted) onUrlDeleted();
    } catch (err) {
      alert('Failed to delete URL');
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all your local short link history from this browser?')) {
      localStorage.removeItem('zipurl_my_links');
      setUrls([]);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '28px auto 0', width: '100%' }}>
      <div className="glass-card chart-card" style={{ padding: '24px 20px' }}>
        <div className="analytics-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Your Created Links Registry (Local Privacy)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '2px' }}>
              Stored locally on your device. Only you can see and manage links created from this browser.
            </p>
          </div>

          {urls.length > 0 && (
            <button className="btn-glass" onClick={handleClearHistory} style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#fca5a5' }}>
              Clear Local History
            </button>
          )}
        </div>

        {urls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No short URLs created yet on this device. Use the widget above to generate your first link!
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Short Code / Alias</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Destination URL</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Security & Status</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="code-font" style={{ fontWeight: 700, color: '#06b6d4', fontSize: '0.88rem' }}>
                          {row.shortCode}
                        </span>
                        {row.hasPassword && <Lock size={12} color="#f59e0b" title="Password Protected" />}
                      </div>
                      <div className="code-font" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {row.shortUrl}
                      </div>
                    </td>

                    <td style={{ padding: '12px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={row.originalUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {row.originalUrl}
                        <ExternalLink size={12} color="var(--text-tertiary)" />
                      </a>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: row.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: row.isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: row.isActive ? '#34d399' : '#fca5a5'
                      }}>
                        <span className="badge-dot" style={{ backgroundColor: row.isActive ? '#10b981' : '#ef4444' }}></span>
                        {row.isActive ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>

                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button className="btn-glow" onClick={() => handleCopy(row.shortUrl, row.id)} style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
                          {copiedId === row.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === row.id ? 'Copied' : 'Copy'}
                        </button>

                        <button className="btn-glass" onClick={() => handleEditUrl(row)} title="Edit Destination URL" style={{ padding: '5px 8px', fontSize: '0.78rem', color: '#38bdf8' }}>
                          <Edit2 size={12} />
                        </button>

                        <button className="btn-glass" onClick={() => handleToggleActive(row.id)} style={{ padding: '5px 8px', fontSize: '0.78rem', color: row.isActive ? '#f59e0b' : '#34d399' }}>
                          <Power size={12} />
                        </button>

                        <button className="btn-glass" onClick={() => handleDelete(row.id)} style={{ padding: '5px 8px', fontSize: '0.78rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
