'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function PlayersPage() {
  const [session, setSession] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetch('/api/admin/session')
      .then(res => res.json())
      .then(data => {
        setSession(data)
        loadTeams()
      })
  }, [])

  async function loadTeams() {
    setLoading(true)
    const { data, error } = await supabase
      .from('teams')
      .select(`
        id, team_name, level, phone, status, reject_note, created_at,
        players ( id, player_no, fullname, nickname, age, photo_url )
      `)
      .order('created_at', { ascending: false })

    if (error) setErrorMsg(error.message)
    else setTeams(data || [])
    setLoading(false)
  }

  async function handleApprove(teamId) {
    setActionError('')
    const res = await fetch(`/api/admin/teams/${teamId}/approve`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setActionError(data.error)
      return
    }
    loadTeams()
  }

  async function handleRejectSubmit() {
    if (!rejectReason.trim()) {
      setActionError('กรุณากรอกเหตุผลในการปฏิเสธ')
      return
    }
    setActionError('')
    const res = await fetch(`/api/admin/teams/${rejectingId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason })
    })
    const data = await res.json()
    if (!res.ok) {
      setActionError(data.error)
      return
    }
    setRejectingId(null)
    setRejectReason('')
    loadTeams()
  }

  if (loading || !session) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif', color: '#9ca3af' }}>กำลังโหลดข้อมูล...</div>
  }

  const pendingTeams = teams.filter(t => t.status === 'pending')
  const otherTeams = teams.filter(t => t.status !== 'pending')

  const statusBadge = (status) => {
    const map = {
      pending: { text: '⏳ รอตรวจสอบ', bg: '#fef3c7', color: '#92400e' },
      approved: { text: '✅ อนุมัติแล้ว', bg: '#dcfce7', color: '#15803d' },
      rejected: { text: '❌ ไม่ผ่าน', bg: '#fee2e2', color: '#dc2626' },
      withdrawn: { text: '🚫 ถอนแล้ว', bg: '#f3f4f6', color: '#6b7280' }
    }
    const s = map[status] || map.pending
    return <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.text}</span>
  }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 900 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>👥 อนุมัติผู้สมัคร</div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2, marginBottom: 20 }}>
        ตรวจสอบรายชื่อและสถานะของผู้สมัครเข้าร่วมแข่งขัน
      </div>

      {actionError && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
          ⚠️ {actionError}
        </div>
      )}

      {pendingTeams.length > 0 && (
        <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🔔 รอการอนุมัติ ({pendingTeams.length} รายการ)</div>

          {pendingTeams.map(team => (
            <div key={team.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex' }}>
                  {team.players.sort((a, b) => a.player_no - b.player_no).map((p, i) => (
                    <img
                      key={p.id}
                      src={p.photo_url}
                      alt={p.fullname}
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', marginLeft: i > 0 ? -10 : 0, background: '#e5e7eb' }}
                    />
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {team.team_name} <span style={{ marginLeft: 4, padding: '2px 8px', borderRadius: 99, fontSize: 10, background: '#dbeafe', color: '#2563eb' }}>{team.level}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {team.players.map(p => p.fullname).join(' · ')} · ☎ {team.phone}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleApprove(team.id)}
                    style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #16a34a', background: 'white', color: '#15803d', cursor: 'pointer', fontWeight: 600 }}
                  >
                    ✅ อนุมัติ
                  </button>
                  <button
                    onClick={() => { setRejectingId(team.id); setRejectReason(''); setActionError('') }}
                    style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #dc2626', background: 'white', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}
                  >
                    ❌ ปฏิเสธ
                  </button>
                </div>
              </div>

              {rejectingId === team.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 4 }}>
                    เหตุผลในการปฏิเสธ (จำเป็น — ทีมจะเห็นข้อความนี้)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="เช่น สลิปไม่ตรงยอด, รูปไม่ชัด, ข้อมูลไม่ครบ"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, fontFamily: 'sans-serif', minHeight: 60, boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={handleRejectSubmit} style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                      ยืนยันปฏิเสธ
                    </button>
                    <button onClick={() => setRejectingId(null)} style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>รายชื่อทั้งหมด ({teams.length})</div>

        {errorMsg && <div style={{ color: '#dc2626', fontSize: 12 }}>⚠️ {errorMsg}</div>}

        {otherTeams.map(team => (
          <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{team.team_name} <span style={{ fontSize: 11, color: '#9ca3af' }}>({team.level})</span></div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{team.players.map(p => p.fullname).join(' · ')}</div>
              {team.status === 'rejected' && team.reject_note && (
                <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>เหตุผล: {team.reject_note}</div>
              )}
            </div>
            {statusBadge(team.status)}
          </div>
        ))}

        {teams.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af', fontSize: 13 }}>ยังไม่มีผู้สมัครในระบบ</div>
        )}
      </div>
    </div>
  )
}
