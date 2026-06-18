'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function DashboardPage() {
  const [session, setSession] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/session')
      .then(res => res.json())
      .then(data => {
        setSession(data)
        loadStats(data)
      })
  }, [])

  async function loadStats(sess) {
    // ข้อ 5: หัก withdrawn ออกจาก "ทั้งหมด" แยก stat card ของตัวเอง
    const { count: totalActive } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'withdrawn')

    const { count: approved } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    const { count: pending } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: withdrawn } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'withdrawn')

    const { count: tournamentCount } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)

    setStats({ totalActive, approved, pending, withdrawn, tournamentCount })
    setLoading(false)
  }

  if (loading || !session) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif', color: '#9ca3af' }}>กำลังโหลดข้อมูล...</div>
  }

  const cardStyle = (bg) => ({
    background: bg, borderRadius: 8, padding: 14, textAlign: 'center'
  })
  const numStyle = (color) => ({
    fontSize: 24, fontWeight: 800, color
  })

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 900 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>📊 Dashboard</div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2, marginBottom: 20 }}>
        ภาพรวมระบบ — สวัสดี {session.username}
      </div>

      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <div style={cardStyle('#ede9fe')}>
            <div style={numStyle('#7c3aed')}>{stats.tournamentCount}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>รายการแข่งทั้งหมด</div>
          </div>
          <div style={cardStyle('#dbeafe')}>
            <div style={numStyle('#2563eb')}>{stats.totalActive}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>ผู้สมัครทั้งหมด</div>
          </div>
          <div style={cardStyle('#dcfce7')}>
            <div style={numStyle('#15803d')}>{stats.approved}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>อนุมัติแล้ว</div>
          </div>
          <div style={cardStyle('#fef3c7')}>
            <div style={numStyle('#92400e')}>{stats.pending}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>รอตรวจสอบ</div>
          </div>
          <div style={cardStyle('#fee2e2')}>
            <div style={numStyle('#dc2626')}>{stats.withdrawn}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>ถอนแล้ว</div>
          </div>
        </div>
      </div>
    </div>
  )
}
