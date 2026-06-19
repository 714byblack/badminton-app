import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  // สร้าง client ใน function ไม่ใช่ระดับ module — ป้องกัน build error
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอก username และ password' },
        { status: 400 }
      )
    }

    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, username, password_hash, role, is_active')
      .eq('username', username)
      .single()

    if (error || !admin) {
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
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8,
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
