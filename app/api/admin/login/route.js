import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

// ใช้ service role key ฝั่ง server เท่านั้น (ไม่ใช่ anon key)
// เพราะต้องอ่าน password_hash ซึ่ง RLS ปกติจะบล็อกไว้สำหรับ anon
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอก username และ password' },
        { status: 400 }
      )
    }

    // ดึงข้อมูล admin ตาม username (เฉพาะ active เท่านั้น — ข้อ 14 ของ grill session)
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, username, password_hash, role, is_active')
      .eq('username', username)
      .single()

    if (error || !admin) {
      // ไม่บอกว่า "username ไม่มี" หรือ "password ผิด" แยกกัน
      // เพื่อไม่ให้คนนอกรู้ว่า username ไหนมีอยู่จริงในระบบ
      return NextResponse.json(
        { error: 'username หรือ password ไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { error: 'บัญชีนี้ถูกระงับการใช้งาน' },
        { status: 403 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, admin.password_hash)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'username หรือ password ไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // login สำเร็จ — ตั้ง cookie เก็บ session แบบง่าย (ไม่ใช่ JWT เต็มรูปแบบ)
    const response = NextResponse.json({
      success: true,
      role: admin.role,
      username: admin.username
    })

    response.cookies.set('admin_session', JSON.stringify({
      id: admin.id,
      username: admin.username,
      role: admin.role
    }), {
      httpOnly: true,      // JS ฝั่ง browser อ่านไม่ได้ ป้องกัน XSS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 ชั่วโมง
      path: '/'
    })

    return response

  } catch (err) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' },
      { status: 500 }
    )
  }
}
