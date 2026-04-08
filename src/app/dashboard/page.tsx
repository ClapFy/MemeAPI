import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardLayout from '@/components/dashboard/layout'

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session.isAdmin) {
    redirect('/dashboard/login')
  }

  return <DashboardLayout />
}
