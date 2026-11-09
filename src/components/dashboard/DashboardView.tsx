'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Circle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import LifeOSCoreScene from '@/components/three/LifeOSCoreScene';
import Icon3D from '@/components/ui/Icon3D';
import type { DashboardStats, Task } from '@/types/lifeos';
import { useLifeOS } from '@/app/(dashboard)/layout';

export default function DashboardView() {
  const { user, threeDEnabled } = useLifeOS();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Không thể tải dữ liệu thống kê');
      const data: DashboardStats = await res.json();
      setStats(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Lỗi kết nối máy chủ');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleTask = async (task: Task) => {
    if (togglingTaskId === task.id) return;
    setTogglingTaskId(task.id);

    const newStatus: 'todo' | 'done' = task.status === 'done' ? 'todo' : 'done';

    // Optimistic update
    setStats((prev) => {
      if (!prev) return prev;
      const updatedRecentTasks: Task[] = prev.recentTasks.map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t
      );
      const isDone = newStatus === 'done';
      return {
        ...prev,
        recentTasks: updatedRecentTasks,
        tasksDone: isDone ? prev.tasksDone + 1 : Math.max(0, prev.tasksDone - 1),
        tasksPending: isDone ? Math.max(0, prev.tasksPending - 1) : prev.tasksPending + 1,
      };
    });

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Cập nhật trạng thái thất bại');
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      // Revert stats on failure
      fetchStats();
    } finally {
      setTogglingTaskId(null);
    }
  };

  const displayName = user?.displayName || 'Bạn';
  const currentDateFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const taskCompletionRate =
    stats && stats.tasksTotal > 0
      ? Math.round((stats.tasksDone / stats.tasksTotal) * 100)
      : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero Command Center Banner with Compact 3D Showcase Box */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 border border-[#1E5AA8]/15 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="relative z-10 max-w-xl flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF3E3] dark:bg-[#172A4A] border border-[#1E5AA8]/20 dark:border-slate-700 text-[#1E5AA8] dark:text-sky-300 text-xs font-semibold mb-3">
            <Icon3D name="rocket" size={18} />
            <span>Trung tâm chỉ huy trực tuyến</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Xin chào, <span className="text-gradient-primary">{displayName}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1E5AA8] dark:text-sky-400" />
            <span>{currentDateFormatted}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Không gian cá nhân hóa & Bảo mật</span>
          </p>

          {/* Quick Launch Action Shortcuts */}
          <div className="flex items-center gap-2 sm:gap-3 pt-1 overflow-x-auto custom-scrollbar pb-1">
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1E5AA8] text-white font-semibold text-xs hover:bg-[#164584] shadow-sm shadow-[#1E5AA8]/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Thêm Task</span>
            </Link>

            <Link
              href="/notes"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F5E6C8]/40 hover:bg-[#F5E6C8]/70 dark:bg-[#172A4A] dark:hover:bg-[#1E5AA8]/30 text-slate-800 dark:text-slate-200 border border-[#1E5AA8]/15 dark:border-slate-700 font-medium text-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Icon3D name="notebook" size={16} />
              <span>Ghi chú nhanh</span>
            </Link>

            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F5E6C8]/40 hover:bg-[#F5E6C8]/70 dark:bg-[#172A4A] dark:hover:bg-[#1E5AA8]/30 text-slate-800 dark:text-slate-200 border border-[#1E5AA8]/15 dark:border-slate-700 font-medium text-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Icon3D name="bookmark" size={16} />
              <span>Đọc bài viết</span>
            </Link>

            <Link
              href="/vault"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F58220]/15 hover:bg-[#F58220]/25 dark:bg-[#F58220]/20 dark:hover:bg-[#F58220]/30 text-[#BA5409] dark:text-orange-300 border border-[#F58220]/30 dark:border-orange-800/40 font-medium text-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Icon3D name="lock" size={16} />
              <span>Mở Vault</span>
            </Link>
          </div>
        </div>

        {/* Compact 3D Showcase Orb Box (Focal element, not full background) */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-gradient-to-tr from-[#FAF3E3] via-[#F5E6C8]/60 to-[#F58220]/20 dark:from-[#172A4A] dark:via-[#111F38] dark:to-[#0B1528] border border-[#1E5AA8]/20 dark:border-slate-700/60 shadow-inner flex items-center justify-center shrink-0 overflow-hidden">
          {threeDEnabled ? (
            <div className="w-full h-full">
              <LifeOSCoreScene variant="dashboard" interactive={true} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <Icon3D name="rocket" size={54} float />
              <span className="text-xs font-semibold text-slate-500 mt-2">LifeOS 3D Core</span>
            </div>
          )}
          <div className="absolute bottom-2 right-2.5 px-2 py-0.5 rounded-full bg-white/80 dark:bg-[#111F38]/90 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700 text-[10px] font-semibold text-[#1E5AA8] dark:text-sky-300 pointer-events-none flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>3D Core</span>
          </div>
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0 break-words flex-1">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="text-xs text-[#1E5AA8] dark:text-sky-400 font-medium hover:underline cursor-pointer whitespace-nowrap shrink-0"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 2. KPI Metrics Grid (Harmonious Multi-Color Bento Layout with 3D Color Icons) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Tasks (Emerald) */}
        <div className="p-4 rounded-2xl bg-[#FFFCF7] dark:bg-[#111F38] border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Công việc</span>
            <Icon3D name="tick" size={28} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '-' : stats?.tasksPending ?? 0}
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1 whitespace-nowrap truncate">
              Đang chờ / {stats?.tasksTotal ?? 0} tổng
            </p>
          </div>
        </div>

        {/* Metric 2: Notes (Sunset Orange) */}
        <div className="p-4 rounded-2xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F58220]/25 dark:border-sunset-900/40 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Ghi chú</span>
            <Icon3D name="notebook" size={28} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '-' : stats?.notesCount ?? 0}
            </div>
            <p className="text-[11px] text-[#BA5409] dark:text-orange-300 font-medium mt-1 whitespace-nowrap truncate">
              Tài liệu tư duy
            </p>
          </div>
        </div>

        {/* Metric 3: Articles (Sapphire Blue) */}
        <div className="p-4 rounded-2xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#1E5AA8]/25 dark:border-sapphire-900/40 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Bài viết</span>
            <Icon3D name="bookmark" size={28} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '-' : stats?.articlesCount ?? 0}
            </div>
            <p className="text-[11px] text-[#1E5AA8] dark:text-sky-300 font-medium mt-1 whitespace-nowrap truncate">
              {stats?.unreadArticlesCount ?? 0} chưa đọc
            </p>
          </div>
        </div>

        {/* Metric 4: Documents (Sapphire Navy) */}
        <div className="p-4 rounded-2xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#1E5AA8]/20 dark:border-sapphire-900/40 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Tài liệu</span>
            <Icon3D name="folder" size={28} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '-' : stats?.documentsCount ?? 0}
            </div>
            <p className="text-[11px] text-[#1E5AA8] dark:text-sky-300 font-medium mt-1 whitespace-nowrap truncate">
              Tệp & Liên kết
            </p>
          </div>
        </div>

        {/* Metric 5: Timeline (Sunset Orange) */}
        <div className="p-4 rounded-2xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F58220]/20 dark:border-sunset-900/40 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Cột mốc</span>
            <Icon3D name="clock" size={28} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '-' : stats?.timelineCount ?? 0}
            </div>
            <p className="text-[11px] text-[#BA5409] dark:text-orange-300 font-medium mt-1 whitespace-nowrap truncate">
              Dòng thời gian
            </p>
          </div>
        </div>

        {/* Metric 6: Vault (Sunset Glow) */}
        <div className="p-4 rounded-2xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F58220]/30 dark:border-sunset-900/40 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Kho Vault</span>
            <Icon3D name="lock" size={28} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-[#E06D0B] dark:text-orange-400">
              {loading ? '-' : stats?.vaultCount ?? 0}
            </div>
            <p className="text-[11px] text-[#BA5409] dark:text-orange-300 font-medium mt-1 whitespace-nowrap truncate">
              Bảo mật mã PIN
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Panels: Tasks & Notes / Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Quick Tasks & Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Task Check Card */}
          <div className="rounded-3xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#1E5AA8]/15 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Icon3D name="tick" size={32} />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Nhiệm vụ & Check-list gần đây
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Đánh dấu hoàn thành trực tiếp từ bảng điều khiển
                  </p>
                </div>
              </div>

              <Link
                href="/tasks"
                className="text-xs text-[#1E5AA8] dark:text-sky-400 hover:text-[#164584] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Task completion progress bar */}
            {stats && stats.tasksTotal > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-[#FAF3E3] dark:bg-[#172A4A] border border-[#1E5AA8]/15 dark:border-slate-700/50">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 whitespace-nowrap">
                    <Icon3D name="chart" size={18} />
                    Tiến độ hoàn thành
                  </span>
                  <span className="text-[#1E5AA8] dark:text-sky-300 font-bold font-mono whitespace-nowrap shrink-0">{taskCompletionRate}%</span>
                </div>
                <div className="w-full bg-[#F5E6C8]/80 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${taskCompletionRate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="bg-gradient-to-r from-emerald-500 via-[#1E5AA8] to-[#F58220] h-2 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Task list items */}
            {loading ? (
              <div className="py-8 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#1E5AA8]" />
                <span className="text-xs">Đang nạp danh sách công việc...</span>
              </div>
            ) : !stats?.recentTasks || stats.recentTasks.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-[#FAF3E3]/60 dark:bg-[#172A4A]/60 border border-dashed border-[#1E5AA8]/20 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Không có công việc nào gần đây</p>
                <p className="text-xs text-slate-500 mt-1">
                  Bắt đầu lập danh sách công việc đầu tiên của bạn
                </p>
                <Link
                  href="/tasks"
                  className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-xl bg-[#FAF3E3] dark:bg-[#172A4A] text-[#1E5AA8] dark:text-sky-300 text-xs font-semibold border border-[#1E5AA8]/25 dark:border-slate-700 hover:bg-[#F5E6C8] dark:hover:bg-[#1E5AA8]/30 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo công việc mới
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
                {stats.recentTasks.map((task) => {
                  const isDone = task.status === 'done';
                  const isBusy = togglingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`group flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                        isDone
                          ? 'bg-[#FAF3E3]/40 dark:bg-[#172A4A]/40 border-[#1E5AA8]/10 dark:border-slate-800 opacity-60'
                          : 'bg-[#FFFCF7] dark:bg-[#172A4A] border-[#1E5AA8]/15 dark:border-slate-800 hover:border-[#1E5AA8]/35 dark:hover:border-slate-700 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task)}
                          disabled={isBusy}
                          className="shrink-0 text-slate-400 hover:text-[#1E5AA8] dark:hover:text-sky-400 transition-colors cursor-pointer"
                          aria-label={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                        >
                          {isBusy ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[#1E5AA8]" />
                          ) : isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                          ) : (
                            <Circle className="w-5 h-5 hover:text-[#1E5AA8]" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold truncate min-w-0 ${
                              isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 min-w-0">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.priority && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 ${
                              task.priority === 'urgent'
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                                : task.priority === 'high'
                                ? 'bg-sunset-50 dark:bg-[#F58220]/20 text-sunset-700 dark:text-orange-300 border border-sunset-200 dark:border-orange-800/40'
                                : 'bg-[#FAF3E3] dark:bg-[#0B1528] text-slate-600 dark:text-slate-300 border border-[#1E5AA8]/15 dark:border-slate-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block whitespace-nowrap shrink-0">
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Notes Preview Grid */}
          <div className="rounded-3xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#1E5AA8]/15 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon3D name="notebook" size={30} />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Ghi chú gần nhất
                </h2>
              </div>

              <Link
                href="/notes"
                className="text-xs text-[#1E5AA8] dark:text-sky-400 hover:text-[#164584] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Đang tải ghi chú...
              </div>
            ) : !stats?.recentNotes || stats.recentNotes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Chưa có ghi chú nào được tạo.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
                {stats.recentNotes.slice(0, 4).map((note) => (
                  <Link
                    key={note.id}
                    href="/notes"
                    className="p-4 rounded-2xl bg-[#FAF3E3]/60 dark:bg-[#172A4A] border border-[#1E5AA8]/15 dark:border-slate-800 hover:border-[#F58220]/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#BA5409] dark:group-hover:text-orange-300 transition-colors truncate min-w-0">
                          {note.title || 'Ghi chú không tiêu đề'}
                        </span>
                        {note.isPinned && (
                          <span className="w-2 h-2 rounded-full bg-[#F58220] shrink-0" title="Đã ghim" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed min-w-0">
                        {note.content || 'Nội dung trống'}
                      </p>
                    </div>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {note.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-slate-700 dark:text-slate-300 bg-[#F5E6C8]/60 dark:bg-[#0B1528] px-2 py-0.5 rounded-md font-mono whitespace-nowrap shrink-0"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Upcoming Timeline & Quick Launch Cards */}
        <div className="space-y-6">
          {/* Upcoming Timeline Milestones */}
          <div className="rounded-3xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#1E5AA8]/15 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Icon3D name="clock" size={28} />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Cột mốc sắp tới
                </h2>
              </div>

              <Link
                href="/timeline"
                className="text-xs text-[#1E5AA8] dark:text-sky-400 hover:text-[#164584] font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Chi tiết
              </Link>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Đang tải sự kiện...
              </div>
            ) : !stats?.upcomingTimeline || stats.upcomingTimeline.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Chưa có sự kiện nào trong dòng thời gian.
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
                {stats.upcomingTimeline.slice(0, 5).map((event) => {
                  const eventDateStr = event.eventDate
                    ? new Intl.DateTimeFormat('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }).format(new Date(event.eventDate))
                    : 'Chưa đặt';

                  return (
                    <div
                      key={event.id}
                      className="p-3 rounded-2xl bg-[#FAF3E3]/60 dark:bg-[#172A4A] border border-[#F58220]/20 dark:border-slate-800 hover:border-[#F58220]/40 transition-all flex items-start gap-3"
                    >
                      <div className="p-1 shrink-0 mt-0.5">
                        <Icon3D name="flag" size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate min-w-0">
                          {event.title}
                        </p>
                        <p className="text-[11px] text-[#BA5409] dark:text-orange-300 font-mono mt-0.5 whitespace-nowrap">
                          {eventDateStr}
                        </p>
                        {event.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 min-w-0">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secure Vault Quick Status Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-[#FAF3E3] via-[#FFFCF7] to-[#F5E6C8]/60 dark:from-[#111F38] dark:via-[#172A4A] dark:to-[#0B1528] border border-[#F58220]/30 dark:border-orange-900/40 p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <Icon3D name="lock" size={36} float />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kho Lưu trữ Bảo mật</h3>
                <p className="text-[11px] text-[#BA5409] dark:text-orange-300 font-medium whitespace-nowrap">Bảo vệ bởi mã PIN 6 số</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Lưu trữ an toàn các khóa API bí mật, mật khẩu đăng nhập, thẻ ngân hàng và ghi chú cá nhân tuyệt mật.
            </p>

            <Link
              href="/vault"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#F58220] hover:bg-[#E06D0B] text-white shadow-sm shadow-[#F58220]/25 transition-all whitespace-nowrap shrink-0"
            >
              <span>Mở khóa Kho Vault</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
