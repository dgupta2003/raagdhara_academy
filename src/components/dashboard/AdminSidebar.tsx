'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
  onToggleCollapsed?: () => void;
}

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Students',
    href: '/admin/students',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Batches',
    href: '/admin/batches',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'Attendance',
    href: '/admin/attendance',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Payments',
    href: '/admin/payments',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AdminSidebar({
  mobileOpen = false,
  collapsed = false,
  onClose,
  onToggleCollapsed,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/homepage');
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <aside
      className={[
        'bg-primary flex flex-col',
        // Mobile: fixed drawer; Desktop: part of normal flow
        'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto',
        // Height
        'min-h-screen',
        // Width: always w-64 on mobile (full sidebar text); on desktop respect collapsed state
        'w-64',
        collapsed ? 'lg:w-16' : 'lg:w-64',
        // Slide in/out on mobile; always visible on desktop
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        // Smooth width + transform transition
        'transition-[width,transform] duration-300',
      ].join(' ')}
      aria-hidden={!mobileOpen && typeof window !== 'undefined' && window.innerWidth < 1024 ? true : undefined}
    >
      {/* Brand */}
      <div className={`border-b border-white/10 ${collapsed ? 'lg:px-0 lg:py-6 lg:flex lg:justify-center px-6 py-6' : 'px-6 py-6'}`}>
        <div className={`flex items-center ${collapsed ? 'lg:justify-center gap-3' : 'gap-3'}`}>
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" className="flex-shrink-0">
            <path d="M24 4C12.954 4 4 12.954 4 24C4 35.046 12.954 44 24 44C35.046 44 44 35.046 44 24C44 12.954 35.046 4 24 4Z" fill="white" opacity="0.15" />
            <path d="M24 8C15.163 8 8 15.163 8 24C8 32.837 15.163 40 24 40C32.837 40 40 32.837 40 24C40 15.163 32.837 8 24 8Z" stroke="white" strokeWidth="2" fill="none" />
            <path d="M16 24C16 19.582 19.582 16 24 16C28.418 16 32 19.582 32 24" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M20 28C20 25.791 21.791 24 24 24C26.209 24 28 25.791 28 28" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="24" r="3" fill="white" />
          </svg>
          {/* Text hidden when collapsed on desktop */}
          <div className={collapsed ? 'lg:hidden' : ''}>
            <p className="font-devanagari text-lg font-medium text-white leading-none">रागधारा</p>
            <p className="text-xs text-white/60 tracking-wide">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            onClick={() => onClose?.()}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body transition-contemplative ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            } ${
              isActive(item.href)
                ? 'bg-white/15 text-white font-medium'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon}
            <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Desktop collapse toggle — hidden on mobile */}
      <div className="hidden lg:flex px-3 py-2 border-t border-white/10">
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs text-white/50 hover:bg-white/10 hover:text-white transition-contemplative ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <svg
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          <span className={collapsed ? 'hidden' : ''}>Collapse</span>
        </button>
      </div>

      {/* User + sign out */}
      <div className={`px-3 py-4 border-t border-white/10 ${collapsed ? 'lg:px-1' : ''}`}>
        {/* Email — hidden when collapsed */}
        <div className={`px-3 py-2 mb-1 ${collapsed ? 'lg:hidden' : ''}`}>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white transition-contemplative font-body ${
            collapsed ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className={collapsed ? 'lg:hidden' : ''}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
