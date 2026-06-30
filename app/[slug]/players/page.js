'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabase'

const LEVELS = [
  { key: 'all', name: 'ทั้งหมด' },
  { key: 'hospital', name: 'ไม่เคยเเข่ง' },
  { key: 'bg', name: 'BG' },
  { key: 's', name: 'S' },
  { key: 'n', name: 'N' },
  { key: 'np', name: 'N/P-' },
  { key: 'bgplus', name: 'BG+' },
  { key: 'pp', name: 'P-/P' },
]

const STATUS_BADGE = {
  approved: { label: 'อนุมัติแล้ว', bg: '#dcfce7', color: '#15803d', dot: '#16a34a' },
  pending:  { label: 'รอตรวจสอบ', bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
  rejected: { label: 'ไม่ผ่าน',    bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
  withdrawn:{ label: 'ถอนแล้ว',    bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
}

export default function PlayersPage() {

  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeLevel, setActiveLevel] = useState('all')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadTeams()
  }, [])

  async function loadTeams() {

    if (!supabase) return
    // ดึง teams + players ในครั้งเดียว ไม่โหลดหลายรอบ
    const { data, error } = await supabase
      .from('teams')
      .select(`
        id, team_name, level, status, created_at, sequence_no,
        players (player_no, fullname, nickname, age, photo_url)
      `)
      .neq('status', 'withdrawn')   // ข้อ 4: withdrawn ไม่แสดง
      .order('created_at', { ascending: true })

    if (!error && data) {
      setTeams(data)

      // คำนวณสถิติแยกตาม status (ข้อ 5: หัก withdrawn ออกจาก "ทั้งหมด" แล้ว)
      const s = {}
      data.forEach(t => {
        s[t.status] = (s[t.status] || 0) + 1
      })
      setStats(s)
    }
    setLoading(false)
  }

  // กรองตาม tab ระดับมือ + ช่องค้นหา
  const filtered = teams.filter(t => {
    const matchLevel = activeLevel === 'all' || t.level === activeLevel
    const searchLower = search.toLowerCase()
    const matchSearch = !search ||
      t.team_name.toLowerCase().includes(searchLower) ||
      t.players?.some(p =>
        p.fullname.toLowerCase().includes(searchLower) ||
        (p.nickname || '').toLowerCase().includes(searchLower)
      )
    return matchLevel && matchSearch
  })

  // นับจำนวนแต่ละ level (ทั้ง approved + pending)
  const countByLevel = (key) =>
    key === 'all' ? teams.length : teams.filter(t => t.level === key).length

  if (loading) {
    return (
      <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        กำลังโหลดรายชื่อผู้สมัคร...
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f0fdf4', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>👥 รายชื่อผู้สมัคร</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
            ตรวจสอบรายชื่อและสถานะของผู้สมัครเข้าร่วมแข่งขัน
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'ทั้งหมด', value: teams.length, color: '#2563eb', bg: '#dbeafe' },
            { label: 'อนุมัติแล้ว', value: stats.approved || 0, color: '#15803d', bg: '#dcfce7' },
            { label: 'รอตรวจสอบ', value: stats.pending || 0, color: '#92400e', bg: '#fef3c7' },
            { label: 'ไม่ผ่าน', value: stats.rejected || 0, color: '#dc2626', bg: '#fee2e2' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: 14, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Level tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {LEVELS.map(lv => {
            const count = countByLevel(lv.key)
            const active = activeLevel === lv.key
            return (
              <button
                key={lv.key}
                onClick={() => setActiveLevel(lv.key)}
                style={{
                  padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: active ? 'none' : '1.5px solid #e5e7eb',
                  background: active ? '#16a34a' : 'white',
                  color: active ? 'white' : '#4b5563'
                }}
              >
                {lv.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="ค้นหาชื่อทีม หรือชื่อผู้เล่น..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 14px', border: '1px solid #e5e7eb',
              borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
              background: 'white'
            }}
          />
        </div>

        {/* Team list */}
        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 10, padding: '50px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 40 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#4b5563', marginTop: 10 }}>ไม่พบรายชื่อที่ค้นหา</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>ลองเปลี่ยนคำค้นหาหรือเลือกระดับมืออื่น</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((team, i) => {
              const p1 = team.players?.find(p => p.player_no === 1)
              const p2 = team.players?.find(p => p.player_no === 2)
              const badge = STATUS_BADGE[team.status] || STATUS_BADGE.pending
              const levelLabel = LEVELS.find(l => l.key === team.level)?.name || team.level

              return (
                <div key={team.id} style={{ background: 'white', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 14 }}>

                  {/* ลำดับ */}
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', width: 28, textAlign: 'center', flexShrink: 0 }}>
                    #{i + 1}
                  </div>

                  {/* รูปผู้เล่น */}
                  <div style={{ display: 'flex', flexShrink: 0 }}>
                    {[p1, p2].map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: '#f3f4f6', border: '2px solid white',
                          marginLeft: idx > 0 ? -10 : 0,
                          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20
                        }}
                      >
                        {p?.photo_url
                          ? <img src={p.photo_url} alt={p.fullname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : '🧑'}
                      </div>
                    ))}
                  </div>

                  {/* ข้อมูลทีม */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {team.team_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                      {p1?.fullname}{p1?.nickname ? ` (${p1.nickname})` : ''} ·{' '}
                      {p2?.fullname}{p2?.nickname ? ` (${p2.nickname})` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                      {/* Level badge */}
                      <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8' }}>
                        {levelLabel}
                      </span>
                      {/* Status badge */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: badge.bg, color: badge.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.dot, display: 'inline-block' }}></span>
                        {badge.label}
                      </span>
                      {/* วันที่สมัคร */}
                      <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>
                        {new Date(team.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
