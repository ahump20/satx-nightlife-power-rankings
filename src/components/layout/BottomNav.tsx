'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, MapPin, Compass, User } from 'lucide-react';
import { motion } from 'framer-motion';

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
              className={`relative flex flex-col items-center justify-center py-2 px-1 touch-target transition-colors ripple ${
                isActive
                  ? 'text-copper'
                  : 'text-muted hover:text-cream'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-copper rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              {/* Icon with scale animation */}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </motion.div>

              {/* Label */}
              <motion.span
                className="text-[10px] mt-1 font-medium tracking-tight"
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {item.label}
              </motion.span>

              {/* Active glow effect */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-copper/5 rounded-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
