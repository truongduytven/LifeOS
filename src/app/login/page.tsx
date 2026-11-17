'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import Icon3D from '@/components/ui/Icon3D';
import GlassCard from '@/components/ui/GlassCard';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
      }

      // Success -> navigate to dashboard
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã xảy ra lỗi không xác định.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#FAF3E3] dark:bg-[#0B1528] overflow-hidden select-none">
      {/* Ambient Sapphire & Sunset Refraction Glow Orbs behind the Glass (Hidden in Dark Mode) */}
      <div className="dark:hidden">
        <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-[#1E5AA8]/20 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-1/4 -right-24 w-[30rem] h-[30rem] bg-[#F58220]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-[32rem] h-[32rem] bg-[#F5E6C8]/80 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-8 right-1/4 w-80 h-80 bg-[#1E5AA8]/15 rounded-full blur-[90px] pointer-events-none" />
      </div>

      {/* Floating 3D Color Icons around the viewport */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hidden lg:block absolute top-16 left-20">
          <Icon3D name="rocket" size={72} float />
        </div>
        <div className="hidden lg:block absolute top-20 right-24">
          <Icon3D name="star" size={64} float />
        </div>
        <div className="hidden lg:block absolute bottom-20 left-28">
          <Icon3D name="shield" size={68} float />
        </div>
        <div className="hidden lg:block absolute bottom-16 right-32">
          <Icon3D name="key" size={60} float />
        </div>
      </div>

      {/* Glassmorphic Frosted Card with 3D Subtle Tilt & Luminous Glow */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <GlassCard
          tilt={true}
          glowColor="sapphire"
          padding="p-6 sm:p-10"
          className="shadow-[0_24px_70px_-15px_rgba(30,90,168,0.18)] dark:shadow-[0_28px_80px_-15px_rgba(0,0,0,0.7)]"
        >
          {/* Brand Header with 3D LifeOS Focal Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.85, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 14 }}
              className="relative inline-flex items-center justify-center mb-3.5 p-2 rounded-2xl bg-gradient-to-tr from-[#1E5AA8]/10 via-white/50 to-[#F58220]/15 dark:from-[#1E5AA8]/25 dark:via-[#172A4A] dark:to-[#F58220]/25 shadow-inner border border-white/60 dark:border-white/10"
            >
              <Icon3D name="logo" size={72} priority />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
              Life<span className="text-gradient-primary">OS</span>
            </h1>
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Không gian Điều hành & Quản trị Cá nhân
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 backdrop-blur-md shadow-xs"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Tên tài khoản
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/70 dark:bg-[#172A4A]/80 border border-[#1E5AA8]/20 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#111F38] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-4 focus:ring-[#1E5AA8]/15 transition-all shadow-inner backdrop-blur-md"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/70 dark:bg-[#172A4A]/80 border border-[#1E5AA8]/20 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#111F38] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-4 focus:ring-[#1E5AA8]/15 transition-all shadow-inner backdrop-blur-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-4 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-[#1E5AA8] via-[#286EC7] to-[#F58220] hover:from-[#164584] hover:to-[#E06D0B] shadow-lg shadow-[#1E5AA8]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực thông tin...</span>
                </>
              ) : (
                <>
                  <span>Truy cập LifeOS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Note */}
          <div className="mt-8 pt-5 border-t border-slate-200/60 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1E5AA8] dark:text-sky-400 shrink-0" />
            <span>Bảo mật bởi mã hóa đa tầng và hệ thống Vault cá nhân</span>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
