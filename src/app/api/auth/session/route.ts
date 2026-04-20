import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

const SESSION_COOKIE_NAME = 'session'
const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000 // 5 days
const isProduction = process.env.NODE_ENV === 'production'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const idToken = body?.token

  if (!idToken) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_MAX_AGE_MS / 1000,
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to create session cookie', details: (error as Error)?.message ?? null },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}
