'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/history', label: 'History' },
  { href: '/duel', label: 'Gold Duel' },
  { href: '/rewind', label: 'Rewind Lab' },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1" aria-label="Main">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm',
              active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
