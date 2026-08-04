import React from 'react';
import { Zap, Cpu, ShieldCheck } from 'lucide-react';

export default function Navbar() {
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

        {/* Microservice Info Pills */}
        <div className="nav-controls-group">
          <div className="user-badge">
            <span className="badge-dot" style={{ backgroundColor: '#10b981' }}></span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={12} color="#10b981" /> 2 Microservices Active
            </span>
          </div>

          <div className="user-badge" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Host DB & Redis
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
