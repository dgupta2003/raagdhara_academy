'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';

export default function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
  }, []);

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', mobileOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [mobileOpen]);

  const toggleCollapsed = () =>
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AdminSidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onToggleCollapsed={toggleCollapsed}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar — hidden on lg+ */}
        <div className="lg:hidden flex items-center h-14 px-4 bg-primary border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-white/70 hover:text-white transition-contemplative"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="ml-3 font-headline text-lg text-white">रागधारा</span>
          <span className="ml-2 text-white/50 text-xs font-body">Admin</span>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
