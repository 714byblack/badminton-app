'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

const STATUS_INFO = {
  approved: { label: '✅ อนุมัติแล้ว', color: '#15803d', bg: '#dcfce7' },
  pending:  { label: '⏳ รอตรวจสอบ', color: '#92400e', bg: '#fef3c7' },
  rejected: { label: '❌ ไม่ผ่าน',   color: '#991b1b', bg: '#fee2e2' },
}

export default function SlipPage() {
  const params = useParams()
  const slug = params.slug

  const [step, setStep] = useState('login') // 'login' | 'team' | 'uploading' | 'done'
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [teamData, setTeamData] = useState(null)
  const [slipFile, setSlipFile] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoading(true)

    try {
      const res = await fetch('/api/slip/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, tournament_slug: slug })
      })
      const data = await res.json()

      if (!res.ok) {
        setLoginError(data.error || 'เกิดข้อผิดพลาด')
        setLoading(false)
        return
      }

      setTeamData(data.team)
      setStep('team')
    } catch {
      setLoginError('เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่')
    }
    setLoading(false)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ไฟล์ต้องไม่เกิน 5MB ครับ')
      e.target.value = ''
      return
    }
    setSlipFile(file)
    setUploadError('')
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!slipFile) {
      setUploadError('กรุณาเลือกไฟล์สลิปก่อนครับ')
      return
    }

    setStep('uploading')
    setUploadError('')

    const formData = new FormData()
    formData.append('slip', slipFile)

    try {
      const res = await fetch('/api/slip/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error || 'อัปโหลดไม่สำเร็จ')
        setStep('team')
        return
      }

      setStep('done')
    } catch {
      setUploadError('เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่')
      setStep('team')
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
    borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box'
  }
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#4b5563', marginBottom: 4
  }

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f0fdf4', minHeight: '100vh', padding: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, marginTop: 40 }}>

        {/* STEP: LOGIN */}
        {step === 'login' && (
          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 36 }}>🧾</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d', marginTop: 8 }}>อัปโหลดสลิปโอนเงิน</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                login ด้วยเบอร์โทรและรหัสผ่านทีมที่ตั้งไว้ตอนสมัคร
              </div>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>เบอร์โทรศัพท์ที่ใช้สมัคร *</label>
                <input
                  style={inputStyle}
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0XX-XXX-XXXX"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>รหัสผ่านทีม (4-8 หลัก) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...inputStyle, paddingRight: 40 }}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="รหัสผ่านที่ตั้งไว้ตอนสมัคร"
                    maxLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    👁
                  </button>
                </div>
              </div>

              {loginError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: 11, borderRadius: 8, border: 'none',
                  background: loading ? '#9ca3af' : '#16a34a',
                  color: 'white', fontWeight: 700, fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          </div>
        )}

        {/* STEP: TEAM INFO + UPLOAD */}
        {step === 'team' && teamData && (
          <div>
            {/* ข้อมูลทีม */}
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🏸 ข้อมูลทีมของคุณ</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{teamData.team_name}</div>
                <span style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: STATUS_INFO[teamData.status]?.bg || '#f3f4f6',
                  color: STATUS_INFO[teamData.status]?.color || '#6b7280'
                }}>
                  {STATUS_INFO[teamData.status]?.label || teamData.status}
                </span>
              </div>

              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>ระดับ: {teamData.level}</div>

              <div style={{ display: 'flex', gap: 12 }}>
                {teamData.players.map(p => (
                  <div key={p.player_no} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: '#f3f4f6',
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                    }}>
                      {p.photo_url
                        ? <img src={p.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🧑'}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.fullname}</div>
                      {p.nickname && <div style={{ fontSize: 11, color: '#9ca3af' }}>({p.nickname})</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* สถานะสลิปปัจจุบัน */}
              {teamData.slip_url ? (
                <div style={{ marginTop: 14, background: '#dcfce7', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#15803d' }}>
                  ✅ ส่งสลิปแล้ว — รอแอดมินตรวจสอบ (สามารถส่งใหม่เพื่ออัปเดตได้)
                </div>
              ) : (
                <div style={{ marginTop: 14, background: '#fef3c7', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
                  ⚠️ ยังไม่มีสลิปในระบบ — กรุณาอัปโหลดสลิปโอนเงินด้านล่าง
                </div>
              )}
            </div>

            {/* ฟอร์มอัปโหลดสลิป */}
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                {teamData.slip_url ? '🔄 อัปโหลดสลิปใหม่' : '📤 อัปโหลดสลิปโอนเงิน'}
              </div>

              <form onSubmit={handleUpload}>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>ไฟล์สลิป *</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    style={{ fontSize: 12, width: '100%' }}
                  />
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    รองรับ JPG, PNG, WEBP, PDF — ขนาดไม่เกิน 5MB
                  </div>
                  {slipFile && (
                    <div style={{ fontSize: 11, color: '#15803d', marginTop: 4 }}>
                      ✅ เลือกไฟล์: {slipFile.name}
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                    ⚠️ {uploadError}
                  </div>
                )}

                <div style={{ background: '#fef3c7', color: '#92400e', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                  ℹ️ หลังอัปโหลดแล้ว แอดมินจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: 11, borderRadius: 8, border: 'none',
                    background: '#16a34a', color: 'white', fontWeight: 700,
                    fontSize: 14, cursor: 'pointer'
                  }}
                >
                  📤 ส่งสลิป
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP: UPLOADING */}
        {step === 'uploading' && (
          <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#4b5563' }}>กำลังอัปโหลด...</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>กรุณารอสักครู่</div>
          </div>
        )}

        {/* STEP: DONE */}
        {step === 'done' && (
          <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>ส่งสลิปเรียบร้อยแล้ว!</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6, marginBottom: 20 }}>
              แอดมินจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง
            </div>
            <button
              onClick={() => { setStep('team') }}
              style={{
                padding: '9px 20px', borderRadius: 8, border: '1.5px solid #16a34a',
                background: 'white', color: '#15803d', fontWeight: 700,
                fontSize: 13, cursor: 'pointer'
              }}
            >
              กลับไปดูข้อมูลทีม
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
