import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { login } from '@/lib/auth'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = loginSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 400 }
      )
    }
    
    const { username, password } = validation.data
    
    const isValid = await login(username, password)
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in login:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { logout } = await import('@/lib/auth')
    await logout()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in logout:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
