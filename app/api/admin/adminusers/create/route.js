import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'กรุณา login ก่อน' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    if (session.role !== 'ceo') {
      return NextResponse.json(
        { error: 'เฉพาะ CEO เท่านั้นที่เพิ่มแอดมินได้' },
        { status: 403 }
      )
    }

    const { username, password, role } = await request.json()

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    if (!['manager', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'role ต้องเป็น manager หรือ admin เท่านั้น' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'password ต้องมีอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      )
    }

    // เช็ค username ซ้ำ
    const { data: existing } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'username นี้ถูกใช้แล้ว กรุณาเปลี่ยน username ใหม่' },
        { status: 409 }
      )
    }

    const password_hash = await bcrypt.hash(password, 10)

    const { data: newAdmin, error } = await supabaseAdmin
      .from('admin_users')
      .insert({
        username,
        password_hash,
        role,
        created_by: session.id,
        is_active: true
      })
      .select('id, username, role')
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'สร้างแอดมินไม่สำเร็จ: ' + error.message },
        { status: 500 }
      )
    }

    await supabaseAdmin.from('audit_log').insert({
      admin_id: session.id,
      action: 'create_admin',
      target_id: newAdmin.id,
      detail: username + ' (' + role + ')'
    })

    return NextResponse.json({ success: true, admin: newAdmin })

  } catch (err) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด: ' + err.message },
      { status: 500 }
    )
  }
}
