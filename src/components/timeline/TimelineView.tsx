'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import type { TimelineEvent, Task } from '@/types/lifeos';

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// Category Configuration with 3D Icons & Brand Colors + Dark Mode
export const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    icon3d: string;
    color: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    badgeActive: string;
  }
> = {
  milestone: {
    label: 'Cột mốc',
    icon3d: '/icons/3d/flag.png',
    color: '#8b5cf6', // violet
    bgClass: 'bg-violet-50 dark:bg-violet-950/50',
    borderClass: 'border-violet-200 dark:border-violet-800/60',
    textClass: 'text-violet-700 dark:text-violet-300',
    badgeActive: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/60 dark:text-violet-200 dark:border-violet-700 font-semibold shadow-xs',
  },
  work: {
    label: 'Công việc',
    icon3d: '/icons/3d/target.png',
    color: '#1E5AA8', // Sapphire Blue
    bgClass: 'bg-[#EFF6FF] dark:bg-blue-950/50',
    borderClass: 'border-[#1E5AA8]/30 dark:border-[#1E5AA8]/50',
    textClass: 'text-[#1E5AA8] dark:text-sky-300',
    badgeActive: 'bg-[#1E5AA8] text-white border-[#1E5AA8] dark:bg-[#1E5AA8] dark:text-white dark:border-[#1E5AA8] font-semibold shadow-xs',
  },
  personal: {
    label: 'Cá nhân',
    icon3d: '/icons/3d/calendar.png',
    color: '#10b981', // emerald
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderClass: 'border-emerald-200 dark:border-emerald-800/60',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    badgeActive: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700 font-semibold shadow-xs',
  },
  idea: {
    label: 'Ý tưởng',
    icon3d: '/icons/3d/bulb.png',
    color: '#F58220', // Sunset Orange
    bgClass: 'bg-[#FFF7ED] dark:bg-amber-950/50',
    borderClass: 'border-[#F58220]/30 dark:border-[#F58220]/50',
    textClass: 'text-[#F58220] dark:text-amber-300',
    badgeActive: 'bg-[#F58220] text-white border-[#F58220] dark:bg-[#F58220] dark:text-white dark:border-[#F58220] font-semibold shadow-xs',
  },
  achievement: {
    label: 'Thành tựu',
    icon3d: '/icons/3d/rocket.png',
    color: '#e11d48', // rose
    bgClass: 'bg-rose-50 dark:bg-rose-950/50',
    borderClass: 'border-rose-200 dark:border-rose-800/60',
    textClass: 'text-rose-700 dark:text-rose-300',
    badgeActive: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-700 font-semibold shadow-xs',
  },
  tasks: {
    label: 'Công việc liên kết',
    icon3d: '/icons/3d/tick.png',
    color: '#1E5AA8', // Sapphire Blue
    bgClass: 'bg-[#FAF3E3] dark:bg-[#111F38]',
    borderClass: 'border-[#F5E6C8] dark:border-slate-800',
    textClass: 'text-[#1E5AA8] dark:text-sky-300',
    badgeActive: 'bg-[#F5E6C8] text-slate-800 border-[#F5E6C8] dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 font-semibold shadow-xs',
  },
};

// Preset colors for creation featuring Sunset Orange & Sapphire Blue
const COLOR_PRESETS = [
  { name: 'Sapphire Blue', hex: '#1E5AA8' },
  { name: 'Sunset Orange', hex: '#F58220' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Sky', hex: '#0284c7' },
  { name: 'Amber', hex: '#d97706' },
];

// Unified Timeline Item representation
interface UnifiedItem {
  id: string; // `event-${id}` or `task-${id}`
  originalId: number;
  type: 'event' | 'task';
  title: string;
  description: string;
  date: Date;
  dateString: string;
  category: 'milestone' | 'work' | 'personal' | 'idea' | 'achievement' | 'tasks';
  color: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  subtasksCount?: { done: number; total: number };
}

// Relative date formatter
function formatTimelineDate(date: Date): { formatted: string; relative: string; isPast: boolean } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const dayFormatted = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

  let relative = '';
  if (diffDays === 0) relative = 'Hôm nay';
  else if (diffDays === 1) relative = 'Ngày mai';
  else if (diffDays === -1) relative = 'Hôm qua';
  else if (diffDays > 1 && diffDays <= 30) relative = `Còn ${diffDays} ngày`;
  else if (diffDays < -1 && diffDays >= -30) relative = `${Math.abs(diffDays)} ngày trước`;
  else if (diffDays > 30) relative = `Trong ${Math.round(diffDays / 30)} tháng`;
  else relative = `${Math.round(Math.abs(diffDays) / 30)} tháng trước`;

  return {
    formatted: dayFormatted,
    relative,
    isPast: diffDays < 0,
  };
}

export default function TimelineView() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and view toggles
  const [mergeTasks, setMergeTasks] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [modalCategory, setModalCategory] = useState<
    'milestone' | 'work' | 'personal' | 'idea' | 'achievement'
  >('milestone');
  const [modalColor, setModalColor] = useState('#1E5AA8');
  const [modalCompleted, setModalCompleted] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  // Native Dialog Ref
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Fetch timeline events & tasks
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError(null);

    try {
      const [eventsRes, tasksRes] = await Promise.all([
        fetch('/api/timeline'),
        fetch('/api/tasks'),
      ]);

      if (!eventsRes.ok) throw new Error('Không thể tải các sự kiện timeline');
      const eventsData = await eventsRes.json();
      const eventsList: TimelineEvent[] = Array.isArray(eventsData)
        ? eventsData
        : eventsData.events || [];
      setEvents(eventsList);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const tasksList: Task[] = Array.isArray(tasksData)
          ? tasksData
          : tasksData.tasks || [];
        setTasks(tasksList);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi nạp dữ liệu timeline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Synchronize modal state with native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isModalOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isModalOpen]);

  const handleDialogClose = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
  };

  const handleDialogBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      const isOutside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;
      if (isOutside) {
        setIsModalOpen(false);
        setEditingEventId(null);
      }
    }
  };

  // Convert raw events and tasks into Unified Timeline items
  const unifiedItems: UnifiedItem[] = useMemo(() => {
    const list: UnifiedItem[] = [];

    // Add Timeline Events
    events.forEach((ev) => {
      const d = new Date(ev.eventDate);
      list.push({
        id: `event-${ev.id}`,
        originalId: ev.id,
        type: 'event',
        title: ev.title,
        description: ev.description || '',
        date: isNaN(d.getTime()) ? new Date() : d,
        dateString: ev.eventDate,
        category: ev.category,
        color: ev.color || CATEGORY_CONFIG[ev.category]?.color || '#1E5AA8',
        completed: Boolean(ev.completed),
      });
    });

    // Merge Tasks with Due Date if toggle enabled
    if (mergeTasks) {
      tasks.forEach((t) => {
        if (t.dueDate) {
          const d = new Date(t.dueDate);
          const totalSubs = t.subtasks?.length || 0;
          const doneSubs = t.subtasks?.filter((s) => s.completed).length || 0;

          list.push({
            id: `task-${t.id}`,
            originalId: t.id,
            type: 'task',
            title: t.title,
            description: t.description || '',
            date: isNaN(d.getTime()) ? new Date() : d,
            dateString: t.dueDate,
            category: 'tasks',
            color: '#1E5AA8',
            completed: t.status === 'done',
            priority: t.priority,
            tags: t.tags,
            subtasksCount: totalSubs > 0 ? { done: doneSubs, total: totalSubs } : undefined,
          });
        }
      });
    }

    // Sort by date
    list.sort((a, b) => {
      const timeA = a.date.getTime();
      const timeB = b.date.getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return list;
  }, [events, tasks, mergeTasks, sortOrder]);

  // Filter unified items
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      // Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Status
      if (selectedStatus === 'completed' && !item.completed) return false;
      if (selectedStatus === 'upcoming' && item.completed) return false;

      return true;
    });
  }, [unifiedItems, searchQuery, selectedCategory, selectedStatus]);

  // Group items by Year or Month for structured visual timeline
  const groupedTimeline = useMemo(() => {
    const groups: { label: string; items: UnifiedItem[] }[] = [];
    const groupMap = new Map<string, UnifiedItem[]>();

    filteredItems.forEach((item) => {
      const monthNames = [
        'Tháng 1',
        'Tháng 2',
        'Tháng 3',
        'Tháng 4',
        'Tháng 5',
        'Tháng 6',
        'Tháng 7',
        'Tháng 8',
        'Tháng 9',
        'Tháng 10',
        'Tháng 11',
        'Tháng 12',
      ];
      const key = `${monthNames[item.date.getMonth()]}, ${item.date.getFullYear()}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(item);
    });

    groupMap.forEach((items, label) => {
      groups.push({ label, items });
    });

    return groups;
  }, [filteredItems]);

  // Metrics summary
  const metrics = useMemo(() => {
    const totalEvents = events.length;
    const completedEvents = events.filter((e) => e.completed).length;
    const upcomingEvents = totalEvents - completedEvents;
    const taskCount = tasks.filter((t) => Boolean(t.dueDate)).length;

    return { totalEvents, completedEvents, upcomingEvents, taskCount };
  }, [events, tasks]);

  // Toggle item completion (Optimistic)
  const handleToggleItem = async (item: UnifiedItem) => {
    const nextCompleted = !item.completed;

    if (item.type === 'event') {
      const prevEvents = [...events];
      setEvents((prev) =>
        prev.map((e) => (e.id === item.originalId ? { ...e, completed: nextCompleted } : e))
      );

      try {
        const res = await fetch(`/api/timeline/${item.originalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: nextCompleted }),
        });
        if (!res.ok) throw new Error('Cập nhật trạng thái sự kiện thất bại');
        const data = await res.json();
        const updated: TimelineEvent = data.event || data;
        setEvents((prev) => prev.map((e) => (e.id === item.originalId ? updated : e)));
      } catch (err: any) {
        setEvents(prevEvents);
        setError(err.message || 'Lỗi lưu trạng thái sự kiện');
      }
    } else {
      // It's a task!
      const prevTasks = [...tasks];
      const nextStatus: 'done' | 'todo' = nextCompleted ? 'done' : 'todo';
      const completedAt = nextCompleted ? new Date().toISOString() : null;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === item.originalId ? { ...t, status: nextStatus, completedAt } : t
        )
      );

      try {
        const res = await fetch(`/api/tasks/${item.originalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus, completedAt }),
        });
        if (!res.ok) throw new Error('Cập nhật task thất bại');
        const data = await res.json();
        const updated: Task = data.task || data;
        setTasks((prev) => prev.map((t) => (t.id === item.originalId ? updated : t)));
      } catch (err: any) {
        setTasks(prevTasks);
        setError(err.message || 'Lỗi cập nhật task');
      }
    }
  };

  // Delete Timeline Event
  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) return;

    const prevEvents = [...events];
    setEvents((prev) => prev.filter((e) => e.id !== eventId));

    try {
      const res = await fetch(`/api/timeline/${eventId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa sự kiện thất bại');
    } catch (err: any) {
      setEvents(prevEvents);
      setError(err.message || 'Không thể xóa sự kiện');
    }
  };

  // Open Modal for Create or Edit
  const openCreateModal = () => {
    setEditingEventId(null);
    setModalTitle('');
    setModalDescription('');
    const now = new Date();
    setModalDate(now.toISOString().slice(0, 10));
    setModalCategory('milestone');
    setModalColor('#1E5AA8');
    setModalCompleted(false);
    setIsModalOpen(true);
  };

  const openEditModal = (event: TimelineEvent) => {
    setEditingEventId(event.id);
    setModalTitle(event.title);
    setModalDescription(event.description || '');
    setModalDate(event.eventDate ? event.eventDate.slice(0, 10) : '');
    setModalCategory(event.category);
    setModalColor(event.color || CATEGORY_CONFIG[event.category]?.color || '#1E5AA8');
    setModalCompleted(Boolean(event.completed));
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalDate || modalSaving) return;

    setModalSaving(true);
    setError(null);

    const payload = {
      title: modalTitle.trim(),
      description: modalDescription.trim(),
      eventDate: new Date(modalDate).toISOString(),
      category: modalCategory,
      color: modalColor,
      completed: modalCompleted,
    };

    try {
      if (editingEventId) {
        const res = await fetch(`/api/timeline/${editingEventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Không thể cập nhật sự kiện');
        const data = await res.json();
        const updated: TimelineEvent = data.event || data;
        setEvents((prev) => prev.map((e) => (e.id === editingEventId ? updated : e)));
      } else {
        const res = await fetch('/api/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Không thể thêm sự kiện mới');
        const data = await res.json();
        const created: TimelineEvent = data.event || data;
        setEvents((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
      setEditingEventId(null);
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu sự kiện timeline');
    } finally {
      setModalSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics bar: Vanilla Cream & Sapphire Blue / Sunset Orange Hero with Dark Mode */}
      <div className="bg-gradient-to-r from-[#FAF3E3]/95 via-[#F5E6C8]/60 to-[#EFF6FF]/90 dark:from-[#0C1E38]/90 dark:via-[#111F38]/80 dark:to-[#0B1528]/95 border border-[#F5E6C8] dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xs">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#F58220]/15 dark:bg-[#F58220]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#1E5AA8]/15 dark:bg-[#1E5AA8]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs uppercase font-mono tracking-widest text-[#1E5AA8] dark:text-sky-300 font-bold bg-[#1E5AA8]/10 dark:bg-[#1E5AA8]/20 border border-[#1E5AA8]/20 dark:border-[#1E5AA8]/40 px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                Dòng thời gian trực quan
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F58220] shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Visual Journey & Milestones</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <img
                src="/icons/3d/clock.png"
                alt="Timeline Clock"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-md hover:scale-110 hover:-rotate-6 transition-transform duration-300 shrink-0"
              />
              <span className="min-w-0 break-words">Timeline & Cột mốc Sự nghiệp</span>
              {refreshing && <RefreshCw className="w-5 h-5 text-[#1E5AA8] dark:text-sky-400 animate-spin shrink-0" />}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              Hợp nhất các cột mốc quan trọng, dự án, mục tiêu cá nhân và hạn chót công việc vào một dòng thời gian thống nhất.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-2 rounded-xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 text-center shadow-xs flex items-center gap-2 whitespace-nowrap shrink-0">
                <img
                  src="/icons/3d/calendar.png"
                  alt="Events"
                  className="w-5 h-5 object-contain drop-shadow-2xs shrink-0"
                />
                <div className="text-left">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap">Sự kiện</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{metrics.totalEvents}</div>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F58220]/30 dark:border-[#F58220]/40 text-center shadow-xs flex items-center gap-2 whitespace-nowrap shrink-0">
                <img
                  src="/icons/3d/rocket.png"
                  alt="Completed"
                  className="w-5 h-5 object-contain drop-shadow-2xs shrink-0"
                />
                <div className="text-left">
                  <div className="text-[10px] text-[#F58220] dark:text-amber-400 uppercase tracking-wider font-bold whitespace-nowrap shrink-0">Đã đạt được</div>
                  <div className="text-sm font-bold text-[#F58220] dark:text-amber-400 leading-tight">{metrics.completedEvents}</div>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#1E5AA8]/25 dark:border-[#1E5AA8]/40 text-center shadow-xs flex items-center gap-2 whitespace-nowrap shrink-0">
                <img
                  src="/icons/3d/clock.png"
                  alt="Upcoming"
                  className="w-5 h-5 object-contain drop-shadow-2xs shrink-0"
                />
                <div className="text-left">
                  <div className="text-[10px] text-[#1E5AA8] dark:text-sky-300 uppercase tracking-wider font-bold whitespace-nowrap shrink-0">Sắp tới</div>
                  <div className="text-sm font-bold text-[#1E5AA8] dark:text-sky-300 leading-tight">{metrics.upcomingEvents}</div>
                </div>
              </div>
            </div>

            {/* Add Event Button: Sunset Orange Primary CTA */}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F58220] hover:bg-[#e06d0b] text-white font-medium text-sm shadow-md shadow-[#F58220]/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Thêm sự kiện</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-200 text-sm flex items-center justify-between shadow-xs">
          <span className="min-w-0 break-words">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-300 p-1 rounded-lg shrink-0"
            aria-label="Đóng lỗi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Bar: Filters, Merge Toggle, Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Category Pills: Smooth Horizontal Touch Roll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs custom-scrollbar overscroll-contain snap-x touch-pan-x w-full">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 snap-start',
              selectedCategory === 'all'
                ? 'bg-[#1E5AA8] text-white border border-[#1E5AA8] shadow-xs font-bold'
                : 'bg-[#FFFCF7] text-slate-600 hover:bg-[#FAF3E3] border border-[#F5E6C8] dark:bg-[#111F38] dark:text-slate-300 dark:hover:bg-[#152544] dark:border-slate-800'
            )}
          >
            Tất cả
          </button>

          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(isSelected ? 'all' : key)}
                className={cn(
                  'px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 snap-start flex items-center gap-1.5 border',
                  isSelected
                    ? config.badgeActive
                    : 'bg-[#FFFCF7] text-slate-600 hover:bg-[#FAF3E3] border-[#F5E6C8] dark:bg-[#111F38] dark:text-slate-300 dark:hover:bg-[#152544] dark:border-slate-800 shadow-2xs'
                )}
              >
                <img
                  src={config.icon3d}
                  alt={config.label}
                  className="w-3.5 h-3.5 object-contain shrink-0"
                />
                <span className="whitespace-nowrap">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search, Status & Merge Tasks Switch */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Merge Tasks Toggle */}
          <button
            onClick={() => setMergeTasks((prev) => !prev)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shadow-xs whitespace-nowrap shrink-0',
              mergeTasks
                ? 'bg-[#EFF6FF] text-[#1E5AA8] border-[#1E5AA8]/40 dark:bg-blue-950/60 dark:text-sky-300 dark:border-[#1E5AA8]/60 font-bold'
                : 'bg-[#FFFCF7] text-slate-600 border-[#F5E6C8] hover:bg-[#FAF3E3] dark:bg-[#111F38] dark:text-slate-300 dark:border-slate-800 dark:hover:bg-[#152544]'
            )}
            title="Hiển thị hoặc ẩn các công việc có hạn chót trên dòng thời gian"
          >
            <img
              src="/icons/3d/tick.png"
              alt="Tasks"
              className="w-3.5 h-3.5 object-contain shrink-0"
            />
            <span className="whitespace-nowrap">Kết hợp Tasks ({metrics.taskCount})</span>
            <span
              className={cn(
                'w-2 h-2 rounded-full transition-colors shrink-0',
                mergeTasks ? 'bg-[#1E5AA8] dark:bg-sky-400 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
              )}
            />
          </button>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl text-xs bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 shadow-xs whitespace-nowrap shrink-0"
            aria-label="Lọc theo trạng thái"
          >
            <option value="all">Tất cả tiến độ</option>
            <option value="upcoming">Sắp tới / Đang chờ</option>
            <option value="completed">Đã hoàn thành</option>
          </select>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-1.5 rounded-xl text-xs bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Đổi thứ tự thời gian"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="whitespace-nowrap">{sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}</span>
          </button>

          {/* Search Box */}
          <div className="relative min-w-[170px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm sự kiện..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/20 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchData(false)}
            disabled={refreshing}
            className="p-1.5 rounded-xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#1E5AA8] dark:hover:text-sky-300 shadow-xs transition-colors whitespace-nowrap shrink-0"
            title="Tải lại timeline"
            aria-label="Tải lại timeline"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin text-[#1E5AA8] dark:text-sky-400')} />
          </button>
        </div>
      </div>

      {/* Main Timeline Stream: Smooth Vertical Scrolling */}
      {loading ? (
        <div className="bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-[#1E5AA8] dark:text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Đang đồng bộ hóa dòng thời gian...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-[#FFFCF7] dark:bg-[#111F38] border-2 border-dashed border-[#F5E6C8] dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <img
            src="/icons/3d/flag.png"
            alt="No Events"
            className="w-16 h-16 mx-auto mb-3 drop-shadow-md hover:scale-110 hover:-rotate-3 transition-transform duration-300"
          />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Chưa có sự kiện nào</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'Không có mục nào phù hợp với bộ lọc hiện tại.'
              : 'Hãy ghi lại cột mốc đầu tiên trong hành trình của bạn!'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-[#F58220] hover:bg-[#e06d0b] text-white text-xs font-medium inline-flex items-center gap-2 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">Tạo cột mốc mới</span>
          </button>
        </div>
      ) : (
        /* Vertical Animated Timeline Track with Brand Sunset Orange & Sapphire Blue Spine and Smooth Vertical Scroll */
        <div className="max-h-[75vh] overflow-y-auto overscroll-contain custom-scrollbar pr-2 space-y-8 relative">
          {groupedTimeline.map((group) => (
            <div key={group.label} className="space-y-4">
              {/* Group Header Badge (Month / Year) */}
              <div className="sticky top-0 z-20 flex items-center gap-3 py-1">
                <span className="px-3.5 py-1 rounded-xl text-xs font-mono font-bold bg-[#FFFCF7]/95 dark:bg-[#0B1528]/95 text-[#1E5AA8] dark:text-sky-300 border border-[#F5E6C8] dark:border-slate-800 shadow-md backdrop-blur-md whitespace-nowrap shrink-0">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-[#F58220]/40 via-[#1E5AA8]/30 dark:via-sky-500/30 to-transparent" />
              </div>

              {/* Items in Group with Sunset Orange -> Sapphire Blue -> Sunset Orange Spine */}
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#F58220] before:via-[#1E5AA8] before:to-[#F58220]">
                <AnimatePresence initial={false}>
                  {group.items.map((item, itemIdx) => {
                    const categoryConfig =
                      CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.milestone;
                    const dateInfo = formatTimelineDate(item.date);

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, delay: itemIdx * 0.04 }}
                        className="relative group"
                      >
                        {/* Timeline Node on Spine with 44px touch hit area */}
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item)}
                          className="absolute -left-[33px] sm:-left-[37px] top-2 min-w-[44px] min-h-[44px] flex items-center justify-center z-10 cursor-pointer"
                          title={
                            item.completed
                              ? 'Đánh dấu chưa hoàn thành'
                              : 'Đánh dấu đã hoàn thành'
                          }
                          aria-label={item.completed ? 'Hoàn thành' : 'Chưa hoàn thành'}
                        >
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center transition-all border-2 shadow-md shrink-0',
                              item.completed
                                ? 'bg-[#1E5AA8] text-white border-[#F5E6C8] dark:border-slate-700 shadow-[#1E5AA8]/30 scale-105'
                                : 'bg-[#FFFCF7] dark:bg-[#0B1528] text-transparent border-[#F58220] hover:scale-110'
                            )}
                            style={{
                              borderColor: item.completed ? '#1E5AA8' : item.color,
                            }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </button>

                        {/* Card Content: Vanilla Cream / Dark Surface with Category Color Accent */}
                        <div
                          className={cn(
                            'rounded-2xl p-4 sm:p-5 transition-all border shadow-xs',
                            item.completed
                              ? 'bg-[#FAF3E3]/60 dark:bg-[#0B1528]/70 border-[#F5E6C8]/60 dark:border-slate-800/60 opacity-85'
                              : 'bg-[#FFFCF7] dark:bg-[#111F38] border-[#F5E6C8] dark:border-slate-800 hover:border-[#1E5AA8]/40 dark:hover:border-[#1E5AA8]/60 hover:shadow-lg'
                          )}
                        >
                          {/* Top row: Category, Date, Actions */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              {/* Category Badge with 3D Icon */}
                              <span
                                className={cn(
                                  'px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0',
                                  categoryConfig.bgClass,
                                  categoryConfig.borderClass,
                                  categoryConfig.textClass
                                )}
                              >
                                <img
                                  src={categoryConfig.icon3d}
                                  alt={categoryConfig.label}
                                  className="w-4 h-4 object-contain drop-shadow-2xs shrink-0"
                                />
                                <span className="whitespace-nowrap">{categoryConfig.label}</span>
                              </span>

                              {/* Formatted Date & Relative Badge */}
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono whitespace-nowrap shrink-0">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{dateInfo.formatted}</span>
                              </span>

                              <span
                                className={cn(
                                  'text-[11px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0',
                                  dateInfo.isPast && !item.completed
                                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                                    : 'bg-[#FAF3E3] dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-[#F5E6C8] dark:border-slate-700'
                                )}
                              >
                                {dateInfo.relative}
                              </span>

                              {/* Type badge if task */}
                              {item.type === 'task' && (
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1E5AA8] dark:text-sky-300 border border-[#1E5AA8]/30 dark:border-[#1E5AA8]/50 whitespace-nowrap shrink-0">
                                  Task Liên kết
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {item.type === 'event' ? (
                                <>
                                  <button
                                    onClick={() => {
                                      const ev = events.find((e) => e.id === item.originalId);
                                      if (ev) openEditModal(ev);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E5AA8] dark:hover:text-sky-300 hover:bg-[#FAF3E3] dark:hover:bg-slate-800 transition-colors shrink-0"
                                    title="Chỉnh sửa sự kiện"
                                    aria-label="Chỉnh sửa"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(item.originalId)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                                    title="Xóa sự kiện"
                                    aria-label="Xóa"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <Link
                                  href="/tasks"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E5AA8] dark:hover:text-sky-300 hover:bg-[#EFF6FF] dark:hover:bg-blue-950/40 transition-colors inline-flex items-center gap-1 text-xs shrink-0"
                                  title="Mở trong Quản lý Task"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Title & Description */}
                          <div className="mt-2.5">
                            <h3
                              className={cn(
                                'text-base font-semibold tracking-tight transition-colors min-w-0 break-words',
                                item.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'
                              )}
                            >
                              {item.title}
                            </h3>

                            {item.description && (
                              <p
                                className={cn(
                                  'text-xs sm:text-sm mt-1 whitespace-pre-line min-w-0 break-words',
                                  item.completed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'
                                )}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Extra info for tasks (priority, subtasks progress, tags) */}
                          {item.type === 'task' && (
                            <div className="mt-3 pt-2.5 border-t border-[#F5E6C8]/60 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                {item.priority && (
                                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 capitalize whitespace-nowrap">
                                    Ưu tiên: {item.priority}
                                  </span>
                                )}

                                {item.subtasksCount && (
                                  <span className="text-[11px] text-[#1E5AA8] dark:text-sky-300 font-medium flex items-center gap-1 bg-[#EFF6FF] dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-[#1E5AA8]/20 dark:border-[#1E5AA8]/40 whitespace-nowrap shrink-0">
                                    <img
                                      src="/icons/3d/tick.png"
                                      alt="Check"
                                      className="w-3 h-3 object-contain shrink-0"
                                    />
                                    <span>
                                      {item.subtasksCount.done}/{item.subtasksCount.total} việc phụ
                                    </span>
                                  </span>
                                )}
                              </div>

                              {Array.isArray(item.tags) && item.tags.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {item.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAF3E3] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-[#F5E6C8] dark:border-slate-700 whitespace-nowrap shrink-0"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Event Create / Edit Native Accessible Modal (<dialog>) */}
      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        onClick={handleDialogBackdropClick}
        aria-labelledby="timeline-dialog-title"
        className="backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm bg-transparent p-0 max-w-lg w-[calc(100%-2rem)] mx-auto rounded-2xl shadow-2xl border border-[#F5E6C8] dark:border-slate-800 text-slate-800 dark:text-slate-100 overflow-hidden my-auto max-h-[90dvh] sm:max-h-[85vh]"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="bg-[#FFFCF7] dark:bg-[#0B1528] p-5 sm:p-7 space-y-5 max-h-[90dvh] sm:max-h-[85vh] overflow-y-auto overscroll-contain custom-scrollbar">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-[#F5E6C8] dark:border-slate-800 pb-4">
            <h2 id="timeline-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <img
                src={editingEventId ? '/icons/3d/pencil.png' : '/icons/3d/flag.png'}
                alt="Event Modal"
                className="w-6 h-6 object-contain drop-shadow-xs shrink-0"
              />
              <span className="min-w-0 break-words">{editingEventId ? 'Chỉnh sửa Cột mốc Timeline' : 'Thêm Cột mốc Mới'}</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-[#FAF3E3] dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveModal} className="space-y-4">
            {/* Title field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tiêu đề sự kiện / Cột mốc <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                placeholder="Ví dụ: Ra mắt phiên bản LifeOS V1"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#111F38] focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/20 outline-none transition-all"
              />
            </div>

            {/* Description field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Mô tả chi tiết
              </label>
              <textarea
                rows={3}
                value={modalDescription}
                onChange={(e) => setModalDescription(e.target.value)}
                placeholder="Ghi chú về thành quả đạt được, bài học hoặc kế hoạch..."
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#111F38] focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/20 outline-none resize-none transition-all"
              />
            </div>

            {/* Event Date & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Ngày diễn ra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#111F38] focus:border-[#1E5AA8] dark:focus:border-sky-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Phân loại danh mục
                </label>
                <select
                  value={modalCategory}
                  onChange={(e) => {
                    const cat = e.target.value as any;
                    setModalCategory(cat);
                    // Match default category color
                    if (CATEGORY_CONFIG[cat]) {
                      setModalColor(CATEGORY_CONFIG[cat].color);
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#111F38] focus:border-[#1E5AA8] dark:focus:border-sky-400 outline-none"
                >
                  <option value="milestone">Cột mốc (Milestone)</option>
                  <option value="work">Công việc & Dự án (Work)</option>
                  <option value="personal">Đời sống cá nhân (Personal)</option>
                  <option value="idea">Ý tưởng sáng tạo (Idea)</option>
                  <option value="achievement">Thành tựu (Achievement)</option>
                </select>
              </div>
            </div>

            {/* Color Accent Picker with Sunset Orange and Sapphire Blue */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Màu sắc nhận diện
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => setModalColor(p.hex)}
                    className={cn(
                      'w-7 h-7 rounded-xl transition-all border-2 flex items-center justify-center shrink-0',
                      modalColor === p.hex
                        ? 'border-slate-800 dark:border-white scale-110 shadow-md'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: p.hex }}
                    title={p.name}
                  >
                    {modalColor === p.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}

                <input
                  type="color"
                  value={modalColor}
                  onChange={(e) => setModalColor(e.target.value)}
                  className="w-7 h-7 rounded-xl bg-transparent cursor-pointer border border-[#F5E6C8] dark:border-slate-700 p-0.5 shrink-0"
                  title="Tùy chỉnh mã màu"
                />
              </div>
            </div>

            {/* Completed Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 cursor-pointer hover:bg-[#FAF3E3] dark:hover:bg-[#152544] transition-colors">
                <input
                  type="checkbox"
                  checked={modalCompleted}
                  onChange={(e) => setModalCompleted(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1E5AA8] focus:ring-0 cursor-pointer shrink-0"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Đã hoàn thành / Đã đạt được
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Đánh dấu cột mốc này đã thành hiện thực
                  </span>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#F5E6C8] dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#FAF3E3] dark:bg-slate-800 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors border border-[#F5E6C8] dark:border-slate-700 whitespace-nowrap shrink-0"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={modalSaving || !modalTitle.trim() || !modalDate}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E5AA8] to-[#F58220] hover:from-[#174684] hover:to-[#e06d0b] text-white text-xs font-semibold shadow-md shadow-[#F58220]/20 transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {modalSaving ? 'Đang lưu...' : editingEventId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
