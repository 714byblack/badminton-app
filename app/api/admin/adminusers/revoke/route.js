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
        { error: 'เฉพาะ CEO เท่านั้นที่ถอนสิทธิ์ได้' },
        { status: 403 }
      )
    }

    const { admin_id, tournament_id } = await request.json()

    if (!admin_id || !tournament_id) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('admin_tournament_access')
      .delete()
      .eq('admin_id', admin_id)
      .eq('tournament_id', tournament_id)

    if (error) {
      return NextResponse.json(
        { error: 'ถอนสิทธิ์ไม่สำเร็จ: ' + error.message },
        { status: 500 }
      )
    }

    await supabaseAdmin.from('audit_log').insert({
      admin_id: session.id,
      action: 'revoke_tournament_access',
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
