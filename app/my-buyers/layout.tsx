import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BuyersNav } from '@/components/buyers-nav'

export default async function MyBuyersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <BuyersNav user={session.user} />
      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  )
}
