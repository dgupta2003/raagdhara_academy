'use client';

import { useState } from 'react';

interface LoginEntry {
  email: string;
  role: string;
  loginAt: { seconds: number } | null;
}

const INITIAL_SHOW = 6;

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border border-primary/20',
  student: 'bg-green-50 text-green-700 border border-green-200',
  parent: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

function timeAgo(ts: { seconds: number } | null): string {
  if (!ts) return '—';
  const diff = Math.floor(Date.now() / 1000) - ts.seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RecentLoginsSection({ logins }: { logins: LoginEntry[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? logins : logins.slice(0, INITIAL_SHOW);
  const remaining = logins.length - INITIAL_SHOW;

  if (logins.length === 0) {
    return <p className="font-body text-sm text-muted-foreground px-6 py-4">No logins recorded yet.</p>;
  }

  return (
    <>
      <div className="divide-y divide-border">
        {visible.map((entry, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium capitalize flex-shrink-0 ${ROLE_BADGE[entry.role] ?? ROLE_BADGE.student}`}>
                {entry.role}
              </span>
              <span className="font-body text-sm text-foreground truncate">{entry.email}</span>
            </div>
            <span className="font-body text-xs text-muted-foreground flex-shrink-0 ml-4">
              {timeAgo(entry.loginAt)}
            </span>
          </div>
        ))}
      </div>

      {logins.length > INITIAL_SHOW && (
        <div className="px-6 py-3 border-t border-border">
          <button
            onClick={() => setShowAll(v => !v)}
            className="font-body text-sm text-primary hover:text-primary/80 transition-contemplative"
          >
            {showAll
              ? 'Show fewer'
              : `Show ${remaining} more login${remaining !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </>
  );
}
