import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, Lock, Power, Trash2, RefreshCw } from 'lucide-react';
import { urlAPI } from '../services/api';

export default function UrlsTable({ user, refreshTrigger, onUrlDeleted }) {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const isFirstLoad = useRef(true);

  function useRef(initialValue) {
    const [ref] = useState({ current: initialValue });
    return ref;
  }

  useEffect(() => {
    if (user) {
      fetchUrls(isFirstLoad.current);

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
      console.error('Failed to fetch user URLs:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCopy = (shortUrl, id) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (id) => {
    try {
      await urlAPI.toggleActive(id);
      fetchUrls(false);
    } catch (err) {
      alert('Failed to update URL status');
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
    <div style={{ maxWidth: '1200px', margin: '36px auto 0', width: '100%' }}>
      <div className="glass-card chart-card" style={{ padding: '24px 20px' }}>
        <div className="analytics-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Links & Campaign Management (Real-Time)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
              Manage short codes, custom aliases, security settings, and live link click stats
            </p>
          </div>

          <button className="btn-glass" onClick={() => fetchUrls(true)} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            <RefreshCw size={14} /> Refresh List
          </button>
        </div>

        {loading && !urls.length ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            Fetching short links...
          </div>
        ) : urls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            No short URLs created yet. Use the widget above to shorten your first link!
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Short Code / Alias</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Destination URL</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Live Clicks</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Security & Status</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="code-font" style={{ fontWeight: 700, color: '#06b6d4', fontSize: '0.9rem' }}>
                          {row.shortCode}
                        </span>
                        {row.hasPassword && <Lock size={13} color="#f59e0b" title="Password Protected" />}
                      </div>
                      <div className="code-font" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {row.shortUrl}
                      </div>
                    </td>

                    <td style={{ padding: '14px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={row.originalUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {row.originalUrl}
                        <ExternalLink size={13} color="var(--text-tertiary)" />
                      </a>
                    </td>

                    <td style={{ padding: '14px' }}>
                      <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem' }}>
                        {row.clicks} clicks
                      </span>
                    </td>

                    <td style={{ padding: '14px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: row.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: row.isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: row.isActive ? '#34d399' : '#fca5a5'
                      }}>
                        <span className="badge-dot" style={{ backgroundColor: row.isActive ? '#10b981' : '#ef4444' }}></span>
                        {row.isActive ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>

                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button className="btn-glow" onClick={() => handleCopy(row.shortUrl, row.id)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                          {copiedId === row.id ? <Check size={13} /> : <Copy size={13} />}
                          {copiedId === row.id ? 'Copied' : 'Copy'}
                        </button>

                        <button className="btn-glass" onClick={() => handleToggleActive(row.id)} style={{ padding: '6px 10px', fontSize: '0.8rem', color: row.isActive ? '#f59e0b' : '#34d399' }}>
                          <Power size={13} />
                        </button>

                        <button className="btn-glass" onClick={() => handleDelete(row.id)} style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)' }}>
                          <Trash2 size={13} />
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
