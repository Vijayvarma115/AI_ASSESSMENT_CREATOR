'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, LayoutGrid, Bell } from 'lucide-react';

interface Props {
  title?: string;
  showBack?: boolean;
}

export default function TopBar({ title = 'Assignment', showBack = false }: Props) {
  const router = useRouter();
  return (
    <div className="h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-between px-5 md:px-6 flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-2.5 text-sm text-gray-600">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <LayoutGrid size={14} className="text-gray-400" />
        <span className="font-medium text-gray-700">{title}</span>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button className="relative w-12 h-12 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Bell size={24} className="text-gray-800" strokeWidth={2} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#FF5A24] rounded-full" />
        </button>

        <div className="h-12 pl-2 pr-3 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center gap-2.5 min-w-[210px]">
          <div className="w-10 h-10 rounded-full bg-[#EBD3C8] flex items-center justify-center overflow-hidden text-xl">
            🐵
          </div>
          <span className="text-[18px] leading-none text-gray-800 font-semibold tracking-tight">John Doe</span>
          <ChevronDown size={22} className="text-gray-700 ml-auto" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}
