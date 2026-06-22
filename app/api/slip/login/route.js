import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { phone, password, tournament_slug } = await request.json()

    if (!phone || !password || !tournament_slug) {
      return NextResponse.json(
        { error: 'กรุณากรอกเบอร์โทรและรหัสผ่านทีม' },
        { status: 400 }
      )
    }

    // หา tournament ก่อน
    const { data: tournament } = await supabaseAdmin
      .from('tournaments')
      .select('id')
      .eq('slug', tournament_slug)
      .single()

    if (!tournament) {
      return NextResponse.json(
        { error: 'ไม่พบรายการแข่งขัน' },
        { status: 404 }
      )
    }

    // หาทีมจากเบอร์โทร + tournament
    const { data: team, error } = await supabaseAdmin
      .from('teams')
      .select('id, team_name, level, status, phone, password_hash, slip_url')
      .eq('phone', phone)
      .eq('tournament_id', tournament.id)
      .neq('status', 'withdrawn')
      .single()

    if (error || !team) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลทีม กรุณาตรวจสอบเบอร์โทรและรายการแข่งขัน' },
        { status: 401 }
      )
    }

    // เช็ครหัสผ่าน
    const match = await bcrypt.compare(password, team.password_hash)
    if (!match) {
      return NextResponse.json(
        { error: 'รหัสผ่านทีมไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // ดึงข้อมูลผู้เล่น
    const { data: players } = await supabaseAdmin
      .from('players')
      .select('player_no, fullname, nickname, photo_url')
      .eq('team_id', team.id)
      .order('player_no')

    // ตั้ง cookie team session
    const response = NextResponse.json({
      success: true,
      team: {
        id: team.id,
        team_name: team.team_name,
        level: team.level,
        status: team.status,
        slip_url: team.slip_url,
        players: players || []
      }
    })

    response.cookies.set('team_session', JSON.stringify({
      team_id: team.id,
      tournament_slug
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 4, // 4 ชั่วโมง
      path: '/'
    })

    return response

  } catch (err) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด: ' + err.message },
      { status: 500 }
    )
  }
}
