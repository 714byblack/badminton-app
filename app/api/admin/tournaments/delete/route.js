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
        { error: 'เฉพาะ CEO เท่านั้นที่ลบรายการแข่งขันได้' },
        { status: 403 }
      )
    }

    const { tournament_id } = await request.json()
    if (!tournament_id) {
      return NextResponse.json({ error: 'ไม่พบ tournament_id' }, { status: 400 })
    }

    // soft delete ตาม grill session ข้อ 2
    const { error } = await supabaseAdmin
      .from('tournaments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: session.id
      })
      .eq('id', tournament_id)

    if (error) {
      return NextResponse.json({ error: 'ลบไม่สำเร็จ: ' + error.message }, { status: 500 })
    }

    // audit log
    await supabaseAdmin.from('audit_log').insert({
      admin_id: session.id,
      action: 'delete_tournament',
      target_id: tournament_id
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด: ' + err.message }, { status: 500 })
  }
}
