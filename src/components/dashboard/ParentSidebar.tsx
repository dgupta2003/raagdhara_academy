'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ParentSidebarProps {
  mobileOpen?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
  onToggleCollapsed?: () => void;
}

export default function ParentSidebar({
  mobileOpen = false,
  collapsed = false,
  onClose,
  onToggleCollapsed,
}: ParentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signOut, user, guardianProfile } = useAuth();

  const currentChild = searchParams.get('child') ?? guardianProfile?.studentIds[0] ?? '';
  const childParam = currentChild ? `?child=${currentChild}` : '';

  const NAV_ITEMS = [
    {
      label: 'Overview',
      href: `/parent${childParam}`,
      exactMatch: true,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Attendance',
      href: `/parent/attendance${childParam}`,
      exactMatch: false,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: 'Payments',
      href: `/parent/payments${childParam}`,
      exactMatch: false,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/homepage');
  };

  const isActive = (href: string, exactMatch: boolean) => {
    const path = href.split('?')[0];
    return exactMatch ? pathname === path : pathname.startsWith(path);
  };

  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newChild = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('child', newChild);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const hasMultipleChildren = (guardianProfile?.studentIds.length ?? 0) > 1;

  return (
    <aside
      className={[
        'bg-primary flex flex-col',
        'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto',
        'min-h-screen',
        'w-64',
        collapsed ? 'lg:w-16' : 'lg:w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'transition-[width,transform] duration-300',
      ].join(' ')}
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
          <div className={collapsed ? 'lg:hidden' : ''}>
            <p className="font-devanagari text-lg font-medium text-white leading-none">रागधारा</p>
            <p className="text-xs text-white/60 tracking-wide">Parent Portal</p>
          </div>
        </div>
      </div>

      {/* Child selector — hidden in desktop collapsed mode (not icon-representable) */}
      {!collapsed && hasMultipleChildren && guardianProfile?.studentNames && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs text-white/50 mb-1.5">Viewing</p>
          <select
            value={currentChild}
            onChange={handleChildChange}
            className="w-full bg-white/10 text-white text-sm rounded-md px-3 py-2 border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            {guardianProfile.studentIds.map((id) => (
              <option key={id} value={id} className="text-foreground bg-white">
                {guardianProfile.studentNames?.[id] ?? id}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Show child selector on mobile even when desktop would be collapsed */}
      {collapsed && hasMultipleChildren && guardianProfile?.studentNames && (
        <div className="lg:hidden px-4 py-3 border-b border-white/10">
          <p className="text-xs text-white/50 mb-1.5">Viewing</p>
          <select
            value={currentChild}
            onChange={handleChildChange}
            className="w-full bg-white/10 text-white text-sm rounded-md px-3 py-2 border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            {guardianProfile.studentIds.map((id) => (
              <option key={id} value={id} className="text-foreground bg-white">
                {guardianProfile.studentNames?.[id] ?? id}
              </option>
            ))}
          </select>
        </div>
      )}

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
              isActive(item.href, item.exactMatch)
                ? 'bg-white/15 text-white font-medium'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon}
            <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Desktop collapse toggle */}
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
