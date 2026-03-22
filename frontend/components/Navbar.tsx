'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, PlusCircle, Wifi, WifiOff } from 'lucide-react';
import { useAssignmentStore } from '../store/assignmentStore';

export default function Navbar() {
  const pathname = usePathname();
  const wsConnected = useAssignmentStore((s) => s.wsConnected);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/create', label: 'New Assessment', icon: PlusCircle },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-navy-700 transition-colors">
              <BookOpen size={16} className="text-amber-400" />
            </div>
            <div>
              <span className="font-display font-bold text-navy-900 text-lg leading-none">Veda</span>
              <span className="font-display font-bold text-amber-500 text-lg leading-none">AI</span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${active
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* WS Status */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${
              wsConnected
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              {wsConnected ? (
                <><Wifi size={11} /><span className="hidden sm:inline">Live</span></>
              ) : (
                <><WifiOff size={11} /><span className="hidden sm:inline">Offline</span></>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
