import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')

  if (!sessionCookie) {
    return NextResponse.json({ error: 'ยังไม่ได้ login' }, { status: 401 })
  }

  try {
    const session = JSON.parse(sessionCookie.value)

    // เช็ค is_active จริงจาก DB ทุกครั้ง — ข้อ 14: deactivate = ตัด session ทันที
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, username, role, is_active')
      .eq('id', session.id)
      .single()

    if (error || !admin || !admin.is_active) {
      // ลบ cookie ออกด้วยถ้าถูกระงับ
      const response = NextResponse.json(
        { error: 'บัญชีถูกระงับหรือไม่พบข้อมูล' },
        { status: 401 }
      )
      response.cookies.set('admin_session', '', { maxAge: 0, path: '/' })
      return response
    }

    return NextResponse.json({
      id: admin.id,
      username: admin.username,
      role: admin.role
    })

  } catch {
    return NextResponse.json({ error: 'session ไม่ถูกต้อง' }, { status: 401 })
  }
}
