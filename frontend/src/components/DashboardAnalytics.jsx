import React, { useEffect, useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Globe, Monitor, MousePointerClick, Link as LinkIcon, TrendingUp, Activity } from 'lucide-react';
import { analyticsAPI } from '../services/api';

const COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b'];

export default function DashboardAnalytics({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    fetchAnalytics();
    
    // Real-Time 3-second live auto-sync polling
    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const fetchAnalytics = async (showLoading = isFirstLoad.current) => {
    try {
      if (showLoading) setLoading(true);
      const res = await analyticsAPI.getDashboardSummary();
      setData(res.data);
      isFirstLoad.current = false;
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)' }}>
        Connecting to real-time microservices stream...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '36px auto 0', width: '100%' }}>
      {/* Live Sync Status Header */}
      <div className="analytics-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '5px 12px', borderRadius: '30px' }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.5px' }}>
            LIVE REAL-TIME SYNC
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          Auto-updating metrics every 3 seconds
        </span>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Total URLs Card */}
        <div className="glass-card glass-card-interactive chart-card" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Short Links
            </span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }} className="gradient-heading">
              {data.summary.total_urls}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <TrendingUp size={12} /> Managed in Postgres
            </span>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '14px', borderRadius: '14px', color: '#818cf8', boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)' }}>
            <LinkIcon size={26} />
          </div>
        </div>

        {/* Total Clicks Card */}
        <div className="glass-card glass-card-interactive chart-card" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Redirection Clicks
            </span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }} className="gradient-heading">
              {data.summary.total_clicks}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <Activity size={12} /> Redis Stream Live Logged
            </span>
          </div>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '14px', borderRadius: '14px', color: '#06b6d4', boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)' }}>
            <MousePointerClick size={26} />
          </div>
        </div>
      </div>

      {/* Clicks Time-Series Chart */}
      <div className="glass-card chart-card" style={{ padding: '24px 20px', marginBottom: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="#818cf8" />
            Traffic Analytics (Real-Time 30 Days)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
            Real-time click streams processed non-blocking via Redis Streams worker
          </p>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          {data.timeSeries && data.timeSeries.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={data.timeSeries}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#areaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '0 16px' }}>
              No click traffic logged yet. Share your short link to start tracking real-time metrics!
            </div>
          )}
        </div>
      </div>

      {/* Grid: Geo & Device Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Geographic Breakdown */}
        <div className="glass-card chart-card" style={{ padding: '24px 20px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#06b6d4" />
            Top Locations (Real-Time GeoIP)
          </h4>
          <div style={{ width: '100%', height: 220 }}>
            {data.countries && data.countries.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={data.countries} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="country" type="category" stroke="#64748b" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
                  <Bar dataKey="clicks" fill="#06b6d4" barSize={18} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No GeoIP data recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="glass-card chart-card" style={{ padding: '24px 20px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={18} color="#ec4899" />
            Browser & Device Distribution
          </h4>
          <div style={{ width: '100%', height: 220 }}>
            {data.browsers && data.browsers.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.browsers} dataKey="clicks" nameKey="browser" cx="50%" cy="50%" outerRadius={75} label>
                    {data.browsers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No browser data recorded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
