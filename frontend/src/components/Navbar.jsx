import React, { useState } from 'react';
import { Zap, LogIn, LogOut, Key, UserCheck, ShieldCheck } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <nav style={{ padding: '24px 0', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(3, 7, 18, 0.6)', backdropFilter: 'blur(16px)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', padding: '12px', borderRadius: '14px', display: 'flex', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
            <Zap size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="revanth-gradient">
              ZipUrl
            </h1>
          </div>
        </div>

        {/* User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {user ? (
            <>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: '30px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge-dot" style={{ backgroundColor: '#10b981' }}></span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.email}</span>
              </div>

              <button className="btn-glass" onClick={() => setShowKey(!showKey)}>
                <Key size={16} color="#06b6d4" />
                {showKey ? 'Hide API Key' : 'API Key'}
              </button>

              <button className="btn-glass" onClick={onLogout} style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)' }}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <button className="btn-glow" onClick={onOpenAuth}>
              <LogIn size={18} />
              Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Developer API Key Popup */}
      {showKey && user && (
        <div style={{ maxWidth: '1200px', margin: '16px auto 0', padding: '0 24px' }}>
          <div className="glass-card" style={{ padding: '16px 24px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="#06b6d4" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Developer API Key:</span>
              <code className="code-font" style={{ background: '#030712', padding: '6px 14px', borderRadius: '8px', color: '#06b6d4', fontSize: '0.9rem', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                {user.apiKey}
              </code>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Use in Bearer header for programmatic short URL creation</span>
          </div>
        </div>
      )}
    </nav>
  );
}
