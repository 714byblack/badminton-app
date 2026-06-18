'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('กรุณากรอก username และ password')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด')
        setLoading(false)
        return
      }

      // login สำเร็จ → ไปหน้า dashboard ตาม role
      router.push('/admin/dashboard')

    } catch (err) {
      setError('เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่')
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: '36px 40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        width: 360,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 32 }}>🔐</div>
        <h1 style={{ fontSize: 22, color: '#15803d', margin: '6px 0 2px' }}>Admin Login</h1>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
          เข้าสู่ระบบจัดการการแข่งขัน
        </div>

        <form onSubmit={handleLogin}>
          <label style={{ display: 'block', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 4 }}>
            USERNAME
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
              borderRadius: 8, fontSize: 13, marginBottom: 14, outline: 'none', boxSizing: 'border-box'
            }}
            autoComplete="username"
          />

          <label style={{ display: 'block', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 4 }}>
            PASSWORD
          </label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '10px 40px 10px 14px', border: '1px solid #e5e7eb',
                borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af'
              }}
            >
              👁
            </button>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2', color: '#991b1b', padding: '8px 12px',
              borderRadius: 8, fontSize: 12, marginBottom: 14, textAlign: 'left'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 11, borderRadius: 8,
              background: loading ? '#9ca3af' : '#16a34a',
              color: 'white', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
