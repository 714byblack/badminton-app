import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
        { error: 'เฉพาะ CEO เท่านั้นที่มอบสิทธิ์ได้' },
        { status: 403 }
      )
    }

    const { admin_id, tournament_id } = await request.json()

    if (!admin_id || !tournament_id) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบ' },
        { status: 400 }
      )
    }

    // เช็คว่าคนที่รับสิทธิ์เป็น manager จริง
    const { data: targetAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('role, username')
      .eq('id', admin_id)
      .single()

    if (!targetAdmin || targetAdmin.role !== 'manager') {
      return NextResponse.json(
        { error: 'มอบสิทธิ์ได้เฉพาะ Manager เท่านั้น' },
        { status: 400 }
      )
    }

    // upsert — ถ้ามีอยู่แล้วก็ไม่ error
    const { error } = await supabaseAdmin
      .from('admin_tournament_access')
      .upsert({
        admin_id,
        tournament_id,
        granted_by: session.id
      }, { onConflict: 'admin_id,tournament_id' })

    if (error) {
      return NextResponse.json(
        { error: 'มอบสิทธิ์ไม่สำเร็จ: ' + error.message },
        { status: 500 }
      )
    }

    await supabaseAdmin.from('audit_log').insert({
      admin_id: session.id,
      action: 'grant_tournament_access',
      target_id: admin_id,
      detail: 'tournament_id: ' + tournament_id
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด: ' + err.message },
      { status: 500 }
    )
  }
}
