import React, { useState } from 'react';
import { Zap, LogIn, LogOut, Key, UserCheck, ShieldCheck } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <nav style={{ padding: '16px 0', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(3, 7, 18, 0.75)', backdropFilter: 'blur(20px)' }}>
      <div className="nav-inner" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', padding: '10px', borderRadius: '12px', display: 'flex', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
            <Zap size={20} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="revanth-gradient">
              ZipUrl
            </h1>
          </div>
        </div>

        {/* User Actions */}
        <div className="nav-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {user ? (
            <>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 14px', borderRadius: '30px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge-dot" style={{ backgroundColor: '#10b981' }}></span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{user.email}</span>
              </div>

              <button className="btn-glass" onClick={() => setShowKey(!showKey)} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                <Key size={15} color="#06b6d4" />
                {showKey ? 'Hide Key' : 'API Key'}
              </button>

              <button className="btn-glass" onClick={onLogout} style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)', padding: '8px 14px', fontSize: '0.82rem' }}>
                <LogOut size={15} />
                Logout
              </button>
            </>
          ) : (
            <button className="btn-glow" onClick={onOpenAuth} style={{ padding: '10px 20px', fontSize: '0.88rem' }}>
              <LogIn size={16} />
              Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Developer API Key Popup */}
      {showKey && user && (
        <div style={{ maxWidth: '1200px', margin: '14px auto 0', padding: '0 16px' }}>
          <div className="glass-card api-key-banner" style={{ padding: '14px 20px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <ShieldCheck size={18} color="#06b6d4" />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>API Key:</span>
              <code className="code-font" style={{ background: '#030712', padding: '4px 10px', borderRadius: '6px', color: '#06b6d4', fontSize: '0.82rem', border: '1px solid rgba(6, 182, 212, 0.3)', wordBreak: 'break-all' }}>
                {user.apiKey}
              </code>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Bearer Header Auth</span>
          </div>
        </div>
      )}
    </nav>
  );
}
