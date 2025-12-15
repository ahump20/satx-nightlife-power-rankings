'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-midnight">
      <Header />
      <main className="pb-safe">{children}</main>
      <BottomNav />
    </div>
  );
}
