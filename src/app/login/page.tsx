'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import Icon3D from '@/components/ui/Icon3D';

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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#FAF3E3] dark:bg-[#0B1528] overflow-hidden select-none">
      {/* Soft Brand Palette Mesh Aura Background */}
      <div className="absolute -top-36 -left-36 w-[36rem] h-[36rem] bg-[#1E5AA8]/15 dark:bg-[#1E5AA8]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -right-28 w-[32rem] h-[32rem] bg-[#F58220]/15 dark:bg-[#F58220]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 left-1/3 w-[34rem] h-[34rem] bg-[#F5E6C8]/70 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#F58220]/10 dark:bg-[#F58220]/10 rounded-full blur-3xl pointer-events-none" />

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

      {/* Glassmorphic Vanilla Cream / White Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-3xl bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(30,90,168,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-[#1E5AA8]/15 dark:border-slate-800"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, rotate: -6 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="inline-flex items-center justify-center mb-3"
          >
            <Icon3D name="logo" size={68} priority />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
            Life<span className="text-gradient-primary">OS</span>
          </h1>
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium mt-1">
            Không gian Điều hành & Quản trị Cá nhân
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên tài khoản
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F5E6C8]/25 dark:bg-[#172A4A] border border-[#1E5AA8]/20 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-[#FFFCF7] dark:focus:bg-[#111F38] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-blue-400 focus:ring-3 focus:ring-[#1E5AA8]/15 dark:focus:ring-blue-400/20 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F5E6C8]/25 dark:bg-[#172A4A] border border-[#1E5AA8]/20 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-[#FFFCF7] dark:focus:bg-[#111F38] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-blue-400 focus:ring-3 focus:ring-[#1E5AA8]/15 dark:focus:ring-blue-400/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
            className="w-full mt-3 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#1E5AA8] via-[#286EC7] to-[#F58220] hover:from-[#164584] hover:to-[#E06D0B] shadow-md shadow-[#1E5AA8]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
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
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>Bảo mật bởi mã hóa đa tầng và hệ thống Vault cá nhân</p>
        </div>
      </motion.div>
    </div>
  );
}
