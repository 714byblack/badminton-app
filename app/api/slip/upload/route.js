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
    // เช็ค team session cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('team_session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'กรุณา login ก่อนอัปโหลดสลิป' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)
    const teamId = session.team_id

    const formData = await request.formData()
    const slipFile = formData.get('slip')

    if (!slipFile || slipFile.size === 0) {
      return NextResponse.json(
        { error: 'กรุณาเลือกไฟล์สลิป' },
        { status: 400 }
      )
    }

    // เช็คขนาดไฟล์ไม่เกิน 5MB
    if (slipFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ไฟล์สลิปต้องไม่เกิน 5MB' },
        { status: 400 }
      )
    }

    // เช็คประเภทไฟล์ — รับแค่รูปภาพและ PDF
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(slipFile.type)) {
      return NextResponse.json(
        { error: 'รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF เท่านั้น' },
        { status: 400 }
      )
    }

    const ext = slipFile.name.split('.').pop()
    const fileName = teamId + '_slip.' + ext
    const arrayBuffer = await slipFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // อัปโหลดไปยัง bucket slips (private)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('slips')
      .upload(fileName, buffer, {
        contentType: slipFile.type,
        upsert: true // อัปโหลดซ้ำได้ถ้าส่งสลิปใหม่
      })

    if (uploadError) {
      return NextResponse.json(
        { error: 'อัปโหลดสลิปไม่สำเร็จ: ' + uploadError.message },
        { status: 500 }
      )
    }

    // เก็บแค่ path ไม่เก็บ public URL (เพราะ bucket เป็น private)
    const slipPath = fileName

    // update teams.slip_url
    const { error: updateError } = await supabaseAdmin
      .from('teams')
      .update({ slip_url: slipPath })
      .eq('id', teamId)

    if (updateError) {
      return NextResponse.json(
        { error: 'บันทึกข้อมูลสลิปไม่สำเร็จ: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'อัปโหลดสลิปเรียบร้อยแล้ว รอแอดมินตรวจสอบ'
    })

  } catch (err) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด: ' + err.message },
      { status: 500 }
    )
  }
}
