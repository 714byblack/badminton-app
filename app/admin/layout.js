'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const roleInfo = {
  ceo: { label: '👑 CEO', color: '#7c3aed', bg: '#ede9fe', name: 'สิทธิ์สูงสุด', sub: 'จัดการได้ทั้งหมด' },
  manager: { label: '🧑‍💼 Manager', color: '#2563eb', bg: '#dbeafe', name: 'ผู้จัดการ', sub: 'จัดการได้เฉพาะรายการที่ได้รับมอบ' },
  admin: { label: '📋 Admin', color: '#92400e', bg: '#fef3c7', name: 'แอดมิน', sub: 'เพิ่ม/ลบ/แก้ไขรายชื่อผู้เล่นเท่านั้น' }
}

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }
    fetch('/api/admin/session')
      .then(res => {
        if (!res.ok) throw new Error('no session')
        return res.json()
      })
      .then(data => {
        setSession(data)
        setLoading(false)
      })
      .catch(() => {
        router.push('/admin/login')
      })
  }, [router, isLoginPage])

  // หน้า login ไม่มี sidebar ครอบ — render children ตรงๆ
  if (isLoginPage) {
    return children
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#9ca3af' }}>
        กำลังตรวจสอบสิทธิ์...
      </div>
    )
  }

  if (!session) return null

  const info = roleInfo[session.role] || roleInfo.admin
  const isCeo = session.role === 'ceo'
  const isManagerOrCeo = session.role === 'manager' || session.role === 'ceo'

  const navItem = (href, icon, label, allowed = true) => {
    const active = pathname === href
    return (
      <Link
        href={allowed ? href : '#'}
        onClick={(e) => { if (!allowed) e.preventDefault() }}
        style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px',
          fontSize: 13, textDecoration: 'none',
          color: active ? 'white' : (allowed ? '#4b5563' : '#9ca3af'),
          background: active ? '#16a34a' : 'transparent',
          fontWeight: active ? 600 : 400,
          cursor: allowed ? 'pointer' : 'not-allowed',
          opacity: allowed ? 1 : 0.55
        }}
      >
        <span style={{ width: 18, textAlign: 'center' }}>{icon}</span> {label}
        {!allowed && <span style={{ marginLeft: 'auto', fontSize: 11 }}>🔒</span>}
      </Link>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', background: '#f0fdf4' }}>
      <nav style={{ width: 210, background: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, marginBottom: 8, background: info.bg, color: info.color }}>
            {info.label}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{session.username}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{info.sub}</div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 16px 6px' }}>ภาพรวม</div>
        {navItem('/admin/dashboard', '📊', 'Dashboard')}

        <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 16px 6px' }}>จัดการรายการแข่ง</div>
        {navItem('/admin/tournaments', '🏆', 'รายการแข่งขัน')}

        <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 16px 6px' }}>ผู้สมัคร</div>
        {navItem('/admin/players', '👥', 'อนุมัติผู้สมัคร')}

        <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 16px 6px' }}>ระบบ</div>
        {navItem('/admin/adminusers', '🔑', 'จัดการแอดมิน', isCeo)}

        <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: 8, borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 12, color: '#4b5563', cursor: 'pointer' }}
          >
            ← ออกจากระบบ
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
