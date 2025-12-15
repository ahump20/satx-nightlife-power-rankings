'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Menu, X, Search, Trophy, MapPin, Compass, User, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onMenuToggle?: () => void;
}

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/rankings', label: 'Power Rankings', icon: Trophy },
  { href: '/trending', label: 'Near Me', icon: MapPin },
  { href: '/areas', label: 'Areas', icon: Compass },
  { href: '/about', label: 'About', icon: User },
];

export function Header({ onMenuToggle }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleMenuClick = useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
    onMenuToggle?.();
  }, [isMenuOpen, onMenuToggle]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-top ${
          isScrolled ? 'glass' : 'bg-transparent'
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-display text-xl font-bold text-ivory group-hover:text-copper transition-colors">
                SATX
              </span>
              <span className="text-copper font-mono text-xs tracking-wider">
                NIGHTLIFE
              </span>
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/search"
                className="btn-ghost p-2 rounded-lg touch-target ripple"
                aria-label="Search venues"
              >
                <Search className="w-5 h-5" />
              </Link>
              <button
                onClick={handleMenuClick}
                className="btn-ghost p-2 rounded-lg touch-target ripple relative"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-midnight/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
            />

            {/* Menu panel */}
            <motion.div
              className="fixed inset-0 z-40 bg-midnight/95 backdrop-blur-lg overflow-y-auto"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <nav className="container pt-24 pb-8">
                <motion.ul
                  className="space-y-2"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
                    },
                  }}
                >
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <motion.li
                        key={item.href}
                        variants={{
                          hidden: { opacity: 0, x: 20 },
                          visible: { opacity: 1, x: 0 },
                        }}
                      >
                        <Link
                          href={item.href}
                          onClick={closeMenu}
                          className="flex items-center gap-4 py-4 px-4 text-xl font-display text-cream hover:text-copper hover:bg-charcoal rounded-lg transition-all ripple group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate/50 flex items-center justify-center group-hover:bg-copper/20 transition-colors">
                            <Icon className="w-5 h-5 text-muted group-hover:text-copper transition-colors" />
                          </div>
                          <span>{item.label}</span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </motion.ul>

                {/* Footer info */}
                <motion.div
                  className="mt-10 pt-8 border-t border-slate"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-muted text-sm px-4 mb-4">
                    San Antonio &middot; Boerne &middot; New Braunfels
                  </p>
                  <p className="text-xs text-muted/60 px-4">
                    Research-backed nightlife rankings
                  </p>
                </motion.div>

                {/* CTA */}
                <motion.div
                  className="mt-8 px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link
                    href="/rankings"
                    onClick={closeMenu}
                    className="btn btn-primary w-full"
                  >
                    <Trophy className="w-4 h-4" />
                    View Rankings
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  );
}
