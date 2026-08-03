import React, { useState } from 'react';
import { Zap, LogIn, LogOut, Key, ShieldCheck } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <nav style={{ padding: '14px 0', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="nav-container">
        {/* Brand Logo */}
        <div className="nav-brand-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', padding: '8px', borderRadius: '10px', display: 'flex', boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)' }}>
              <Zap size={18} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="revanth-gradient">
              ZipUrl
            </h1>
          </div>
        </div>

        {/* User Actions */}
        <div className="nav-controls-row">
          {user ? (
            <>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '5px 12px', borderRadius: '30px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '100%' }}>
                <span className="badge-dot" style={{ backgroundColor: '#10b981' }}></span>
                <span className="user-email-badge" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.email}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-glass" onClick={() => setShowKey(!showKey)} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                  <Key size={13} color="#06b6d4" />
                  {showKey ? 'Hide' : 'API Key'}
                </button>

                <button className="btn-glass" onClick={onLogout} style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)', padding: '6px 12px', fontSize: '0.78rem' }}>
                  <LogOut size={13} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <button className="btn-glow" onClick={onOpenAuth} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <LogIn size={15} />
              Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Developer API Key Banner */}
      {showKey && user && (
        <div style={{ maxWidth: '1200px', margin: '12px auto 0', padding: '0 16px' }}>
          <div className="glass-card" style={{ padding: '12px 16px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
              <ShieldCheck size={16} color="#06b6d4" />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>API Key:</span>
              <code className="code-font" style={{ background: '#030712', padding: '3px 8px', borderRadius: '6px', color: '#06b6d4', fontSize: '0.78rem', border: '1px solid rgba(6, 182, 212, 0.3)', wordBreak: 'break-all' }}>
                {user.apiKey}
              </code>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Bearer Header Auth</span>
          </div>
        </div>
      )}
    </nav>
  );
}
