import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')

  if (!sessionCookie) {
    return NextResponse.json({ error: 'ยังไม่ได้ login' }, { status: 401 })
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    return NextResponse.json({
      id: session.id,
      username: session.username,
      role: session.role
    })
  } catch {
    return NextResponse.json({ error: 'session ไม่ถูกต้อง' }, { status: 401 })
  }
}
