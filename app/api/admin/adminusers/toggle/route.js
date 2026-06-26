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
      return NextResponse.json({ error: 'เฉพาะ CEO เท่านั้น' }, { status: 403 })
    }

    const { admin_id, is_active } = await request.json()

    if (!admin_id || typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
    }

    // ห้าม CEO ระงับตัวเอง
    if (admin_id === session.id) {
      return NextResponse.json(
        { error: 'ไม่สามารถระงับบัญชีของตัวเองได้' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('admin_users')
      .update({ is_active })
      .eq('id', admin_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin.from('audit_log').insert({
      admin_id: session.id,
      action: is_active ? 'activate_admin' : 'deactivate_admin',
      target_id: admin_id
    })

    return NextResponse.json({ success: true, is_active })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
