import Link from 'next/link';
import { useRouter } from 'next/router';
import ConnectionStatus from './ConnectionStatus';

export default function Navbar({ socketStatus }) {
  const router = useRouter();

  const navLink = (href, label) => (
    <Link
      href={href}
      className={`
        text-sm font-medium px-3 py-1.5 rounded-lg transition-all
        ${router.pathname === href
          ? 'bg-brand-500/15 text-brand-400'
          : 'text-gray-400 hover:text-white hover:bg-surface-hover'}
      `}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-xl font-display font-extrabold tracking-tight text-white">
            Sync<span className="text-brand-400">Up</span>
          </span>
          <span className="hidden sm:block text-xs text-gray-600 border border-surface-border px-1.5 py-0.5 rounded">
            Coaching Feed
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navLink('/', 'Feed')}
          {navLink('/admin', 'Admin')}
        </nav>

        {/* Status */}
        <ConnectionStatus status={socketStatus} />
      </div>
    </header>
  );
}
