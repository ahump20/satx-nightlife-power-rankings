import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Calendar, Trophy, Gift, Search, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { SafetyFooter } from './SafetyFooter';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: Home, label: 'Tonight' },
  { path: '/monthly', icon: Trophy, label: 'Monthly' },
  { path: '/trending', icon: TrendingUp, label: 'Trending' },
  { path: '/year', icon: Calendar, label: 'Year' },
  { path: '/deals', icon: Gift, label: 'Deals' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-dark-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🌃</span>
            <span className="font-bold text-lg">SATX Nightlife</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/search" className="btn-ghost p-2">
              <Search className="h-5 w-5" />
            </Link>
            <Link to="/settings" className="btn-ghost p-2">
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Safety Footer */}
      <SafetyFooter />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-dark-800 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200',
                  isActive
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-dark-400 hover:text-white'
                )}
              >
                <item.icon className={clsx('h-5 w-5', isActive && 'animate-fade-in')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
