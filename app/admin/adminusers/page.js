'use client'

import { useState, useEffect } from 'react'

const ROLE_LABEL = {
  ceo:     { text: '👑 CEO',      color: '#7c3aed', bg: '#ede9fe' },
  manager: { text: '🧑‍💼 Manager', color: '#2563eb', bg: '#dbeafe' },
  admin:   { text: '📋 Admin',    color: '#92400e', bg: '#fef3c7' },
}

export default function AdminUsersPage() {
  const [session, setSession] = useState(null)
  const [admins, setAdmins] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [accessMap, setAccessMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [newRole, setNewRole] = useState('admin')

  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => r.json())
      .then(data => { setSession(data); loadAll() })
  }, [])

  async function loadAll() {
    try {
      const res = await fetch('/api/admin/adminusers')
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setAdmins(data.admins || [])
      setTournaments(data.tournaments || [])
      const map = {}
      ;(data.access || []).forEach(row => {
        if (!map[row.admin_id]) map[row.admin_id] = []
        map[row.admin_id].push(row.tournament_id)
      })
      setAccessMap(map)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function resetForm() {
    setNewUsername(''); setNewPassword(''); setNewRole('admin')
    setFormError(''); setShowModal(false); setShowNewPwd(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (!newUsername || !newPassword) { setFormError('กรุณากรอกให้ครบครับ'); return }
    if (newPassword.length < 6) { setFormError('password ต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/adminusers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'เกิดข้อผิดพลาด'); setSubmitting(false); return }
      setSuccessMsg('เพิ่ม "' + newUsername + '" เรียบร้อยแล้ว')
      resetForm(); loadAll()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch { setFormError('เชื่อมต่อระบบไม่ได้') }
    setSubmitting(false)
  }

  async function handleToggle(admin_id, current_is_active) {
    const action = current_is_active ? 'ระงับ' : 'เปิดใช้งาน'
    if (!confirm('ต้องการ' + action + 'แอดมินคนนี้แน่ใจไหมครับ?')) return
    const res = await fetch('/api/admin/adminusers/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id, is_active: !current_is_active })
    })
    if (res.ok) {
      const data = await res.json()
      setSuccessMsg(!data.is_active ? 'ระงับแอดมินเรียบร้อยแล้ว' : 'เปิดใช้งานแอดมินเรียบร้อยแล้ว')
      loadAll()
      setTimeout(() => setSuccessMsg(''), 4000)
    } else {
      const d = await res.json()
      alert(d.error)
    }
  }

  async function handleGrant(admin_id, tournament_id) {
    const res = await fetch('/api/admin/adminusers/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id, tournament_id })
    })
    if (res.ok) loadAll()
    else { const d = await res.json(); alert(d.error) }
  }

  async function handleRevoke(admin_id, tournament_id) {
    const res = await fetch('/api/admin/adminusers/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id, tournament_id })
    })
    if (res.ok) loadAll()
    else { const d = await res.json(); alert(d.error) }
  }

  const isCeo = session?.role === 'ceo'
  const inp = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 4 }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>🔑 จัดการแอดมิน</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
            {isCeo ? 'เพิ่มผู้ดูแลระบบและมอบสิทธิ์รายการแข่งขัน' : 'ไม่มีสิทธิ์เข้าถึงหน้านี้'}
          </div>
        </div>
        {isCeo && (
          <button onClick={() => setShowModal(true)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + เพิ่มแอดมิน
          </button>
        )}
      </div>

      {!isCeo && (
        <div style={{ background: 'white', borderRadius: 10, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontSize: 18, color: '#dc2626', fontWeight: 700, marginTop: 12 }}>ไม่มีสิทธิ์เข้าถึง</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>หน้านี้สำหรับ CEO เท่านั้น</div>
        </div>
      )}

      {isCeo && (
        <>
          {successMsg && (
            <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              ✅ {successMsg}
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 20 }}>
            {loading && <div style={{ color: '#9ca3af', fontSize: 13 }}>กำลังโหลด...</div>}
            {!loading && admins.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 }}>ยังไม่มีแอดมินอื่นในระบบ</div>
            )}

            {admins.map(a => {
              const r = ROLE_LABEL[a.role] || ROLE_LABEL.admin
              const isExpanded = expandedId === a.id
              const myAccess = accessMap[a.id] || []
              const isSelf = a.username === session?.username

              return (
                <div key={a.id} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{a.username}</span>
                        {isSelf && <span style={{ fontSize: 10, color: '#9ca3af' }}>(คุณ)</span>}
                        <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: r.bg, color: r.color }}>{r.text}</span>
                        {!a.is_active && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>ระงับแล้ว</span>}
                      </div>
                      {a.role === 'manager' && (
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          สิทธิ์: {myAccess.length === 0 ? 'ยังไม่มีรายการที่มอบให้' : myAccess.length + ' รายการ'}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {a.role === 'manager' && !isSelf && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                          style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid #e5e7eb', background: isExpanded ? '#f0fdf4' : 'white', color: isExpanded ? '#15803d' : '#4b5563', cursor: 'pointer' }}
                        >
                          {isExpanded ? '▲ ปิด' : '🔑 มอบสิทธิ์'}
                        </button>
                      )}
                      {!isSelf && (
                        <button
                          onClick={() => handleToggle(a.id, a.is_active)}
                          style={{
                            padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                            background: a.is_active ? '#fee2e2' : '#dcfce7',
                            color: a.is_active ? '#dc2626' : '#15803d'
                          }}
                        >
                          {a.is_active ? '🔒 ระงับ' : '🔓 เปิดใช้'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && a.role === 'manager' && (
                    <div style={{ marginTop: 10, background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', marginBottom: 8 }}>
                        รายการที่มอบสิทธิ์ให้ {a.username}:
                      </div>
                      {tournaments.length === 0 && <div style={{ fontSize: 12, color: '#9ca3af' }}>ยังไม่มีรายการแข่งขันในระบบ</div>}
                      {tournaments.map(t => {
                        const hasAccess = myAccess.includes(t.id)
                        return (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{t.name}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>/{t.slug}</div>
                            </div>
                            <button
                              onClick={() => hasAccess ? handleRevoke(a.id, t.id) : handleGrant(a.id, t.id)}
                              style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: hasAccess ? '#fee2e2' : '#dcfce7', color: hasAccess ? '#dc2626' : '#15803d' }}
                            >
                              {hasAccess ? '✕ ถอนสิทธิ์' : '✓ มอบสิทธิ์'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {showModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
              <div style={{ background: 'white', borderRadius: 12, padding: 28, width: '100%', maxWidth: 400 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>➕ เพิ่มแอดมินใหม่</div>
                <form onSubmit={handleCreate}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>Username *</label>
                    <input style={inp} value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="username" autoComplete="off" />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>Password * (อย่างน้อย 6 ตัว)</label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inp, paddingRight: 40 }} type={showNewPwd ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="password" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>👁</button>
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={lbl}>Role *</label>
                    <select style={inp} value={newRole} onChange={e => setNewRole(e.target.value)}>
                      <option value="admin">📋 Admin (เพิ่ม/ลบผู้สมัคร)</option>
                      <option value="manager">🧑‍💼 Manager (จัดการแมตช์)</option>
                    </select>
                  </div>
                  {formError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>⚠️ {formError}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={resetForm} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', color: '#4b5563', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>ยกเลิก</button>
                    <button type="submit" disabled={submitting} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: submitting ? '#9ca3af' : '#16a34a', color: 'white', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                      {submitting ? 'กำลังสร้าง...' : '✅ เพิ่มแอดมิน'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
