import bcrypt from 'bcrypt'
import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  isAdmin: boolean
  username: string
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-min-32-characters-long'

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = cookies()
  
  return getIronSession<SessionData>(cookieStore, {
    password: SESSION_SECRET,
    cookieName: 'memeapi-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict'
    }
  })
}

export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const adminUsername = process.env.ADMIN_USERNAME
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminUsername || !adminPassword) {
    return false
  }

  if (username !== adminUsername) {
    return false
  }

  return bcrypt.compareSync(password, adminPassword) || password === adminPassword
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()
  
  if (!session.isAdmin) {
    throw new Error('Unauthorized')
  }
  
  return session
}

export async function login(username: string, password: string): Promise<boolean> {
  const isValid = await validateAdminCredentials(username, password)
  
  if (isValid) {
    const session = await getSession()
    session.isAdmin = true
    session.username = username
    await session.save()
  }
  
  return isValid
}

export async function logout(): Promise<void> {
  const session = await getSession()
  session.destroy()
}
