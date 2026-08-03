import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link2, Settings, Copy, Check, QrCode, Lock, Calendar, Sparkles, Shield, Cpu, Activity } from 'lucide-react';
import { urlAPI } from '../services/api';

export default function UrlShortenerWidget({ user, onUrlCreated, onOpenAuth }) {
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
    if (!user) {
      onOpenAuth();
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await urlAPI.create({
        originalUrl,
        customAlias: customAlias || undefined,
        password: password || undefined,
        expiresAt: expiresAt || undefined,
      });

      setCreatedUrl(response.data.url);
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
    <div style={{ maxWidth: '860px', margin: '32px auto 0', width: '100%' }}>
      {/* Feature Pills */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#818cf8', padding: '5px 12px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Cpu size={13} /> Sub-15ms Redis Engine
        </div>
        <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', color: '#06b6d4', padding: '5px 12px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Activity size={13} /> Geo Analytics
        </div>
        <div style={{ background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.25)', color: '#ec4899', padding: '5px 12px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Shield size={13} /> Password Lock
        </div>
      </div>

      {/* Hero Widget Card */}
      <div className="glass-card hero-card" style={{ padding: '36px 28px', background: 'rgba(15, 23, 42, 0.85)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 className="gradient-heading hero-title" style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '10px' }}>
            Shorten URLs with <span className="gradient-accent">Lightning Speed</span>
          </h2>
          <p className="hero-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            Enterprise microservices shortener. High throughput, branded aliases, and real-time click tracking.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="shortener-form-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div className="shortener-input-container" style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Link2 size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="url"
                required
                autoComplete="off"
                name="url_input"
                className="input-glass-premium"
                style={{ paddingLeft: '46px', height: '52px', fontSize: '0.95rem' }}
                placeholder="Paste long URL (e.g. https://mybrand.com/campaign)..."
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-glow" disabled={loading} style={{ height: '52px', padding: '0 28px', fontSize: '0.95rem' }}>
              <Sparkles size={18} />
              {loading ? 'Shortening...' : 'Shorten Link'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Settings size={15} color="#818cf8" />
              {showAdvanced ? 'Hide Options' : 'Configure Custom Alias, Password, or Expiration (Optional)'}
            </button>
          </div>

          {showAdvanced && (
            <div className="advanced-options-grid" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Custom Branded Alias <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  name="custom_alias_no_autofill"
                  className="input-glass-premium"
                  placeholder="e.g. my-custom-alias"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Password Encryption <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    autoComplete="new-password"
                    name="link_password_no_autofill"
                    className="input-glass-premium"
                    style={{ paddingLeft: '36px' }}
                    placeholder="Set link password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Expiration Date <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="datetime-local"
                    autoComplete="off"
                    name="link_expiration_no_autofill"
                    className="input-glass-premium"
                    style={{ paddingLeft: '36px', cursor: 'pointer' }}
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
          <div className="result-card-inner" style={{ marginTop: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)', border: '1px solid var(--border-glow)', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 0 30px rgba(99, 102, 241, 0.25)' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge-dot" style={{ backgroundColor: '#06b6d4' }}></span>
                <span style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  SHORT URL READY
                </span>
              </div>
              <h3 className="code-font" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', wordBreak: 'break-all' }}>
                {createdUrl.shortUrl}
              </h3>
            </div>

            <div className="result-actions" style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-glow" onClick={handleCopy} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              <button className="btn-glass" onClick={() => setShowQrModal(true)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <QrCode size={16} color="#06b6d4" />
                QR Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && createdUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card modal-card" style={{ padding: '28px 20px', textAlign: 'center', maxWidth: '340px', width: '100%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>QR Code Ready</h3>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '16px', boxShadow: '0 0 30px rgba(255,255,255,0.2)' }}>
              <QRCodeSVG value={createdUrl.shortUrl} size={180} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px', wordBreak: 'break-all' }}>
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
