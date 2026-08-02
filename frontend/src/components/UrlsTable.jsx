import React, { useEffect, useState, useRef } from 'react';
import { Copy, Check, Trash2, Power, Lock, ExternalLink, RefreshCw } from 'lucide-react';
import { urlAPI } from '../services/api';

export default function UrlsTable({ user, refreshTrigger, onUrlDeleted }) {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (user) {
      fetchUrls();

      // Real-Time 3-second live auto-sync polling
      const interval = setInterval(() => {
        fetchUrls(false);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [user, refreshTrigger]);

  const fetchUrls = async (showLoading = isFirstLoad.current) => {
    try {
      if (showLoading) setLoading(true);
      const res = await urlAPI.getMyUrls();
      setUrls(res.data.urls);
      isFirstLoad.current = false;
    } catch (err) {
      console.error('Failed to fetch URLs:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (id) => {
    try {
      await urlAPI.toggleActive(id);
      fetchUrls(false);
    } catch (err) {
      alert('Failed to toggle URL status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this short URL?')) return;
    try {
      await urlAPI.deleteUrl(id);
      fetchUrls(false);
      if (onUrlDeleted) onUrlDeleted();
    } catch (err) {
      alert('Failed to delete URL');
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '48px auto 0', width: '100%' }}>
      <div className="glass-card" style={{ padding: '32px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
              Links & Campaign Management (Real-Time)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Manage short codes, custom aliases, security settings, and live link click stats
            </p>
          </div>

          <button className="btn-glass" onClick={() => fetchUrls(true)} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> Refresh List
          </button>
        </div>

        {loading && !urls.length ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Fetching short links...
          </div>
        ) : urls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No short URLs created yet. Use the widget above to shorten your first link!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Short Code / Branded Alias</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Destination URL</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Live Clicks</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Security & Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {urls.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '18px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="code-font" style={{ fontWeight: 700, color: '#06b6d4', fontSize: '0.95rem' }}>
                        {row.shortCode}
                      </span>
                      {row.hasPassword && <Lock size={14} color="#f59e0b" title="Password Protected" />}
                    </div>
                    <div className="code-font" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {row.shortUrl}
                    </div>
                  </td>

                  <td style={{ padding: '18px 16px', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <a href={row.originalUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {row.originalUrl}
                      <ExternalLink size={14} color="var(--text-tertiary)" />
                    </a>
                  </td>

                  <td style={{ padding: '18px 16px' }}>
                    <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
                      {row.clicks} clicks
                    </span>
                  </td>

                  <td style={{ padding: '18px 16px' }}>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: row.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: row.isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                      color: row.isActive ? '#34d399' : '#fca5a5'
                    }}>
                      <span className="badge-dot" style={{ backgroundColor: row.isActive ? '#10b981' : '#ef4444' }}></span>
                      {row.isActive ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>

                  <td style={{ padding: '18px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '10px' }}>
                      <button className="btn-glow" onClick={() => handleCopy(row.shortUrl, row.id)} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        {copiedId === row.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === row.id ? 'Copied' : 'Copy'}
                      </button>

                      <button className="btn-glass" onClick={() => handleToggleActive(row.id)} style={{ padding: '8px 14px', fontSize: '0.85rem', color: row.isActive ? '#f59e0b' : '#34d399' }}>
                        <Power size={14} />
                      </button>

                      <button className="btn-glass" onClick={() => handleDelete(row.id)} style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
