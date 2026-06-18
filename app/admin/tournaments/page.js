'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function TournamentsPage() {
  const [session, setSession] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/session')
      .then(res => res.json())
      .then(data => {
        setSession(data)
        loadTournaments()
      })
  }, [])

  async function loadTournaments() {
    // RLS policy จะกรองให้อัตโนมัติตาม role อยู่แล้ว (CEO เห็นหมด, Manager เห็นเฉพาะ assigned)
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('is_deleted', false)
      .order('date_start', { ascending: true })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setTournaments(data || [])
    }
    setLoading(false)
  }

  if (loading || !session) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif', color: '#9ca3af' }}>กำลังโหลดข้อมูล...</div>
  }

  const isCeo = session.role === 'ceo'
  const isManager = session.role === 'manager'

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 900 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>🏆 รายการแข่งขัน</div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2, marginBottom: 20 }}>
        {isCeo && 'จัดการรายการแข่งขันทั้งหมดในระบบ'}
        {isManager && 'คุณเห็นเฉพาะรายการที่ CEO มอบสิทธิ์ให้'}
        {session.role === 'admin' && 'ดูได้อย่างเดียว (read-only)'}
      </div>

      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 20 }}>
        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {tournaments.length === 0 && !errorMsg && (
          <div style={{ textAlign: 'center', padding: '50px 24px' }}>
            <div style={{ fontSize: 44 }}>📭</div>
            <h3 style={{ fontSize: 16, color: '#4b5563', margin: '10px 0 4px' }}>
              {isManager ? 'ยังไม่มีรายการที่มอบให้คุณ' : 'ยังไม่มีรายการแข่งขัน'}
            </h3>
            <p style={{ fontSize: 12, color: '#9ca3af' }}>
              {isManager ? 'กรุณาติดต่อ CEO เพื่อขอสิทธิ์จัดการรายการแข่งขัน' : 'เริ่มสร้างรายการแข่งขันใหม่ได้เลย'}
            </p>
          </div>
        )}

        {tournaments.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏸</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.venue} · {t.date_start}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
