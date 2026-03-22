'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, FileText, Cpu, Clock, Settings } from 'lucide-react';
import { useAssignmentStore } from '../store/assignmentStore';

const NAV = [
  { href: '/',               icon: LayoutGrid, label: 'Home' },
  { href: '/groups',         icon: Users,      label: 'My Groups' },
  { href: '/assignments',    icon: FileText,   label: 'Assignments' },
  { href: '/toolkit',        icon: Cpu,        label: "AI Teacher's Toolkit" },
  { href: '/library',        icon: Clock,      label: 'My Library' },
];

export default function Sidebar({ activeOverride }: { activeOverride?: string }) {
  const pathname = usePathname();
  const assignments = useAssignmentStore(s => s.assignments);
  const pendingCount = assignments.filter(a => a.status === 'completed').length;

  return (
    <aside className="w-[280px] min-h-screen bg-white border-r border-gray-200 rounded-r-2xl flex flex-col flex-shrink-0 p-4">
      {/* Logo */}
      <div className="px-3 pt-2 pb-5">
        <div className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-2xl shadow-sm" style={{ background: 'linear-gradient(145deg, #F08A24 5%, #D6521F 60%, #522236 100%)' }}>
            V
          </div>
          <span className="font-semibold text-[34px] leading-none text-gray-900">VedaAI</span>
        </div>
      </div>

      {/* Create Assignment Button */}
      <div className="px-3 pb-7">
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90 border-2"
          style={{ background: 'radial-gradient(circle at 50% 50%, #3C414B 0%, #20242D 62%, #161A22 100%)', borderColor: '#E86A45' }}
        >
          <span style={{ color: '#F3F4F6', fontSize: '14px' }}>✦</span>
          Create Assignment
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1 mt-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive = activeOverride
            ? activeOverride === label
            : (href === '/' ? (pathname === '/' || pathname === '/assignments') : pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon size={15} strokeWidth={1.7} />
              <span className="flex-1">{label}</span>
              {label === 'Assignments' && pendingCount > 0 && (
                <span className="text-xs font-semibold text-white px-1.5 py-0.5 rounded-full" style={{ background: '#E8500A', fontSize: '10px' }}>
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-1 mt-auto space-y-2">
        <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          <Settings size={15} strokeWidth={1.7} />
          Settings
        </Link>
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-100 rounded-2xl border border-gray-200">
          <div className="w-10 h-10 rounded-full bg-[#EBD3C8] flex items-center justify-center flex-shrink-0 overflow-hidden">
            <span className="text-lg">🐵</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">Delhi Public School</p>
            <p className="text-xs text-gray-500 truncate">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
