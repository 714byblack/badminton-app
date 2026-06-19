import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

// service role key เพราะต้อง insert ข้อมูลที่ RLS ของ anon ไม่อนุญาตให้คนทั่วไป insert ตรงๆ
// (ป้องกันคนยิง insert ตรงไป Supabase ข้าม validation logic ของเรา)
export const dynamic = 'force-dynamic'

export async function POST(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  try {
    const formData = await request.formData()

    const tournamentSlug = formData.get('tournament_slug')
    const teamName = formData.get('team_name')
    const level = formData.get('level')
    const phone = formData.get('phone')
    const teamPassword = formData.get('team_password')

    const p1Name = formData.get('p1_name')
    const p1Nick = formData.get('p1_nick')
    const p1Age = formData.get('p1_age')
    const p1Photo = formData.get('p1_photo')

    const p2Name = formData.get('p2_name')
    const p2Nick = formData.get('p2_nick')
    const p2Age = formData.get('p2_age')
    const p2Photo = formData.get('p2_photo')

    // validation ฝั่ง server (ห้ามเชื่อ validation ฝั่ง client อย่างเดียว)
    if (!teamName || !level || !phone || !teamPassword || !p1Name || !p2Name) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      )
    }

    if (teamPassword.length < 4 || teamPassword.length > 8) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมี 4-8 หลัก' },
        { status: 400 }
      )
    }

    if (!p1Photo || !p2Photo || p1Photo.size === 0 || p2Photo.size === 0) {
      return NextResponse.json(
        { error: 'กรุณาอัปโหลดรูปถ่ายผู้สมัครทั้ง 2 คน' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 2 * 1024 * 1024 // 2MB ตามที่ตั้งไว้ใน UI เดิม
    if (p1Photo.size > MAX_SIZE || p2Photo.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'ไฟล์รูปต้องไม่เกิน 2MB' },
        { status: 400 }
      )
    }

    // หา tournament_id จาก slug
    const { data: tournament, error: tError } = await supabaseAdmin
      .from('tournaments')
      .select('id, is_deleted')
      .eq('slug', tournamentSlug)
      .single()

    if (tError || !tournament || tournament.is_deleted) {
      return NextResponse.json(
        { error: 'ไม่พบรายการแข่งขันนี้' },
        { status: 404 }
      )
    }

    // hash รหัสผ่านทีม
    const passwordHash = await bcrypt.hash(teamPassword, 10)

    // insert team ก่อน (ยังไม่มี player_id ตอนนี้ ไม่เป็นไรเพราะ players แยกตาราง)
    const { data: newTeam, error: teamError } = await supabaseAdmin
      .from('teams')
      .insert({
        tournament_id: tournament.id,
        team_name: teamName,
        level: level,
        phone: phone,
        password_hash: passwordHash,
        status: 'pending', // ทุกทีมที่สมัครผ่านเว็บเองต้อง pending เสมอ (ไม่ใช่ admin เพิ่ม)
        created_by_admin: null
      })
      .select('id')
      .single()

    if (teamError) {
      return NextResponse.json(
        { error: 'บันทึกข้อมูลทีมไม่สำเร็จ: ' + teamError.message },
        { status: 500 }
      )
    }

    const teamId = newTeam.id

    // อัปโหลดรูปทั้ง 2 คน ขึ้น Supabase Storage
    async function uploadPhoto(file, playerNo) {
      const ext = file.name.split('.').pop()
      const fileName = `${teamId}/player${playerNo}.${ext}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabaseAdmin.storage
        .from('player-photos')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true
        })

      if (uploadError) throw new Error('อัปโหลดรูปคนที่ ' + playerNo + ' ไม่สำเร็จ: ' + uploadError.message)

      const { data: urlData } = supabaseAdmin.storage
        .from('player-photos')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    }

    let p1PhotoUrl, p2PhotoUrl
    try {
      p1PhotoUrl = await uploadPhoto(p1Photo, 1)
      p2PhotoUrl = await uploadPhoto(p2Photo, 2)
    } catch (uploadErr) {
      // ถ้าอัปโหลดรูปพัง ลบทีมที่ insert ไปแล้วทิ้ง ไม่ให้มีทีมไม่มีรูปค้างในระบบ
      await supabaseAdmin.from('teams').delete().eq('id', teamId)
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    // insert players ทั้ง 2 คน
    const { error: playersError } = await supabaseAdmin
      .from('players')
      .insert([
        { team_id: teamId, player_no: 1, fullname: p1Name, nickname: p1Nick, age: p1Age ? parseInt(p1Age) : null, photo_url: p1PhotoUrl },
        { team_id: teamId, player_no: 2, fullname: p2Name, nickname: p2Nick, age: p2Age ? parseInt(p2Age) : null, photo_url: p2PhotoUrl }
      ])

    if (playersError) {
      await supabaseAdmin.from('teams').delete().eq('id', teamId)
      return NextResponse.json(
        { error: 'บันทึกข้อมูลผู้เล่นไม่สำเร็จ: ' + playersError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      team_id: teamId
    })

  } catch (err) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ: ' + err.message },
      { status: 500 }
    )
  }
}
