'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';

interface BottomNavProps {
  onOpenMore: () => void;
}

interface BottomTab {
  name: string;
  href: string;
  icon3D: Icon3DName;
}

const TABS: BottomTab[] = [
  { name: 'Tổng quan', href: '/', icon3D: 'rocket' },
  { name: 'Việc', href: '/tasks', icon3D: 'tick' },
  { name: 'Mốc', href: '/timeline', icon3D: 'clock' },
  { name: 'Ghi chú', href: '/notes', icon3D: 'notebook' },
];

export default function BottomNav({ onOpenMore }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng dưới cùng"
      className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFCF7]/80 dark:bg-[#111F38]/80 backdrop-blur-xl saturate-160 border-t border-white/70 dark:border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(30,90,168,0.08),inset_0_1px_0_0_rgba(255,255,255,0.85)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)] transition-colors"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1 max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] h-[52px] py-1 px-1 rounded-2xl transition-all ${
                isActive
                  ? 'text-[#F58220] dark:text-[#F58220] font-bold bg-white/70 dark:bg-white/10 shadow-[0_2px_8px_rgba(245,130,32,0.15),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)] border border-[#F58220]/30 dark:border-[#F58220]/40'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium border border-transparent'
              }`}
            >
              <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <Icon3D name={tab.icon3D} size={22} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#F58220] shadow-[0_0_6px_#F58220]" />
                )}
              </div>
              <span className="text-[10px] leading-tight truncate mt-0.5">{tab.name}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] h-[52px] py-1 px-1 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-all cursor-pointer border border-transparent"
          aria-label="Mở thêm tính năng"
        >
          <div className="w-6 h-6 rounded-lg bg-white/70 dark:bg-white/10 border border-white/80 dark:border-white/10 flex items-center justify-center shadow-xs">
            <Menu className="w-4 h-4 text-[#1E5AA8] dark:text-blue-400" />
          </div>
          <span className="text-[10px] leading-tight truncate mt-0.5">Thêm</span>
        </button>
      </div>
    </nav>
  );
}
