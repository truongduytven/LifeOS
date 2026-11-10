'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, X, ShieldCheck } from 'lucide-react';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  user?: {
    username?: string;
    displayName?: string;
    hasVaultPin?: boolean;
  } | null;
}

interface NavItemConfig {
  name: string;
  href: string;
  icon3D: Icon3DName;
  activeClasses: string;
  badge?: string | null;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    name: 'Tổng quan',
    href: '/',
    icon3D: 'rocket',
    activeClasses: 'bg-sapphire-50 dark:bg-sapphire-950/50 text-sapphire-700 dark:text-sapphire-300 border-sapphire-200 dark:border-sapphire-800 shadow-xs',
    badge: null,
  },
  {
    name: 'Công việc & Checklist',
    href: '/tasks',
    icon3D: 'tick',
    activeClasses: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-xs',
    badge: null,
  },
  {
    name: 'Timeline & Cột mốc',
    href: '/timeline',
    icon3D: 'clock',
    activeClasses: 'bg-sunset-50 dark:bg-sunset-950/50 text-sunset-700 dark:text-sunset-300 border-sunset-200 dark:border-sunset-800 shadow-xs',
    badge: null,
  },
  {
    name: 'Ghi chú nhanh',
    href: '/notes',
    icon3D: 'notebook',
    activeClasses: 'bg-sunset-50/80 dark:bg-sunset-950/50 text-sunset-800 dark:text-sunset-300 border-sunset-200 dark:border-sunset-800 shadow-xs',
    badge: null,
  },
  {
    name: 'Bài viết & Đọc',
    href: '/articles',
    icon3D: 'bookmark',
    activeClasses: 'bg-sapphire-50/80 dark:bg-sapphire-950/50 text-sapphire-700 dark:text-sapphire-300 border-sapphire-200 dark:border-sapphire-800 shadow-xs',
    badge: null,
  },
  {
    name: 'Quản lý Tài liệu',
    href: '/documents',
    icon3D: 'folder',
    activeClasses: 'bg-sapphire-50/90 dark:bg-sapphire-950/50 text-sapphire-800 dark:text-sapphire-300 border-sapphire-200 dark:border-sapphire-800 shadow-xs',
    badge: null,
  },
  {
    name: 'Kho cá nhân (Vault)',
    href: '/vault',
    icon3D: 'lock',
    activeClasses: 'bg-sunset-100/90 dark:bg-sunset-950/60 text-sunset-800 dark:text-sunset-300 border-sunset-300 dark:border-sunset-800 shadow-xs',
    badge: 'PIN',
  },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const displayName = user?.displayName || 'Thành viên';
  const username = user?.username || 'user';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'TV';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 backdrop-blur-xl border-r border-[#1E5AA8]/15 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#1E5AA8]/15 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <Icon3D name="logo" size={38} priority />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Life</span>
                <span className="font-bold text-lg tracking-tight text-gradient-primary">OS</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 block -mt-1">
                Command Space
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-[#F5E6C8]/40 dark:hover:bg-slate-800 lg:hidden transition-colors"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar px-3 py-4 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Không gian làm việc
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                  isActive
                    ? item.activeClasses
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#F5E6C8]/40 dark:hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon3D
                    name={item.icon3D}
                    size={24}
                    className="transition-transform group-hover:scale-110 shrink-0"
                  />
                  <span className="truncate whitespace-nowrap">{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${
                      item.badge === 'PIN'
                        ? 'bg-sunset-100 dark:bg-sunset-950/50 text-sunset-800 dark:text-sunset-300 border-sunset-300 dark:border-sunset-800'
                        : 'bg-sapphire-100 dark:bg-sapphire-950/50 text-sapphire-700 dark:text-sapphire-300 border-sapphire-200 dark:border-sapphire-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick System Badge */}
        <div className="px-3.5 py-2.5 mx-3 my-2 rounded-2xl bg-gradient-to-r from-[#FAF3E3] to-[#F5E6C8]/70 dark:from-[#172A4A] dark:to-[#111F38] border border-[#1E5AA8]/15 dark:border-slate-700/60 flex items-center gap-2.5 shrink-0">
          <Icon3D name="rocket" size={26} float />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              LifeOS v2 Trực tuyến
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate whitespace-nowrap">
              Bảng màu thương hiệu & 3D Icons
            </p>
          </div>
        </div>

        {/* User Profile Card & Logout */}
        <div className="p-3 border-t border-[#1E5AA8]/15 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F5E6C8]/30 dark:hover:bg-[#172A4A]/60 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E5AA8] to-[#F58220] flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-[#1E5AA8]/20 flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate whitespace-nowrap max-w-[120px]">
                    {displayName}
                  </p>
                  <span title="Tài khoản bảo vệ">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1E5AA8] dark:text-blue-400 flex-shrink-0" />
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate whitespace-nowrap">@{username}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0"
              title="Đăng xuất"
              aria-label="Đăng xuất khỏi LifeOS"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
