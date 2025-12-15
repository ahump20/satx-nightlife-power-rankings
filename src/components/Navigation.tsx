'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, TrendingUp, Calendar, Info } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/rankings', icon: Trophy, label: 'Rankings' },
  { href: '/trending', icon: TrendingUp, label: 'Trending' },
  { href: '/timeline', icon: Calendar, label: 'Timeline' },
  { href: '/about', icon: Info, label: 'About' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-50 safe-area-bottom">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 min-w-[64px] transition-colors ${
                  isActive
                    ? 'text-purple-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌃</span>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">
              SATX Nightlife
            </h1>
            <p className="text-xs text-purple-400 -mt-0.5">Power Rankings</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="hidden sm:inline">San Antonio NW • Boerne</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live</span>
        </div>
      </div>
    </header>
  );
}
