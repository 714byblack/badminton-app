import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    const [{ data: admins }, { data: access }, { data: tournaments }] = await Promise.all([
      supabaseAdmin
        .from('admin_users')
        .select('id, username, role, is_active, created_at')
        .order('created_at'),
      supabaseAdmin
        .from('admin_tournament_access')
        .select('admin_id, tournament_id'),
      supabaseAdmin
        .from('tournaments')
        .select('id, name, slug')
        .eq('is_deleted', false)
        .order('date_start', { ascending: false })
    ])

    return NextResponse.json({ admins, access, tournaments })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
