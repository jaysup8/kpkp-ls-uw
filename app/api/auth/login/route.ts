import { NextRequest, NextResponse } from 'next/server'

const VALID_USERNAME = 'admin'
const VALID_PASSWORD = 'kpkp1'
const AUTH_COOKIE = 'kpkp_auth'
const AUTH_TOKEN = 'kpkp-authenticated-2024'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }

  const { username, password } = body

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    const response = NextResponse.json({ ok: true })
    response.cookies.set(AUTH_COOKIE, AUTH_TOKEN, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    })
    return response
  }

  return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
}
