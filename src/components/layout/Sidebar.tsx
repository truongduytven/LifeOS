'use client';

import React, { useEffect } from 'react';
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
    activeClasses: 'bg-white/85 dark:bg-sapphire-950/70 text-sapphire-700 dark:text-sapphire-200 border-sapphire-300/70 dark:border-sapphire-600/60 shadow-[0_4px_14px_rgba(30,90,168,0.12),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.15)] font-semibold',
    badge: null,
  },
  {
    name: 'Công việc & Checklist',
    href: '/tasks',
    icon3D: 'tick',
    activeClasses: 'bg-white/85 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300/70 dark:border-emerald-600/60 shadow-[0_4px_14px_rgba(16,185,129,0.12),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.15)] font-semibold',
    badge: null,
  },
  {
    name: 'Timeline & Cột mốc',
    href: '/timeline',
    icon3D: 'clock',
    activeClasses: 'bg-white/85 dark:bg-sunset-950/70 text-sunset-800 dark:text-sunset-200 border-sunset-300/70 dark:border-sunset-600/60 shadow-[0_4px_14px_rgba(245,130,32,0.14),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.15)] font-semibold',
    badge: null,
  },
  {
    name: 'Ghi chú nhanh',
    href: '/notes',
    icon3D: 'notebook',
    activeClasses: 'bg-white/85 dark:bg-sunset-950/70 text-sunset-800 dark:text-sunset-200 border-sunset-300/70 dark:border-sunset-600/60 shadow-[0_4px_14px_rgba(245,130,32,0.14),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.15)] font-semibold',
    badge: null,
  },
  {
    name: 'Bài viết & Đọc',
    href: '/articles',
    icon3D: 'bookmark',
    activeClasses: 'bg-white/85 dark:bg-sapphire-950/70 text-sapphire-700 dark:text-sapphire-200 border-sapphire-300/70 dark:border-sapphire-600/60 shadow-[0_4px_14px_rgba(30,90,168,0.12),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.15)] font-semibold',
    badge: null,
  },
  {
    name: 'Quản lý Tài liệu',
    href: '/documents',
    icon3D: 'folder',
    activeClasses: 'bg-white/85 dark:bg-sapphire-950/70 text-sapphire-800 dark:text-sapphire-200 border-sapphire-300/70 dark:border-sapphire-600/60 shadow-[0_4px_14px_rgba(30,90,168,0.12),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.15)] font-semibold',
    badge: null,
  },
  {
    name: 'Kho cá nhân (Vault)',
    href: '/vault',
    icon3D: 'lock',
    activeClasses: 'bg-white/85 dark:bg-sunset-950/80 text-sunset-800 dark:text-sunset-200 border-sunset-300/70 dark:border-sunset-600/60 shadow-[0_4px_14px_rgba(245,130,32,0.16),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.15)] font-semibold',
    badge: 'PIN',
  },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Close mobile drawer on Escape key press
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

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
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-md lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col bg-[#FFFCF7]/80 dark:bg-[#111F38]/80 backdrop-blur-xl saturate-160 border-r border-white/70 dark:border-white/10 text-slate-800 dark:text-slate-100 shadow-[0_10px_30px_-5px_rgba(30,90,168,0.06),inset_-1px_0_0_0_rgba(255,255,255,0.7)] dark:shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.08)] transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#1E5AA8]/12 dark:border-white/10">
          <Link href="/" onClick={onCloseMobile} className="flex items-center gap-3 group">
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
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-[#F5E6C8]/40 dark:hover:bg-slate-800 lg:hidden transition-colors"
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
                className={`group flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all border ${
                  isActive
                    ? item.activeClasses
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 border-transparent'
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
        <div className="px-3.5 py-2.5 mx-3 my-2 rounded-2xl bg-gradient-to-r from-white/75 to-[#F5E6C8]/60 dark:from-[#172A4A]/80 dark:to-[#111F38]/80 border border-white/80 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex items-center gap-2.5 shrink-0">
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
        <div className="p-3 border-t border-[#1E5AA8]/12 dark:border-white/10 shrink-0">
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
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0"
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
