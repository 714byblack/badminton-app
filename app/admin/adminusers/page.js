'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const roleLabel = {
  ceo: { text: '👑 CEO', color: '#7c3aed', bg: '#ede9fe' },
  manager: { text: '🧑‍💼 Manager', color: '#2563eb', bg: '#dbeafe' },
  admin: { text: '📋 Admin', color: '#92400e', bg: '#fef3c7' }
}

export default function AdminUsersPage() {
  const [session, setSession] = useState(null)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/session')
      .then(res => res.json())
      .then(data => {
        setSession(data)
        if (data.role === 'ceo') loadAdmins()
        else setLoading(false)
      })
  }, [])

  async function loadAdmins() {
    // RLS policy "ceo_manage_admins" จะอนุญาตเฉพาะ CEO เห็นทุก row
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, role, is_active, created_at')
      .order('created_at', { ascending: true })

    if (error) setErrorMsg(error.message)
    else setAdmins(data || [])
    setLoading(false)
  }

  if (loading || !session) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif', color: '#9ca3af' }}>กำลังโหลดข้อมูล...</div>
  }

  // ข้อ 1: เฉพาะ CEO จัดการ admin คนอื่นได้
  if (session.role !== 'ceo') {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 900 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>🔑 จัดการแอดมิน</div>
        <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 20, marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 18, color: '#dc2626' }}>ไม่มีสิทธิ์เข้าถึง</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>หน้านี้สำหรับ CEO เท่านั้น</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 900 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>🔑 จัดการแอดมิน</div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2, marginBottom: 20 }}>
        เพิ่มผู้ดูแลระบบและมอบสิทธิ์เข้าถึงรายการแข่งขัน
      </div>

      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 20 }}>
        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 10px', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>ชื่อผู้ใช้</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>Role</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => {
              const r = roleLabel[a.role] || roleLabel.admin
              return (
                <tr key={a.id}>
                  <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6' }}>{a.username}</td>
                  <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: r.bg, color: r.color }}>
                      {r.text}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6', color: a.is_active ? '#15803d' : '#dc2626' }}>
                    {a.is_active ? '✅ Active' : '🔒 ถูกระงับ'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {admins.length === 0 && !errorMsg && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: 13 }}>
            ยังไม่มีแอดมินอื่นในระบบ
          </div>
        )}
      </div>
    </div>
  )
}
