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
    // เช็ค admin session + เฉพาะ CEO เท่านั้น
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'กรุณา login ก่อน' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)

    if (session.role !== 'ceo') {
      return NextResponse.json(
        { error: 'เฉพาะ CEO เท่านั้นที่สร้างรายการแข่งขันได้' },
        { status: 403 }
      )
    }

    const { name, slug, venue, date_start, date_end, reg_close_at } = await request.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อรายการและ slug' },
        { status: 400 }
      )
    }

    // ตรวจสอบ slug ต้องเป็น lowercase + ขีดกลาง เท่านั้น
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข และขีดกลาง (-) เท่านั้น' },
        { status: 400 }
      )
    }

    // เช็คว่า slug ซ้ำไหม
    const { data: existing } = await supabaseAdmin
      .from('tournaments')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Slug นี้ถูกใช้ไปแล้ว กรุณาเปลี่ยน slug ใหม่' },
        { status: 409 }
      )
    }

    const { data: newTournament, error } = await supabaseAdmin
      .from('tournaments')
      .insert({
        name,
        slug,
        venue: venue || null,
        date_start: date_start || null,
        date_end: date_end || null,
        reg_close_at: reg_close_at || null,
        is_deleted: false
      })
      .select('id, name, slug')
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'สร้างรายการแข่งขันไม่สำเร็จ: ' + error.message },
        { status: 500 }
      )
    }

    // บันทึก audit log
    await supabaseAdmin.from('audit_log').insert({
      admin_id: session.id,
      action: 'create_tournament',
      target_id: newTournament.id,
      detail: name
    })

    return NextResponse.json({
      success: true,
      tournament: newTournament
    })

  } catch (err) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด: ' + err.message },
      { status: 500 }
    )
  }
}
