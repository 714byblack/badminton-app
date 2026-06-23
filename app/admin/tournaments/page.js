'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'tournament-' + Date.now()
}

export default function TournamentsAdminPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    return createClient(url, key)
  }, [])

  const [session, setSession] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [venue, setVenue] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [regCloseAt, setRegCloseAt] = useState('')

  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => r.json())
      .then(data => { setSession(data); loadTournaments() })
  }, [])

  async function loadTournaments() {
    if (!supabase) return
    const { data } = await supabase
      .from('tournaments')
      .select('id, name, slug, venue, date_start, date_end, is_deleted')
      .order('date_start', { ascending: false })
    setTournaments(data || [])
    setLoading(false)
  }

  async function handleDelete(tournament) {
    if (!confirm('ลบรายการ "' + tournament.name + '" แน่ใจไหมครับ?\nรายการจะถูกซ่อนแต่ข้อมูลยังอยู่ กู้คืนได้ภายหลัง')) return
    setDeletingId(tournament.id)
    try {
      const res = await fetch('/api/admin/tournaments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournament.id })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'ลบไม่สำเร็จ'); setDeletingId(null); return }
      setSuccessMsg('ลบรายการ "' + tournament.name + '" เรียบร้อยแล้ว')
      loadTournaments()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch { alert('เชื่อมต่อระบบไม่ได้') }
    setDeletingId(null)
  }

  function handleNameChange(val) {
    setName(val)
    if (!slugManual) setSlug(generateSlug(val))
  }

  function handleSlugChange(val) {
    setSlugManual(true)
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ''))
  }

  function resetForm() {
    setName(''); setSlug(''); setSlugManual(false)
    setVenue(''); setDateStart(''); setDateEnd(''); setRegCloseAt('')
    setFormError(''); setShowModal(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!name || !slug) { setFormError('กรุณากรอกชื่อรายการและ slug ครับ'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/tournaments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, venue,
          date_start: dateStart || null, date_end: dateEnd || null,
          reg_close_at: regCloseAt ? regCloseAt + ':00+07:00' : null })
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'เกิดข้อผิดพลาด'); setSubmitting(false); return }
      setSuccessMsg('สร้างรายการ "' + name + '" เรียบร้อยแล้ว')
      resetForm(); loadTournaments()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch { setFormError('เชื่อมต่อระบบไม่ได้') }
    setSubmitting(false)
  }

  const isCeo = session?.role === 'ceo'
  const inp = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 4 }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>🏆 รายการแข่งขัน</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{isCeo ? 'จัดการรายการแข่งขันทั้งหมด' : 'ดูได้อย่างเดียว'}</div>
        </div>
        {isCeo && (
          <button onClick={() => setShowModal(true)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + สร้างรายการใหม่
          </button>
        )}
      </div>

      {successMsg && <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{successMsg}</div>}

      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 20 }}>
        {loading && <div style={{ color: '#9ca3af', fontSize: 13 }}>กำลังโหลด...</div>}
        {!loading && tournaments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 40 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#4b5563', marginTop: 10 }}>ยังไม่มีรายการแข่งขัน</div>
          </div>
        )}
        {tournaments.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏸</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                {t.is_deleted && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>ลบแล้ว</span>}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>/{t.slug} · {t.venue || 'ยังไม่ระบุสถานที่'}</div>
              {t.date_start && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>📅 {new Date(t.date_start).toLocaleDateString('th-TH')}{t.date_end ? ' — ' + new Date(t.date_end).toLocaleDateString('th-TH') : ''}</div>}
            </div>
            {isCeo && !t.is_deleted && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <a href={'/' + t.slug + '/register'} target="_blank" style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid #e5e7eb', background: 'white', color: '#4b5563', textDecoration: 'none' }}>สมัคร ↗</a>
                <a href={'/' + t.slug + '/players'} target="_blank" style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid #e5e7eb', background: 'white', color: '#4b5563', textDecoration: 'none' }}>รายชื่อ ↗</a>
                <button onClick={() => handleDelete(t)} disabled={deletingId === t.id} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626', cursor: deletingId === t.id ? 'not-allowed' : 'pointer', opacity: deletingId === t.id ? 0.6 : 1 }}>
                  {deletingId === t.id ? '...' : '🗑️ ลบ'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>➕ สร้างรายการแข่งขันใหม่</div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>ชื่อรายการ *</label>
                <input style={inp} value={name} onChange={e => handleNameChange(e.target.value)} placeholder="เช่น ตบแป๊ก แม็คโชย 2027" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Slug (URL) * <span style={{ fontWeight: 400, color: '#9ca3af' }}>— ตัวอักษรอังกฤษพิมพ์เล็ก ตัวเลข และ - เท่านั้น</span></label>
                <input style={{ ...inp, fontFamily: 'monospace' }} value={slug} onChange={e => handleSlugChange(e.target.value)} placeholder="tobpaek-2027" />
                {slug && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>URL จะเป็น: /{slug}/register</div>}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>สถานที่จัดการแข่งขัน</label>
                <input style={inp} value={venue} onChange={e => setVenue(e.target.value)} placeholder="เช่น สนามแบดมินตันโรงพยาบาลบุรีรัมย์" />
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>วันเริ่มแข่ง</label>
                  <input style={inp} type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>วันสิ้นสุด</label>
                  <input style={inp} type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>วัน-เวลาปิดรับสมัคร</label>
                <input style={inp} type="datetime-local" value={regCloseAt} onChange={e => setRegCloseAt(e.target.value)} />
              </div>
              {formError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>⚠️ {formError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={resetForm} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', color: '#4b5563', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" disabled={submitting} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: submitting ? '#9ca3af' : '#16a34a', color: 'white', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'กำลังสร้าง...' : '✅ สร้างรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
