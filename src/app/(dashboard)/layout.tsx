'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import type { User } from '@/types/lifeos';

interface LifeOSContextType {
  user: User | null;
  threeDEnabled: boolean;
  setThreeDEnabled: (enabled: boolean) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  refreshUser: () => Promise<void>;
}

const LifeOSContext = createContext<LifeOSContextType>({
  user: null,
  threeDEnabled: true,
  setThreeDEnabled: () => {},
  isDark: false,
  setIsDark: () => {},
  refreshUser: async () => {},
});

export const useLifeOS = () => useContext(LifeOSContext);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [threeDEnabled, setThreeDEnabled] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Load preferences from localStorage on mount (default: light theme, 3D widget enabled)
  useEffect(() => {
    const stored3D = localStorage.getItem('lifeos_3d_enabled');
    if (stored3D !== null) {
      setThreeDEnabled(stored3D !== 'false');
    }

    const storedTheme = localStorage.getItem('lifeos_theme');
    if (storedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [router]);

  const toggleThreeD = () => {
    setThreeDEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('lifeos_3d_enabled', String(next));
      return next;
    });
  };

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        localStorage.setItem('lifeos_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('lifeos_theme', 'light');
      }
      return next;
    });
  };

  return (
    <LifeOSContext.Provider
      value={{
        user,
        threeDEnabled,
        setThreeDEnabled,
        isDark,
        setIsDark,
        refreshUser: fetchCurrentUser,
      }}
    >
      <div className="relative min-h-screen bg-[#FAF3E3] dark:bg-[#0B1528] text-foreground flex">
        {/* Soft, Harmonious Brand Palette Aura Background Orbs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] bg-[#1E5AA8]/12 dark:bg-[#1E5AA8]/20 rounded-full blur-3xl" />
          <div className="absolute top-1/4 -right-32 w-[32rem] h-[32rem] bg-[#F58220]/15 dark:bg-[#F58220]/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 w-[38rem] h-[38rem] bg-[#F5E6C8]/70 dark:bg-amber-950/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#F58220]/10 dark:bg-[#F58220]/10 rounded-full blur-3xl" />
        </div>

        {/* Sidebar */}
        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          user={user}
        />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-72 relative z-10 transition-all">
          <Header
            onOpenMobile={() => setMobileOpen(true)}
            threeDEnabled={threeDEnabled}
            onToggleThreeD={toggleThreeD}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            user={user}
          />

          {/* Main View Area with Mobile Safe Bottom Padding */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-32 lg:pb-8">
            {children}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <BottomNav onOpenMore={() => setMobileOpen(true)} />
        </div>
      </div>
    </LifeOSContext.Provider>
  );
}
