import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request, { params }) {
  const { id } = await params

  // เช็ค session ก่อน — ต้อง login เป็น CEO/Manager/Admin เท่านั้น
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')
  if (!sessionCookie) {
    return NextResponse.json({ error: 'กรุณา login ก่อน' }, { status: 401 })
  }

  let session
  try {
    session = JSON.parse(sessionCookie.value)
  } catch {
    return NextResponse.json({ error: 'session ไม่ถูกต้อง' }, { status: 401 })
  }

  // ข้อ 7 ของ grill session: Admin อนุมัติทีมที่ตัวเองเพิ่มไม่ได้ (conflict of interest)
  const { data: team, error: fetchError } = await supabaseAdmin
    .from('teams')
    .select('id, status, created_by_admin')
    .eq('id', id)
    .single()

  if (fetchError || !team) {
    return NextResponse.json({ error: 'ไม่พบทีมนี้' }, { status: 404 })
  }

  if (session.role === 'admin' && team.created_by_admin === session.id) {
    return NextResponse.json(
      { error: 'ไม่สามารถอนุมัติทีมที่คุณเพิ่มเองได้ ต้องให้ CEO หรือ Manager อนุมัติ' },
      { status: 403 }
    )
  }

  // ข้อ 10 ของ grill session: conditional UPDATE ป้องกัน race condition
  // ถ้า status ไม่ใช่ pending แล้ว (คนอื่นกดไปก่อน) จะ affect 0 rows
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('teams')
    .update({ status: 'approved' })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: 'ทีมนี้ถูกดำเนินการไปแล้ว (อาจถูกอนุมัติ/ปฏิเสธไปก่อนหน้านี้)' },
      { status: 409 }
    )
  }

  return NextResponse.json({ success: true })
}
