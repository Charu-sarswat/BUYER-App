'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BuyersNavProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
  }
}

export function BuyersNav({ user }: BuyersNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/buyers', label: 'All Buyers' },
    { href: '/buyers/new', label: 'New Buyer' },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/buyers" className="text-xl font-bold">
            Buyer Lead Intake
          </Link>
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {user.name || user.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}
