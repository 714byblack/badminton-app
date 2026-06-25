'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tournaments')
      .then(r => r.json())
      .then(data => { setTournaments(data.tournaments || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const upcoming = tournaments.filter(t => t.date_start && new Date(t.date_start) >= new Date())
  const past = tournaments.filter(t => t.date_start && new Date(t.date_start) < new Date())

  function formatDate(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function isRegOpen(t) {
    if (!t.reg_close_at) return true
    return new Date(t.reg_close_at) > new Date()
  }

  return (
    <div style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif", background: '#faf7f2', minHeight: '100vh', color: '#3d3530' }}>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(160deg, #f5ede0 0%, #ede8f0 50%, #e8f0ed 100%)',
        padding: '64px 24px 48px',
        textAlign: 'center',
        borderBottom: '1px solid #e8e0d8'
      }}>
        <div style={{ fontSize: 13, letterSpacing: '0.15em', color: '#b8a898', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>
          🏸 ศูนย์รวมรายการแข่งขัน
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 800,
          color: '#3d3530',
          margin: '0 0 12px',
          lineHeight: 1.2,
          letterSpacing: '-0.02em'
        }}>
          แข่งแบดมินตัน
        </h1>
        <p style={{ fontSize: 15, color: '#8a7a6e', maxWidth: 480, margin: '0 auto 28px' }}>
          รวบรวมรายการแข่งขันแบดมินตัน สมัครง่าย ติดตามผลได้ทันที
        </p>
        <a href="/admin/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 18px', borderRadius: 99,
          background: 'rgba(61,53,48,0.08)', color: '#6b5d52',
          fontSize: 12, fontWeight: 600, textDecoration: 'none',
          border: '1px solid rgba(61,53,48,0.12)'
        }}>
          ⚙️ เข้าระบบแอดมิน
        </a>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#b8a898' }}>
            กำลังโหลดรายการแข่งขัน...
          </div>
        )}

        {/* UPCOMING */}
        {!loading && upcoming.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 4, height: 20, borderRadius: 99, background: 'linear-gradient(180deg, #c8b5a0, #a8c5b0)' }}></div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#3d3530', margin: 0 }}>รายการที่กำลังจะมาถึง</h2>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 99, background: '#e8f0ed', color: '#5a8a70', fontWeight: 700 }}>
                {upcoming.length} รายการ
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {upcoming.map(t => (
                <TournamentCard key={t.id} t={t} formatDate={formatDate} isRegOpen={isRegOpen} highlight />
              ))}
            </div>
          </section>
        )}

        {/* EMPTY STATE */}
        {!loading && tournaments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏸</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#8a7a6e', marginBottom: 8 }}>ยังไม่มีรายการแข่งขัน</div>
            <div style={{ fontSize: 13, color: '#b8a898' }}>ติดตามความเคลื่อนไหวได้เร็วๆ นี้</div>
          </div>
        )}

        {/* PAST */}
        {!loading && past.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 4, height: 20, borderRadius: 99, background: '#d8cfc8' }}></div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#8a7a6e', margin: 0 }}>รายการที่ผ่านมาแล้ว</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {past.map(t => (
                <TournamentCard key={t.id} t={t} formatDate={formatDate} isRegOpen={isRegOpen} highlight={false} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid #e8e0d8', padding: '20px 24px', textAlign: 'center', background: '#f5f0ea' }}>
        <div style={{ fontSize: 11, color: '#c0b0a0' }}>ระบบจัดการแข่งขันแบดมินตัน · พัฒนาด้วย Next.js + Supabase</div>
      </div>
    </div>
  )
}

function TournamentCard({ t, formatDate, isRegOpen, highlight }) {
  const regOpen = isRegOpen(t)

  return (
    <div style={{
      background: highlight ? '#ffffff' : '#f5f0ea',
      borderRadius: 14,
      border: '1px solid',
      borderColor: highlight ? '#e8ddd4' : '#e0d8d0',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: highlight ? '0 2px 12px rgba(61,53,48,0.06)' : 'none',
      opacity: highlight ? 1 : 0.75
    }}>
      {/* poster placeholder / emoji */}
      <div style={{
        height: 100,
        borderRadius: 8,
        background: highlight
          ? 'linear-gradient(135deg, #f0e8f8 0%, #e8f0f8 50%, #e8f8f0 100%)'
          : '#ede8e0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36
      }}>
        🏸
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#3d3530', lineHeight: 1.3, marginBottom: 4 }}>
          {t.name}
        </div>
        {t.venue && (
          <div style={{ fontSize: 12, color: '#9a8a7e', display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 {t.venue}
          </div>
        )}
      </div>

      {t.date_start && (
        <div style={{ fontSize: 12, color: '#8a7a6e', display: 'flex', alignItems: 'center', gap: 4 }}>
          📅 {formatDate(t.date_start)}
          {t.date_end && t.date_end !== t.date_start ? ' — ' + formatDate(t.date_end) : ''}
        </div>
      )}

      {/* reg status badge */}
      {highlight && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
          padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
          background: regOpen ? '#e8f5ee' : '#f5e8e8',
          color: regOpen ? '#4a8a60' : '#9a5050'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: regOpen ? '#4a8a60' : '#9a5050', display: 'inline-block' }}></span>
          {regOpen ? 'เปิดรับสมัคร' : 'ปิดรับสมัครแล้ว'}
        </div>
      )}

      {/* action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <Link href={'/' + t.slug + '/players'} style={{
          flex: 1, padding: '8px 0', borderRadius: 8, textAlign: 'center',
          fontSize: 12, fontWeight: 600, textDecoration: 'none',
          border: '1.5px solid #d8cfc8', background: 'white', color: '#6b5d52'
        }}>
          รายชื่อ
        </Link>
        {highlight && regOpen && (
          <Link href={'/' + t.slug + '/register'} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, textAlign: 'center',
            fontSize: 12, fontWeight: 700, textDecoration: 'none',
            background: 'linear-gradient(135deg, #8a9e8a, #7a8e9e)',
            color: 'white', border: 'none'
          }}>
            สมัครแข่ง
          </Link>
        )}
        {highlight && !regOpen && (
          <Link href={'/' + t.slug + '/slip'} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, textAlign: 'center',
            fontSize: 12, fontWeight: 700, textDecoration: 'none',
            background: '#f0e8e0', color: '#8a7a6e', border: 'none'
          }}>
            อัปโหลดสลิป
          </Link>
        )}
      </div>
    </div>
  )
}
