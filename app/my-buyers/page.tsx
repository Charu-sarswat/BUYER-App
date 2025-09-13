import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MyBuyersList } from '@/components/my-buyers-list'

export default async function MyBuyersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Buyers</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your personal buyer leads
        </p>
      </div>
      
      <MyBuyersList userId={session.user.id} />
    </>
  )
}
