import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request) {
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
    if (!['ceo', 'manager', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const slipPath = searchParams.get('path')

    if (!slipPath) {
      return NextResponse.json({ error: 'ไม่พบ path' }, { status: 400 })
    }

    // สร้าง signed URL อายุ 60 วินาที — พอสำหรับเปิดดู 1 ครั้ง
    const { data, error } = await supabaseAdmin.storage
      .from('slips')
      .createSignedUrl(slipPath, 60)

    if (error) {
      return NextResponse.json({ error: 'สร้าง URL ไม่สำเร็จ: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
