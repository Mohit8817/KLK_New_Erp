import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function VPortalDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedStateFilter, setSelectedStateFilter] = useState<'All' | 'UP' | 'Jammu' | 'Assam'>('All');

  const vendorName = user?.name || user?.vendor_id ? `Vendor: ${user?.name || user?.vendor_id}` : 'Authorized Vendor';

  const kpis = [
    {
      title: 'Total Vendor Sites',
      value: '2,845',
      change: '+14% this month',
      isPositive: true,
      color: '#2563eb',
      bg: '#eff6ff',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      title: 'Active Installations',
      value: '1,420',
      change: '+28 new today',
      isPositive: true,
      color: '#059669',
      bg: '#f0fdf4',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
    {
      title: 'Field Surveys Done',
      value: '892',
      change: '94% verification rate',
      isPositive: true,
      color: '#0284c7',
      bg: '#f0f9ff',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: 'AMC & Maintenance',
      value: '533',
      change: '100% active SLA',
      isPositive: true,
      color: '#7c3aed',
      bg: '#f5f3ff',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
    {
      title: 'Pending Complaints',
      value: '48',
      change: '-6 from yesterday',
      isPositive: true,
      color: '#d97706',
      bg: '#fffbeb',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  const recentWorkOrders = [
    {
      id: 'WO-8821',
      site: '70MW SRT Central Sub-station',
      state: 'Jammu & Kashmir',
      module: 'Installation (70MW)',
      technician: 'Ramesh Sharma',
      status: 'In Progress',
      statusColor: '#0284c7',
      statusBg: '#e0f2fe',
      date: 'Today, 11:30 AM',
      to: '/jammu/installation/srt-70mw/dashboard',
    },
    {
      id: 'WO-8820',
      site: 'SSL Solar Feeder Line 4',
      state: 'Uttar Pradesh',
      module: 'AMC Maintenance',
      technician: 'Vikas Maurya',
      status: 'Verified',
      statusColor: '#059669',
      statusBg: '#f0fdf4',
      date: 'Today, 10:15 AM',
      to: '/up/amc/ssl/view-assign-light',
    },
    {
      id: 'WO-8819',
      site: 'SWP Pump Station Block C',
      state: 'Assam',
      module: 'Installation (SWP)',
      technician: 'Barun Das',
      status: 'Commissioned',
      statusColor: '#059669',
      statusBg: '#f0fdf4',
      date: 'Yesterday',
      to: '/assam/swp/dashboard',
    },
    {
      id: 'WO-8818',
      site: 'Kusum C Solar Farm Unit 2',
      state: 'Uttar Pradesh',
      module: 'Installation (Kusum C)',
      technician: 'Sunil Verma',
      status: 'Pending Survey',
      statusColor: '#d97706',
      statusBg: '#fffbeb',
      date: 'Yesterday',
      to: '/up/installation/kusum-c/dashboard',
    },
    {
      id: 'WO-8817',
      site: 'Resco Site Phase-3',
      state: 'Jammu & Kashmir',
      module: 'Survey (Resco)',
      technician: 'Anil Kumar',
      status: 'Verified',
      statusColor: '#059669',
      statusBg: '#f0fdf4',
      date: '15 Oct 2026',
      to: '/jammu/survey/resco/view-survey',
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* ── TOP HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
            flexShrink: 0,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Vendor Operations Dashboard (V-Portal)
              </h1>
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                Live V-Portal
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Logged in as <strong style={{ color: '#f8fafc' }}>{vendorName}</strong> · Multi-State Field Operations (Assam, J&K, Uttar Pradesh)
            </p>
          </div>
        </div>

        {/* Quick Hub Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/dle/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 15px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              transition: 'all 0.18s ease',
            }}
          >
            <span>Switch to DLE Portal →</span>
          </Link>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 15px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 600,
              textDecoration: 'none',
              border: 'none',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.18s ease',
            }}
          >
            <span>Main ERP Home</span>
          </Link>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--ax-surface-solid, #ffffff)',
              border: '1px solid var(--ax-border, #e2e8f0)',
              borderRadius: '14px',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)' }}>
                {kpi.title}
              </span>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: kpi.bg,
                color: kpi.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {kpi.icon}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ax-text-strong, #0f172a)', letterSpacing: '-0.02em' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: kpi.color, marginTop: '4px' }}>
                {kpi.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── STATE OPERATIONS PANELS ── */}
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ax-text-strong, #0f172a)', margin: '0 0 16px 0' }}>
        Regional Operations & Field Systems
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px',
        marginBottom: '28px',
      }}>
        {/* Card 1: Uttar Pradesh */}
        <div style={{
          background: 'var(--ax-surface-solid, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: '16px',
          padding: '22px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                }}>
                  UP
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--ax-text-strong, #0f172a)' }}>
                    Uttar Pradesh Operations
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    SSL, Resco, Kusum C & Complaints
                  </span>
                </div>
              </div>
              <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                1,120 Sites
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '14px 0' }}>
              <Link to="/up/survey/ssl/survey" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                📋 SSL Survey
              </Link>
              <Link to="/up/installation/resco/dashboard" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                ⚡ Resco Install
              </Link>
              <Link to="/up/amc/ssl/view-assign-light" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                🛡️ SSL AMC Lights
              </Link>
              <Link to="/up/complaint/resco/view-complaint" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                🚨 Complaints
              </Link>
            </div>
          </div>

          <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Active Service Centers: <strong>14 Districts</strong></span>
            <Link to="/up/survey/ssl/view-data" style={{ color: '#2563eb', fontWeight: 700, fontSize: '12px', textDecoration: 'none' }}>
              View UP Data →
            </Link>
          </div>
        </div>

        {/* Card 2: Jammu & Kashmir */}
        <div style={{
          background: 'var(--ax-surface-solid, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: '16px',
          padding: '22px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: '#f0fdf4',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                }}>
                  JK
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--ax-text-strong, #0f172a)' }}>
                    Jammu & Kashmir Operations
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    70MW SRT Project, Expenses & SWP
                  </span>
                </div>
              </div>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                980 Sites
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '14px 0' }}>
              <Link to="/jammu/installation/srt-70mw/dashboard" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                ☀️ 70MW SRT Db
              </Link>
              <Link to="/jammu/survey/resco/assign-survey" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                📝 Assign Survey
              </Link>
              <Link to="/jammu/installation-expenses/srt-70mw/view-expenses" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                💰 Claim Expenses
              </Link>
              <Link to="/jammu/amc/ssl/view-assign-amc" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                🛡️ AMC SSL
              </Link>
            </div>
          </div>

          <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Active Mega Project: <strong>70MW Grid</strong></span>
            <Link to="/jammu/installation/srt-70mw/dashboard" style={{ color: '#059669', fontWeight: 700, fontSize: '12px', textDecoration: 'none' }}>
              View J&K System →
            </Link>
          </div>
        </div>

        {/* Card 3: Assam */}
        <div style={{
          background: 'var(--ax-surface-solid, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: '16px',
          padding: '22px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                }}>
                  AS
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--ax-text-strong, #0f172a)' }}>
                    Assam Operations
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Solar Water Pumps (SWP) System
                  </span>
                </div>
              </div>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                745 Sites
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '14px 0' }}>
              <Link to="/assam/swp/dashboard" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                🚰 SWP Dashboard
              </Link>
              <Link to="/assam/swp/installation-request" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                📨 Install Request
              </Link>
              <Link to="/assam/swp/installation-site" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                📍 Install Sites
              </Link>
              <Link to="/assam/swp/view-payment" style={{ textDecoration: 'none', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                💳 View Payment
              </Link>
            </div>
          </div>

          <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Project Focus: <strong>Agriculture SWP</strong></span>
            <Link to="/assam/swp/dashboard" style={{ color: '#d97706', fontWeight: 700, fontSize: '12px', textDecoration: 'none' }}>
              View Assam Portal →
            </Link>
          </div>
        </div>
      </div>

      {/* ── RECENT FIELD WORK ORDERS TABLE ── */}
      <div style={{
        background: 'var(--ax-surface-solid, #ffffff)',
        border: '1px solid var(--ax-border, #e2e8f0)',
        borderRadius: '16px',
        padding: '22px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--ax-text-strong, #0f172a)' }}>
              Recent Vendor Work Orders & Field Dispatch
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--ax-text-muted, #64748b)' }}>
              Live execution feed across all authorized contractor zones
            </p>
          </div>
          <span style={{
            fontSize: '12px',
            color: '#059669',
            fontWeight: 700,
            background: '#f0fdf4',
            padding: '4px 10px',
            borderRadius: '8px',
          }}>
            ● Live Sync Active
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Order ID</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Site & Project</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>State</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Module</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Assigned Lead</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentWorkOrders.map((wo) => (
                <tr key={wo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563eb' }}>{wo.id}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{wo.site}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{wo.state}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{wo.module}</td>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>{wo.technician}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: wo.statusBg,
                      color: wo.statusColor,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                    }}>
                      {wo.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <Link
                      to={wo.to}
                      style={{
                        padding: '5px 10px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Open Module →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default VPortalDashboard;
