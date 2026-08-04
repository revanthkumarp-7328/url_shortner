import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link2, Settings, Copy, Check, QrCode, Lock, Calendar, Sparkles, Shield, Cpu, Zap } from 'lucide-react';
import { urlAPI } from '../services/api';

export default function UrlShortenerWidget({ onUrlCreated }) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customAlias, setCustomAlias] = useState('');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  
  const [createdUrl, setCreatedUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await urlAPI.create({
        originalUrl,
        customAlias: customAlias || undefined,
        password: password || undefined,
        expiresAt: expiresAt || undefined,
      });

      const newUrl = response.data.url;
      setCreatedUrl(newUrl);

      // Save created link locally to user's browser localStorage
      const existingLocal = JSON.parse(localStorage.getItem('zipurl_my_links') || '[]');
      const updatedLocal = [newUrl, ...existingLocal.filter(item => item.id !== newUrl.id)];
      localStorage.setItem('zipurl_my_links', JSON.stringify(updatedLocal));

      setOriginalUrl('');
      setCustomAlias('');
      setPassword('');
      setExpiresAt('');
      if (onUrlCreated) onUrlCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create short URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdUrl) {
      navigator.clipboard.writeText(createdUrl.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '24px auto 0', width: '100%' }}>
      {/* Feature Badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#818cf8', padding: '4px 10px', borderRadius: '30px', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Cpu size={12} /> Sub-15ms Redis Engine
        </div>
        <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', color: '#06b6d4', padding: '4px 10px', borderRadius: '30px', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={12} /> 2 Standalone Microservices
        </div>
        <div style={{ background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.25)', color: '#ec4899', padding: '4px 10px', borderRadius: '30px', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Shield size={12} /> Privacy First Local Storage
        </div>
      </div>

      {/* Hero Widget Card */}
      <div className="glass-card hero-card-padding" style={{ padding: '32px 24px', background: 'rgba(15, 23, 42, 0.85)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 className="gradient-heading hero-title-text" style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px' }}>
            Shorten URLs with <span className="gradient-accent">Lightning Speed</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '600px', margin: '0 auto' }}>
            Production microservices shortener. High throughput, branded aliases, and instant Redis redirection.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-flex-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <Link2 size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="url"
                required
                autoComplete="off"
                name="url_input"
                className="input-glass-premium"
                style={{ paddingLeft: '40px', height: '48px', fontSize: '0.9rem' }}
                placeholder="Paste long URL (e.g. https://mybrand.com)..."
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-glow" disabled={loading} style={{ height: '48px', padding: '0 24px', fontSize: '0.9rem' }}>
              <Sparkles size={16} />
              {loading ? 'Shortening...' : 'Shorten Link'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Settings size={14} color="#818cf8" />
              {showAdvanced ? 'Hide Options' : 'Configure Custom Alias, Password, or Expiration (Optional)'}
            </button>
          </div>

          {showAdvanced && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Custom Branded Alias
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  name="custom_alias_no_autofill"
                  className="input-glass-premium"
                  placeholder="e.g. my-alias"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Password Encryption
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    autoComplete="new-password"
                    name="link_password_no_autofill"
                    className="input-glass-premium"
                    style={{ paddingLeft: '34px' }}
                    placeholder="Set link password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Expiration Date
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="datetime-local"
                    autoComplete="off"
                    name="link_expiration_no_autofill"
                    className="input-glass-premium"
                    style={{ paddingLeft: '34px', cursor: 'pointer' }}
                    value={expiresAt}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Shortened Result Card */}
        {createdUrl && (
          <div className="result-flex-row" style={{ marginTop: '20px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)', border: '1px solid var(--border-glow)', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ minWidth: 0, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span className="badge-dot" style={{ backgroundColor: '#06b6d4' }}></span>
                <span style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SHORT URL READY
                </span>
              </div>
              <h3 className="code-font" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', wordBreak: 'break-all' }}>
                {createdUrl.shortUrl}
              </h3>
            </div>

            <div className="result-actions-flex" style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button className="btn-glow" onClick={handleCopy} style={{ flex: 1, padding: '8px 14px', fontSize: '0.82rem' }}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              <button className="btn-glass" onClick={() => setShowQrModal(true)} style={{ flex: 1, padding: '8px 14px', fontSize: '0.82rem' }}>
                <QrCode size={15} color="#06b6d4" />
                QR Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && createdUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card" style={{ padding: '24px 16px', textAlign: 'center', maxWidth: '320px', width: '100%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>QR Code Ready</h3>
            <div style={{ background: '#ffffff', padding: '14px', borderRadius: '14px', display: 'inline-block', marginBottom: '14px' }}>
              <QRCodeSVG value={createdUrl.shortUrl} size={160} />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px', wordBreak: 'break-all' }}>
              Scan to open <span className="code-font" style={{ color: '#06b6d4' }}>{createdUrl.shortUrl}</span>
            </p>
            <button className="btn-glass" onClick={() => setShowQrModal(false)} style={{ width: '100%', justifyContent: 'center' }}>
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
