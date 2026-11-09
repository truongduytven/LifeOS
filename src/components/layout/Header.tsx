'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Sun,
  Moon,
  Box,
  Search,
  Command,
} from 'lucide-react';
import Icon3D from '@/components/ui/Icon3D';

interface HeaderProps {
  onOpenMobile?: () => void;
  threeDEnabled: boolean;
  onToggleThreeD: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  user?: {
    username?: string;
    displayName?: string;
  } | null;
}

export default function Header({
  onOpenMobile,
  threeDEnabled,
  onToggleThreeD,
  isDark,
  onToggleTheme,
  user,
}: HeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickNav = (url: string) => {
    setSearchOpen(false);
    router.push(url);
  };

  const displayName = user?.displayName || 'Thành viên';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'TV';

  return (
    <>
      <header className="sticky top-0 z-30 h-16 w-full bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 backdrop-blur-xl border-b border-[#1E5AA8]/15 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
        {/* Left: Mobile hamburger menu & Quick Search Trigger */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobile}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#F5E6C8]/40 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#172A4A] lg:hidden transition-colors shrink-0"
            aria-label="Mở bảng điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F5E6C8]/30 dark:bg-[#172A4A] border border-[#1E5AA8]/15 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs w-60 lg:w-72 justify-between cursor-pointer group transition-all shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-[#1E5AA8] dark:text-blue-400 transition-colors shrink-0" />
              <span className="truncate whitespace-nowrap">Tìm kiếm & Lệnh nhanh...</span>
            </div>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-[#1E5AA8]/20 dark:border-slate-600 shadow-2xs shrink-0">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 3D Focal Widget Toggle */}
          <button
            onClick={onToggleThreeD}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap shrink-0 ${
              threeDEnabled
                ? 'bg-sapphire-50 text-sapphire-700 border-sapphire-200 dark:bg-sapphire-950/60 dark:text-blue-300 dark:border-blue-800'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-[#172A4A] dark:text-slate-400 dark:border-slate-700'
            }`}
            title={threeDEnabled ? 'Tắt widget 3D' : 'Bật widget 3D'}
            aria-label="Chuyển đổi widget 3D"
          >
            <Box className={`w-3.5 h-3.5 shrink-0 ${threeDEnabled ? 'text-[#1E5AA8] dark:text-blue-400' : 'opacity-60'}`} />
            <span className="hidden sm:inline">3D {threeDEnabled ? 'Bật' : 'Tắt'}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-[#F5E6C8]/40 dark:bg-[#172A4A] border border-[#1E5AA8]/15 dark:border-slate-700/80 transition-colors shrink-0"
            title={isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
            aria-label="Chuyển đổi giao diện sáng tối"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#F58220]" /> : <Moon className="w-4 h-4 text-[#1E5AA8]" />}
          </button>

          {/* User Badge */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#1E5AA8]/15 dark:border-slate-800 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1E5AA8] to-[#F58220] flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-[#1E5AA8]/20 shrink-0">
              {initials}
            </div>
            <div className="hidden md:block text-left min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[150px] whitespace-nowrap">
                {displayName}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Trực tuyến
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Command / Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            onClick={() => setSearchOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#1E5AA8]/20 dark:border-slate-800 p-4 shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100">
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E5AA8] dark:text-sky-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên trang hoặc tác vụ..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FAF3E3] dark:bg-[#172A4A] border border-[#1E5AA8]/20 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] dark:focus:ring-sky-500"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5E6C8]/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                ESC
              </button>
            </div>

            <div className="space-y-1 text-xs max-h-[60vh] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Truy cập nhanh
              </div>
              <button
                onClick={() => quickNav('/tasks')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-[#172A4A] text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Icon3D name="tick" size={20} />
                  <span className="font-medium">Quản lý Công việc & Checklist</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/tasks</span>
              </button>

              <button
                onClick={() => quickNav('/timeline')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-[#172A4A] text-slate-700 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Icon3D name="clock" size={20} />
                  <span className="font-medium">Dòng thời gian & Cột mốc</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/timeline</span>
              </button>

              <button
                onClick={() => quickNav('/notes')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-[#172A4A] text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-300 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Icon3D name="notebook" size={20} />
                  <span className="font-medium">Xem & Tạo Ghi chú nhanh</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/notes</span>
              </button>

              <button
                onClick={() => quickNav('/articles')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-[#172A4A] text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Icon3D name="bookmark" size={20} />
                  <span className="font-medium">Kho Bài viết & Chế độ Đọc</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/articles</span>
              </button>

              <button
                onClick={() => quickNav('/vault')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-[#172A4A] text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Icon3D name="lock" size={20} />
                  <span className="font-medium">Mở Kho bảo mật (PIN Vault)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/vault</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
