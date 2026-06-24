'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import supabase from '../../../lib/supabase'

const LEVEL_LABEL = {
  hospital: 'ไม่เคยเเข่ง',
  bg: 'BG',
  s: 'S',
  n: 'N',
  np: 'N/P-',
  bgplus: 'BG+',
}

const STATUS_CONFIG = {
  approved: { label: 'อนุมัติแล้ว', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  pending:  { label: 'รอตรวจสอบ',  color: '#b45309', bg: '#fef3c7', dot: '#f59e0b' },
  rejected: { label: 'ไม่ผ่าน',    color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  withdrawn:{ label: 'ถอนแล้ว',    color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
}

function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value == null) return
    let start = 0
    const step = Math.ceil(value / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(start)
    }, 16)
    return () => clearInterval(timer)
  }, [value, duration])
  return <span>{display}</span>
}

function StatCard({ icon, label, value, color, accentBg, subLabel, href }) {
  const [hovered, setHovered] = useState(false)
  const card = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? accentBg : '#ffffff',
        border: `1.5px solid ${hovered ? color + '44' : '#e5e7eb'}`,
        borderRadius: 16,
        padding: '22px 20px',
        cursor: href ? 'pointer' : 'default',
        transition: 'all 0.22s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 28px ${color}20, 0 2px 8px rgba(0,0,0,0.06)`
          : '0 1px 4px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
        textDecoration: 'none',
        display: 'block',
      }}
    >
      {/* Accent top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: color, borderRadius: '16px 16px 0 0',
        opacity: hovered ? 1 : 0, transition: 'opacity 0.22s ease',
      }} />

      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: accentBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, marginBottom: 14,
        border: `1px solid ${color}22`,
      }}>
        {icon}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>

      <div style={{
        fontSize: 34, fontWeight: 800, color: '#111827',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        marginBottom: 6,
      }}>
        {value == null ? (
          <span style={{ display: 'inline-block', width: 60, height: 32, background: '#f3f4f6', borderRadius: 6, animation: 'pulse 1.5s ease infinite' }} />
        ) : (
          <AnimatedNumber value={value} />
        )}
      </div>

      {subLabel && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
          {subLabel}
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none' }}>{card}</Link>
  }
  return card
}

function ActivityRow({ team, index }) {
  const cfg = STATUS_CONFIG[team.status] || STATUS_CONFIG.pending
  const level = LEVEL_LABEL[team.level] || team.level || '-'
  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(team.created_at).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    if (d > 0) return `${d} วันที่แล้ว`
    if (h > 0) return `${h} ชั่วโมงที่แล้ว`
    if (m > 0) return `${m} นาทีที่แล้ว`
    return 'เพิ่งสมัคร'
  }, [team.created_at])

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 0',
        borderBottom: index === 0 ? 'none' : '1px solid #f3f4f6',
        animation: `fadeInUp 0.3s ease ${index * 60}ms both`,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #16a34a, #0d9488)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: '#fff',
        boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
      }}>
        {(team.team_name || 'T')[0].toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {team.team_name || '—'}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
          {level} · {timeAgo}
        </div>
      </div>

      {/* Status */}
      <div style={{
        flexShrink: 0,
        fontSize: 10, fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        borderRadius: 99, padding: '3px 10px',
        letterSpacing: 0.3,
      }}>
        {cfg.label}
      </div>
    </div>
  )
}

function DonutRing({ approved, pending, rejected, withdrawn }) {
  const total = (approved || 0) + (pending || 0) + (rejected || 0) + (withdrawn || 0)
  if (!total) return null

  const data = [
    { v: approved  || 0, color: '#10b981', label: 'อนุมัติ' },
    { v: pending   || 0, color: '#f59e0b', label: 'รอ' },
    { v: rejected  || 0, color: '#ef4444', label: 'ไม่ผ่าน' },
    { v: withdrawn || 0, color: '#9ca3af', label: 'ถอน' },
  ]

  const r = 52, cx = 70, cy = 70, stroke = 14
  const circumference = 2 * Math.PI * r
  let offset = 0

  const segments = data.map((d) => {
    const pct = d.v / total
    const seg = { ...d, pct, dasharray: `${pct * circumference} ${circumference}`, dashoffset: -offset * circumference }
    offset += pct
    return seg
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={140} height={140} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={s.dasharray}
            strokeDashoffset={s.dashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#111827" fontSize={20} fontWeight={800} fontFamily="Inter, sans-serif">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#9ca3af" fontSize={9} fontFamily="Inter, sans-serif">ทีมทั้งหมด</text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#6b7280', minWidth: 48 }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{s.v}</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>({Math.round(s.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [session, setSession] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentTeams, setRecentTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/session')
      .then(res => res.json())
      .then(data => {
        setSession(data)
        loadAll()
      })
  }, [])

  async function loadAll() {
    const [
      { count: totalActive },
      { count: approved },
      { count: pending },
      { count: rejected },
      { count: withdrawn },
      { count: tournamentCount },
      { data: recent },
    ] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }).neq('status', 'withdrawn'),
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'withdrawn'),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('teams').select('id, team_name, level, status, created_at').order('created_at', { ascending: false }).limit(8),
    ])

    setStats({ totalActive, approved, pending, rejected, withdrawn, tournamentCount })
    setRecentTeams(recent || [])
    setLoading(false)
  }

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น'

  const approvalRate = stats && stats.totalActive > 0
    ? Math.round((stats.approved / stats.totalActive) * 100)
    : 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .db-page * { box-sizing: border-box; }
      `}</style>

      <div
        className="db-page"
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          fontFamily: "'Inter', sans-serif",
          padding: '28px 28px 48px',
          color: '#111827',
        }}
      >
        {/* ─── Header ─── */}
        <div style={{ marginBottom: 26, animation: 'fadeInUp 0.4s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #16a34a, #0d9488)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                }}>
                  🏸
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase' }}>
                    Admin Dashboard
                  </div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
                    {greeting}, {session?.username || '—'} 👋
                  </h1>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', marginLeft: 46 }}>
                {now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Pending alert */}
            {stats?.pending > 0 && (
              <Link href="/admin/players" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fef3c7',
                  border: '1.5px solid #fcd34d',
                  borderRadius: 10, padding: '8px 14px',
                  cursor: 'pointer',
                  animation: 'slideIn 0.5s ease 0.2s both',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>
                    {stats.pending} ทีมรอการอนุมัติ
                  </span>
                  <span style={{ fontSize: 11, color: '#b45309' }}>→</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* ─── Stat Cards ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 20,
          animation: 'fadeInUp 0.4s ease 0.1s both',
        }}>
          <StatCard icon="🏆" label="รายการแข่งขัน" value={stats?.tournamentCount}
            color="#7c3aed" accentBg="#f5f3ff" subLabel="รายการที่เปิดอยู่" href="/admin/tournaments" />
          <StatCard icon="👥" label="ผู้สมัครทั้งหมด" value={stats?.totalActive}
            color="#2563eb" accentBg="#eff6ff" subLabel="ไม่รวมถอนสิทธิ์" />
          <StatCard icon="✅" label="อนุมัติแล้ว" value={stats?.approved}
            color="#059669" accentBg="#ecfdf5" subLabel={stats ? `${approvalRate}% ของผู้สมัคร` : ''} href="/admin/players" />
          <StatCard icon="⏳" label="รอตรวจสอบ" value={stats?.pending}
            color="#d97706" accentBg="#fffbeb" subLabel="ต้องการการตรวจสอบ" href="/admin/players" />
          <StatCard icon="🚫" label="ถอนแล้ว" value={stats?.withdrawn}
            color="#6b7280" accentBg="#f9fafb" subLabel="ถอนสิทธิ์การสมัคร" />
        </div>

        {/* ─── Bottom Row ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 14,
          animation: 'fadeInUp 0.4s ease 0.2s both',
        }}>
          {/* Recent Activity */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: 16,
            padding: '20px 22px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>กิจกรรมล่าสุด</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>การสมัครล่าสุด 8 รายการ</div>
              </div>
              <Link href="/admin/players" style={{
                fontSize: 11, fontWeight: 600,
                color: '#16a34a',
                textDecoration: 'none',
                padding: '5px 12px',
                border: '1.5px solid #bbf7d0',
                borderRadius: 8,
                background: '#f0fdf4',
              }}>
                ดูทั้งหมด →
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f3f4f6', animation: 'pulse 1.5s ease infinite' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 12, width: '60%', background: '#f3f4f6', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.5s ease infinite' }} />
                      <div style={{ height: 10, width: '40%', background: '#f9fafb', borderRadius: 4, animation: 'pulse 1.5s ease infinite' }} />
                    </div>
                    <div style={{ width: 64, height: 22, background: '#f3f4f6', borderRadius: 99, animation: 'pulse 1.5s ease infinite' }} />
                  </div>
                ))}
              </div>
            ) : recentTeams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                ยังไม่มีผู้สมัคร
              </div>
            ) : (
              <div>
                {recentTeams.map((team, i) => (
                  <ActivityRow key={team.id} team={team} index={recentTeams.length - i} />
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Donut */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e5e7eb',
              borderRadius: 16,
              padding: '20px 22px',
              flex: 1,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>สัดส่วนสถานะ</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 18 }}>ภาพรวมการสมัครทั้งหมด</div>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#f3f4f6', animation: 'pulse 1.5s ease infinite' }} />
                </div>
              ) : (
                <DonutRing
                  approved={stats?.approved}
                  pending={stats?.pending}
                  rejected={stats?.rejected}
                  withdrawn={stats?.withdrawn}
                />
              )}
            </div>

            {/* Quick Links */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e5e7eb',
              borderRadius: 16,
              padding: '18px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>ทางลัด</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: '/admin/players',     icon: '👥', label: 'อนุมัติผู้สมัคร',  color: '#059669', bg: '#ecfdf5' },
                  { href: '/admin/tournaments', icon: '🏆', label: 'จัดการรายการแข่ง', color: '#7c3aed', bg: '#f5f3ff' },
                  { href: '/admin/adminusers',  icon: '🔑', label: 'จัดการแอดมิน',    color: '#2563eb', bg: '#eff6ff' },
                ].map((item) => (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 10,
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = item.bg
                        e.currentTarget.style.borderColor = item.color + '44'
                        e.currentTarget.style.transform = 'translateX(3px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#f9fafb'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }}
                    >
                      <span style={{ fontSize: 15 }}>{item.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', flex: 1 }}>{item.label}</span>
                      <span style={{ fontSize: 12, color: '#d1d5db' }}>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
