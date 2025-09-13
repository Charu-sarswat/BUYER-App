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
    { href: '/my-buyers', label: 'My Buyers' },
    { href: '/buyers/new', label: 'New Buyer' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-professional">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-8">
          <Link href="/buyers" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BL</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent group-hover:from-primary/80 group-hover:to-primary transition-all duration-200">
              Buyer Lead Intake
            </span>
          </Link>
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-accent/50',
                  pathname === item.href
                    ? 'text-primary bg-primary/10 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
                {pathname === item.href && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-3 px-3 py-2 rounded-lg bg-muted/50">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {user.name || 'User'}
              </span>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}
