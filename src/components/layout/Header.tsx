'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Search } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

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

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
    onMenuToggle?.();
  };

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
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-xl font-bold text-ivory">
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
                className="btn-ghost p-2 rounded-lg touch-target"
                aria-label="Search venues"
              >
                <Search className="w-5 h-5" />
              </Link>
              <button
                onClick={handleMenuClick}
                className="btn-ghost p-2 rounded-lg touch-target"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 bg-midnight/95 backdrop-blur-lg transition-all duration-300 ${
          isMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav className="container pt-24 pb-8">
          <ul className="space-y-2">
            {[
              { href: '/', label: 'Home' },
              { href: '/rankings', label: 'Power Rankings' },
              { href: '/trending', label: 'Near Me' },
              { href: '/areas', label: 'Areas' },
              { href: '/about', label: 'About' },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-4 px-4 text-xl font-display text-cream hover:text-copper hover:bg-charcoal rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-8 border-t border-slate">
            <p className="text-muted text-sm px-4">
              San Antonio &middot; Boerne &middot; New Braunfels
            </p>
          </div>
        </nav>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  );
}
