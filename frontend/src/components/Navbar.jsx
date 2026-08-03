import React, { useState } from 'react';
import { Zap, LogIn, LogOut, Key, ShieldCheck } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <nav className="site-navbar">
      <div className="nav-container">
        {/* Brand Logo */}
        <div className="nav-brand-group">
          <div className="brand-icon-box">
            <Zap size={18} color="#ffffff" />
          </div>
          <h1 className="revanth-gradient brand-title">ZipUrl</h1>
        </div>

        {/* User Controls */}
        <div className="nav-controls-group">
          {user ? (
            <>
              <div className="user-badge">
                <span className="badge-dot" style={{ backgroundColor: '#10b981' }}></span>
                <span className="user-email-text">{user.email}</span>
              </div>

              <div className="user-buttons-group">
                <button className="btn-glass" onClick={() => setShowKey(!showKey)}>
                  <Key size={13} color="#06b6d4" />
                  {showKey ? 'Hide' : 'API Key'}
                </button>

                <button className="btn-glass btn-logout" onClick={onLogout}>
                  <LogOut size={13} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <button className="btn-glow" onClick={onOpenAuth}>
              <LogIn size={15} />
              Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Developer API Key Banner */}
      {showKey && user && (
        <div className="api-key-wrapper">
          <div className="glass-card api-key-card">
            <div className="api-key-text-group">
              <ShieldCheck size={16} color="#06b6d4" />
              <span className="api-key-label">API Key:</span>
              <code className="code-font api-key-code">{user.apiKey}</code>
            </div>
            <span className="api-key-subtext">Bearer Header Auth</span>
          </div>
        </div>
      )}
    </nav>
  );
}
