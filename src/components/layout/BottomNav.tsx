'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, MapPin, Compass, User } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/rankings', icon: Trophy, label: 'Rankings' },
  { href: '/trending', icon: MapPin, label: 'Near Me' },
  { href: '/areas', icon: Compass, label: 'Areas' },
  { href: '/about', icon: User, label: 'About' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass safe-area-bottom md:hidden">
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 touch-target transition-colors ${
                isActive
                  ? 'text-copper'
                  : 'text-muted hover:text-cream'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1 font-medium tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
