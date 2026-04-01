'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Home, List, Star, Folder, Megaphone, Calendar, Menu, Settings, BarChart3 } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Listings', href: '/listings', icon: List },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Premium Listings', href: '/premium', icon: Star },
  { name: 'Listing Analytics', href: '/listing-analytics', icon: BarChart3 },
  { name: 'Advertising', href: '/advertising', icon: Megaphone },
  { name: 'Categories', href: '/categories', icon: Folder },
  { name: 'Settings', href: '/settings', icon: Settings },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate}>
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3',
                isActive && 'bg-slate-100 dark:bg-slate-800'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="flex h-20 items-center px-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center w-full bg-black rounded-xl px-5 py-3">
          <span className="text-base font-semibold text-white whitespace-nowrap">The Block Island App</span>
        </div>
      </div>
      <div className="flex-1 py-4">
        <NavLinks />
      </div>
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-16 items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-2">
            <Image src="/logo.png" alt="Logo" width={24} height={24} className="rounded-sm" />
            <span className="text-sm font-semibold text-white">The Block Island App</span>
          </div>
        </div>
        <div className="py-4">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
