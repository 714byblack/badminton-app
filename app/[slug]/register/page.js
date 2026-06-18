'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

const levels = [
  { id: 'hospital', name: 'หน้าโรงบาล', detail: '(มือใหม่)' },
  { id: 'bg', name: 'BG', detail: 'ระดับกลาง' },
  { id: 's', name: 'S', detail: 'ระดับกลาง-สูง' },
  { id: 'n', name: 'N', detail: 'ระดับสูง' },
  { id: 'np', name: 'N/P-', detail: 'ระดับสูง' },
  { id: 'bgplus', name: 'BG+', detail: 'ระดับพิเศษ' }
]

export default function RegisterPage() {
  const params = useParams()
  const slug = params.slug

  const [step, setStep] = useState('level') // 'level' | 'form' | 'success'
  const [level, setLevel] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [p1Name, setP1Name] = useState('')
  const [p1Nick, setP1Nick] = useState('')
  const [p1Age, setP1Age] = useState('')
  const [p1Photo, setP1Photo] = useState(null)
  const [p2Name, setP2Name] = useState('')
  const [p2Nick, setP2Nick] = useState('')
  const [p2Age, setP2Age] = useState('')
  const [p2Photo, setP2Photo] = useState(null)
  const [phone, setPhone] = useState('')
  const [teamPassword, setTeamPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successTeamId, setSuccessTeamId] = useState('')

  function selectLevel(lv) {
    setLevel(lv)
    setStep('form')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!teamName || !p1Name || !p2Name || !phone || !teamPassword) {
      setError('⚠️ กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนครับ')
      return
    }
    if (teamPassword.length < 4 || teamPassword.length > 8) {
      setError('⚠️ รหัสผ่านต้องมี 4-8 หลักครับ')
      return
    }
    if (!p1Photo || !p2Photo) {
      setError('⚠️ กรุณาอัปโหลดรูปถ่ายผู้สมัครทั้ง 2 คนครับ')
      return
    }

    setLoading(true)

    const fd = new FormData()
    fd.append('tournament_slug', slug)
    fd.append('team_name', teamName)
    fd.append('level', level.id)
    fd.append('phone', phone)
    fd.append('team_password', teamPassword)
    fd.append('p1_name', p1Name)
    fd.append('p1_nick', p1Nick)
    fd.append('p1_age', p1Age)
    fd.append('p1_photo', p1Photo)
    fd.append('p2_name', p2Name)
    fd.append('p2_nick', p2Nick)
    fd.append('p2_age', p2Age)
    fd.append('p2_photo', p2Photo)

    try {
      const res = await fetch('/api/register', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError('⚠️ ' + data.error)
        setLoading(false)
        return
      }

      setSuccessTeamId(data.team_id.slice(0, 8))
      setStep('success')
      setLoading(false)
    } catch (err) {
      setError('⚠️ เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
    borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box'
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 4 }

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f0fdf4', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>📝 สมัครแข่งขัน</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
          กรุณากรอกข้อมูลให้ครบถ้วนเพื่อรักษาสิทธิ์ในการแข่งขัน
        </div>

        {step === 'level' && (
          <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>ขั้นตอนที่ 1: เลือกระดับมือ</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {levels.map(lv => (
                <div
                  key={lv.id}
                  onClick={() => selectLevel(lv)}
                  style={{
                    border: '2px solid #e5e7eb', borderRadius: 10, padding: '14px 10px',
                    textAlign: 'center', cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>{lv.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{lv.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'form' && (
          <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setStep('level')} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1.5px solid #16a34a', background: 'white', color: '#15803d', cursor: 'pointer' }}>
                ← ย้อนกลับ
              </button>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>
                ระดับ: <strong style={{ color: '#15803d' }}>{level.name}</strong> · ประเภท: คู่
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>ชื่อทีม (TEAM NAME) *</label>
                <input style={inputStyle} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="ระบุชื่อทีม" />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '4px 0 16px' }} />

              <div style={{ padding: '8px 12px', background: '#dcfce7', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 14 }}>
                👤 ข้อมูลผู้สมัคร (คนที่ 1)
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>ชื่อ-นามสกุล *</label>
                  <input style={inputStyle} value={p1Name} onChange={e => setP1Name(e.target.value)} placeholder="ระบุชื่อจริง-นามสกุล" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>ชื่อเล่น</label>
                  <input style={inputStyle} value={p1Nick} onChange={e => setP1Nick(e.target.value)} placeholder="ชื่อเล่น" />
                </div>
                <div style={{ flex: 0.6 }}>
                  <label style={labelStyle}>อายุ</label>
                  <input type="number" style={inputStyle} value={p1Age} onChange={e => setP1Age(e.target.value)} placeholder="อายุ" />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>รูปถ่ายผู้สมัคร (คนที่ 1) *</label>
                <label style={{
                  display: 'block', border: '1.5px dashed ' + (p1Photo ? '#16a34a' : '#e5e7eb'),
                  borderRadius: 7, padding: 14, textAlign: 'center', cursor: 'pointer',
                  fontSize: 12, color: p1Photo ? '#15803d' : '#9ca3af',
                  background: p1Photo ? '#dcfce7' : '#f9fafb'
                }}>
                  <input type="file" accept="image/*" onChange={e => setP1Photo(e.target.files[0])} style={{ display: 'none' }} />
                  {p1Photo ? `✅ ${p1Photo.name}` : '📷 คลิกเพื่ออัปโหลดรูป'}
                </label>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>ไฟล์รูปภาพขนาดไม่เกิน 2MB</div>
              </div>

              <div style={{ padding: '8px 12px', background: '#dcfce7', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 14 }}>
                👤 ข้อมูลผู้สมัคร (คนที่ 2)
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>ชื่อ-นามสกุล *</label>
                  <input style={inputStyle} value={p2Name} onChange={e => setP2Name(e.target.value)} placeholder="ระบุชื่อจริง-นามสกุลคนที่ 2" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>ชื่อเล่น</label>
                  <input style={inputStyle} value={p2Nick} onChange={e => setP2Nick(e.target.value)} placeholder="ชื่อเล่น" />
                </div>
                <div style={{ flex: 0.6 }}>
                  <label style={labelStyle}>อายุ</label>
                  <input type="number" style={inputStyle} value={p2Age} onChange={e => setP2Age(e.target.value)} placeholder="อายุ" />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>รูปถ่ายผู้สมัคร (คนที่ 2) *</label>
                <label style={{
                  display: 'block', border: '1.5px dashed ' + (p2Photo ? '#16a34a' : '#e5e7eb'),
                  borderRadius: 7, padding: 14, textAlign: 'center', cursor: 'pointer',
                  fontSize: 12, color: p2Photo ? '#15803d' : '#9ca3af',
                  background: p2Photo ? '#dcfce7' : '#f9fafb'
                }}>
                  <input type="file" accept="image/*" onChange={e => setP2Photo(e.target.files[0])} style={{ display: 'none' }} />
                  {p2Photo ? `✅ ${p2Photo.name}` : '📷 คลิกเพื่ออัปโหลดรูป'}
                </label>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>ไฟล์รูปภาพขนาดไม่เกิน 2MB</div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '4px 0 16px' }} />

              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>เบอร์โทรศัพท์ *</label>
                  <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="0XX-XXX-XXXX" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>รหัสผ่านทีม (4-8 หลัก) *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={{ ...inputStyle, paddingRight: 36 }}
                      value={teamPassword}
                      onChange={e => setTeamPassword(e.target.value)}
                      maxLength={8}
                      placeholder="ระบุรหัสผ่าน 4-8 หลัก"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>👁</button>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fef3c7', color: '#92400e', padding: '10px 14px', borderRadius: 7, fontSize: 12, marginBottom: 20 }}>
                ⚠️ <strong>สำคัญ:</strong> กรุณาจำรหัสผ่านนี้ไว้ เพื่อใช้เข้าสู่ระบบ "อัปโหลดสลิปโอนเงิน" และ "แก้ไขข้อมูล" ภายหลังครับ
              </div>

              {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 7, fontSize: 12, marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: 11, borderRadius: 8,
                  background: loading ? '#9ca3af' : '#16a34a',
                  color: 'white', fontWeight: 700, fontSize: 14, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ กำลังส่งข้อมูล...' : '🚀 ยืนยันการส่งใบสมัคร'}
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 56 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#15803d' }}>ส่งใบสมัครเรียบร้อยแล้ว!</div>
            <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 6 }}>
              ระบบได้รับข้อมูลของคุณแล้ว กรุณารอการตรวจสอบจากแอดมิน
            </div>
            <div style={{ background: '#dcfce7', border: '2px dashed #16a34a', borderRadius: 10, padding: '16px 24px', margin: '20px auto', display: 'inline-block' }}>
              <div style={{ fontSize: 12, color: '#15803d' }}>รหัสทีมของคุณ (ใช้อัปโหลดสลิป)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d', letterSpacing: 2 }}>{successTeamId}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
