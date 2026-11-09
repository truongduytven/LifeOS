'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Tag as TagIcon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Kanban as KanbanIcon,
  ListTodo,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowRight,
  Flame,
  Check,
  RefreshCw,
} from 'lucide-react';
import type { Task, SubTask } from '@/types/lifeos';

// Helper for class merging
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// Vietnamese relative date helper
function formatRelativeDueDate(dueDateStr: string | null): { text: string; isOverdue: boolean; isToday: boolean } {
  if (!dueDateStr) return { text: '', isOverdue: false, isToday: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = dueDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const dayFormatted = `${due.getDate().toString().padStart(2, '0')}/${(due.getMonth() + 1).toString().padStart(2, '0')}/${due.getFullYear()}`;

  if (diffDays < 0) {
    return {
      text: `Quá hạn ${Math.abs(diffDays)} ngày (${dayFormatted})`,
      isOverdue: true,
      isToday: false,
    };
  } else if (diffDays === 0) {
    return { text: `Hôm nay (${dayFormatted})`, isOverdue: false, isToday: true };
  } else if (diffDays === 1) {
    return { text: `Ngày mai (${dayFormatted})`, isOverdue: false, isToday: false };
  } else if (diffDays <= 7) {
    return { text: `Còn ${diffDays} ngày (${dayFormatted})`, isOverdue: false, isToday: false };
  } else {
    return { text: dayFormatted, isOverdue: false, isToday: false };
  }
}

// Brand-Harmonious Priority badge mapping with full Dark Mode support
const PRIORITY_CONFIG = {
  urgent: {
    label: 'Khẩn cấp',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60 shadow-xs whitespace-nowrap shrink-0',
    indicator: 'bg-rose-500',
    icon: Flame,
  },
  high: {
    label: 'Cao',
    badgeClass: 'bg-[#FFF7ED] text-[#F58220] border-[#F58220]/30 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50 shadow-xs whitespace-nowrap shrink-0',
    indicator: 'bg-[#F58220]',
    icon: AlertTriangle,
  },
  medium: {
    label: 'Trung bình',
    badgeClass: 'bg-[#EFF6FF] text-[#1E5AA8] border-[#1E5AA8]/30 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50 shadow-xs whitespace-nowrap shrink-0',
    indicator: 'bg-[#1E5AA8]',
    icon: Clock,
  },
  low: {
    label: 'Thấp',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50 shadow-xs whitespace-nowrap shrink-0',
    indicator: 'bg-emerald-500',
    icon: CheckCircle2,
  },
};

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View Mode: Checklist (Check task) vs Kanban
  const [viewMode, setViewMode] = useState<'checklist' | 'kanban'>('checklist');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Quick-Add bar state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Expanded subtasks drawer map (taskId -> boolean)
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<number, boolean>>({});

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalStatus, setModalStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [modalPriority, setModalPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [modalDueDate, setModalDueDate] = useState('');
  const [modalTags, setModalTags] = useState<string[]>([]);
  const [modalTagInput, setModalTagInput] = useState('');
  const [modalSubtasks, setModalSubtasks] = useState<SubTask[]>([]);
  const [modalSubtaskInput, setModalSubtaskInput] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  // Native dialog ref
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Không thể tải danh sách công việc');
      const data = await res.json();
      const list: Task[] = Array.isArray(data) ? data : data.tasks || [];
      setTasks(list);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  // Handle native dialog close event (e.g. Esc key)
  const handleDialogClose = () => {
    setIsModalOpen(false);
    setEditingTaskId(null);
  };

  // Close when clicking outside dialog content (dialog backdrop)
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
        setEditingTaskId(null);
      }
    }
  };

  // All unique tags extracted from tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach((tag) => {
          if (tag && typeof tag === 'string') tagSet.add(tag.trim());
        });
      }
    });
    return Array.from(tagSet);
  }, [tasks]);

  // Daily Metrics & Completion Stats
  const metrics = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;

    // Overdue tasks that are not done
    const overdue = tasks.filter((t) => {
      if (t.status === 'done' || !t.dueDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(t.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      return dueDay.getTime() < today.getTime();
    }).length;

    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, todo, overdue, rate };
  }, [tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchDesc = (t.description || '').toLowerCase().includes(query);
        const matchTag = Array.isArray(t.tags) && t.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }
      // Status
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      // Priority
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      // Tag
      if (selectedTag !== 'all') {
        if (!Array.isArray(t.tags) || !t.tags.includes(selectedTag)) return false;
      }
      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, selectedTag]);

  // Toggle Task Completion (Optimistic)
  const handleToggleTaskStatus = async (task: Task) => {
    const isNowDone = task.status !== 'done';
    const nextStatus: 'done' | 'todo' = isNowDone ? 'done' : 'todo';
    const nextCompletedAt = isNowDone ? new Date().toISOString() : null;

    // If marking as done, optionally complete all subtasks
    const updatedSubtasks = isNowDone
      ? task.subtasks.map((st) => ({ ...st, completed: true }))
      : task.subtasks;

    const previousTasks = [...tasks];

    // Optimistic state update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextCompletedAt,
              subtasks: updatedSubtasks,
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          completedAt: nextCompletedAt,
          subtasks: updatedSubtasks,
        }),
      });
      if (!res.ok) throw new Error('Cập nhật trạng thái thất bại');
      const data = await res.json();
      const updated: Task = data.task || data;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      // Rollback
      setTasks(previousTasks);
      setError(err.message || 'Không thể lưu thay đổi');
    }
  };

  // Toggle Subtask Completion (Optimistic)
  const handleToggleSubtask = async (task: Task, subtaskId: string) => {
    const previousTasks = [...tasks];
    const newSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    // If all subtasks are now checked, we can auto-advance status
    const allCompleted = newSubtasks.length > 0 && newSubtasks.every((st) => st.completed);
    const nextStatus = allCompleted ? 'done' : task.status;
    const nextCompletedAt = allCompleted ? new Date().toISOString() : task.completedAt;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              subtasks: newSubtasks,
              status: nextStatus,
              completedAt: nextCompletedAt,
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtasks: newSubtasks,
          status: nextStatus,
          completedAt: nextCompletedAt,
        }),
      });
      if (!res.ok) throw new Error('Không thể lưu việc phụ');
      const data = await res.json();
      const updated: Task = data.task || data;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      setTasks(previousTasks);
      setError(err.message || 'Không thể cập nhật danh sách phụ');
    }
  };

  // Quick Inline Add Subtask from task item
  const handleAddInlineSubtask = async (task: Task, subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return;

    const newSub: SubTask = {
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: subtaskTitle.trim(),
      completed: false,
    };

    const newSubtasks = [...task.subtasks, newSub];
    const previousTasks = [...tasks];

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, subtasks: newSubtasks } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: newSubtasks }),
      });
      if (!res.ok) throw new Error('Không thể thêm việc phụ');
      const data = await res.json();
      const updated: Task = data.task || data;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      setTasks(previousTasks);
      setError(err.message || 'Lỗi thêm việc phụ');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này không?')) return;

    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa công việc thất bại');
    } catch (err: any) {
      setTasks(previousTasks);
      setError(err.message || 'Không thể xóa công việc');
    }
  };

  // Change Task Status directly (for Kanban or Quick move)
  const handleChangeStatus = async (taskId: number, newStatus: 'todo' | 'in_progress' | 'done') => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const previousTasks = [...tasks];
    const completedAt = newStatus === 'done' ? new Date().toISOString() : null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, completedAt } : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, completedAt }),
      });
      if (!res.ok) throw new Error('Không thể chuyển trạng thái');
      const data = await res.json();
      const updated: Task = data.task || data;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err: any) {
      setTasks(previousTasks);
      setError(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  // Quick Add Form Submit
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isQuickAdding) return;

    setIsQuickAdding(true);
    setError(null);

    const tempId = -Date.now();
    const tempTask: Task = {
      id: tempId,
      title: quickTitle.trim(),
      description: '',
      status: 'todo',
      priority: quickPriority,
      dueDate: quickDueDate || null,
      tags: [],
      subtasks: [],
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic insert at beginning of list
    setTasks((prev) => [tempTask, ...prev]);
    const originalTitle = quickTitle;
    const originalDueDate = quickDueDate;
    const originalPriority = quickPriority;

    setQuickTitle('');
    setQuickDueDate('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: originalTitle.trim(),
          description: '',
          status: 'todo',
          priority: originalPriority,
          dueDate: originalDueDate || null,
          tags: [],
          subtasks: [],
        }),
      });

      if (!res.ok) throw new Error('Không thể thêm công việc mới');
      const data = await res.json();
      const created: Task = data.task || data;

      // Replace temp with real task
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    } catch (err: any) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      setError(err.message || 'Thêm nhanh thất bại');
      setQuickTitle(originalTitle);
      setQuickDueDate(originalDueDate);
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Open Modal for Create or Edit
  const openCreateModal = () => {
    setEditingTaskId(null);
    setModalTitle('');
    setModalDescription('');
    setModalStatus('todo');
    setModalPriority('medium');
    setModalDueDate('');
    setModalTags([]);
    setModalTagInput('');
    setModalSubtasks([]);
    setModalSubtaskInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setModalTitle(task.title);
    setModalDescription(task.description || '');
    setModalStatus(task.status);
    setModalPriority(task.priority);
    setModalDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setModalTags(Array.isArray(task.tags) ? [...task.tags] : []);
    setModalTagInput('');
    setModalSubtasks(Array.isArray(task.subtasks) ? [...task.subtasks] : []);
    setModalSubtaskInput('');
    setIsModalOpen(true);
  };

  // Subtask Management in Modal
  const handleModalAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!modalSubtaskInput.trim()) return;

    const newSub: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: modalSubtaskInput.trim(),
      completed: false,
    };
    setModalSubtasks((prev) => [...prev, newSub]);
    setModalSubtaskInput('');
  };

  const handleModalRemoveSubtask = (subId: string) => {
    setModalSubtasks((prev) => prev.filter((s) => s.id !== subId));
  };

  const handleModalToggleSubtask = (subId: string) => {
    setModalSubtasks((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s))
    );
  };

  // Tag Management in Modal
  const handleModalAddTag = () => {
    const trimmed = modalTagInput.trim().replace(/^#/, '');
    if (trimmed && !modalTags.includes(trimmed)) {
      setModalTags((prev) => [...prev, trimmed]);
    }
    setModalTagInput('');
  };

  const handleModalRemoveTag = (tagToRemove: string) => {
    setModalTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Save Modal Form (Create or Edit)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || modalSaving) return;

    setModalSaving(true);
    setError(null);

    const completedAt =
      modalStatus === 'done'
        ? new Date().toISOString()
        : editingTaskId
        ? tasks.find((t) => t.id === editingTaskId)?.completedAt || null
        : null;

    const payload = {
      title: modalTitle.trim(),
      description: modalDescription.trim(),
      status: modalStatus,
      priority: modalPriority,
      dueDate: modalDueDate ? new Date(modalDueDate).toISOString() : null,
      tags: modalTags,
      subtasks: modalSubtasks,
      completedAt: modalStatus === 'done' ? completedAt : null,
    };

    try {
      if (editingTaskId) {
        // Edit existing
        const res = await fetch(`/api/tasks/${editingTaskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Không thể lưu cập nhật công việc');
        const data = await res.json();
        const updated: Task = data.task || data;
        setTasks((prev) => prev.map((t) => (t.id === editingTaskId ? updated : t)));
      } else {
        // Create new
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Không thể tạo công việc mới');
        const data = await res.json();
        const created: Task = data.task || data;
        setTasks((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      setEditingTaskId(null);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu công việc');
    } finally {
      setModalSaving(false);
    }
  };

  // Toggle Subtask expand/collapse for card
  const toggleSubtasksExpanded = (taskId: number) => {
    setExpandedSubtasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // HTML5 Drag and Drop handlers for Kanban
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: 'todo' | 'in_progress' | 'done') => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr, 10);
    if (!isNaN(taskId)) {
      handleChangeStatus(taskId, newStatus);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics bar: Brand Warm Vanilla Cream & Sapphire Blue / Sunset Orange with Dark Mode support */}
      <div className="bg-gradient-to-r from-[#FAF3E3]/95 via-[#F5E6C8]/60 to-[#FFF7ED]/90 dark:from-[#0C1E38]/90 dark:via-[#111F38]/80 dark:to-[#0B1528]/95 border border-[#F5E6C8] dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xs">
        {/* Soft decorative glow circles in brand tones */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#1E5AA8]/10 dark:bg-[#1E5AA8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#F58220]/15 dark:bg-[#F58220]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs uppercase font-mono tracking-widest text-[#1E5AA8] dark:text-blue-400 font-bold bg-[#1E5AA8]/10 dark:bg-blue-950/60 border border-[#1E5AA8]/20 dark:border-blue-800/50 px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                Năng suất & Thực thi
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F58220] shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap shrink-0">Check-list & Kanban</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3 flex-wrap">
              <img
                src="/icons/3d/tick.png"
                alt="Tasks"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-md hover:scale-110 hover:-rotate-3 transition-transform duration-300 shrink-0"
              />
              <span className="min-w-0 break-words">Quản lý Công việc & Checklist</span>
              {refreshing && (
                <RefreshCw className="w-5 h-5 text-[#1E5AA8] dark:text-blue-400 animate-spin shrink-0" />
              )}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl min-w-0 break-words">
              Hệ thống theo dõi tiến độ thời gian thực, hỗ trợ checklist đa cấp, phân định độ ưu tiên và chuyển đổi linh hoạt.
            </p>
          </div>

          {/* Quick Metrics & 3D Icons Summary */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            {/* Circular Progress Ring with 3D Chart Icon */}
            <div className="flex items-center gap-3.5 bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 rounded-2xl p-3 shadow-xs shrink-0">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-[#F5E6C8]/70 dark:text-slate-700/60"
                    strokeWidth="3.4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress Circle in Sunset Orange */}
                  <motion.path
                    className="text-[#F58220]"
                    strokeDasharray={`${metrics.rate}, 100`}
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    initial={{ strokeDasharray: '0, 100' }}
                    animate={{ strokeDasharray: `${metrics.rate}, 100` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xs font-bold text-[#1E5AA8] dark:text-blue-400 font-mono">{metrics.rate}%</span>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Hoàn thành</div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {metrics.done} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/ {metrics.total} task</span>
                </div>
              </div>

              <img
                src="/icons/3d/chart.png"
                alt="Progress"
                className="w-8 h-8 object-contain ml-1 drop-shadow-xs hover:scale-110 hover:rotate-6 transition-transform duration-300 hidden sm:block shrink-0"
              />
            </div>

            {/* Quick Stat Badges with 3D Icons */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-2 rounded-xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#1E5AA8]/25 dark:border-blue-800/50 text-center shadow-xs flex items-center gap-2 shrink-0">
                <img
                  src="/icons/3d/target.png"
                  alt="In Progress"
                  className="w-5 h-5 object-contain drop-shadow-2xs shrink-0"
                />
                <div className="text-left">
                  <div className="text-[10px] text-[#1E5AA8] dark:text-blue-400 uppercase tracking-wider font-bold whitespace-nowrap">Đang làm</div>
                  <div className="text-sm font-bold text-[#1E5AA8] dark:text-blue-400 leading-tight whitespace-nowrap">{metrics.inProgress}</div>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 text-center shadow-xs flex items-center gap-2 shrink-0">
                <img
                  src="/icons/3d/calendar.png"
                  alt="To Do"
                  className="w-5 h-5 object-contain drop-shadow-2xs shrink-0"
                />
                <div className="text-left">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap">Chờ làm</div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight whitespace-nowrap">{metrics.todo}</div>
                </div>
              </div>

              {metrics.overdue > 0 && (
                <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-center shadow-xs flex items-center gap-2 shrink-0">
                  <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="text-left">
                    <div className="text-[10px] text-rose-600 dark:text-rose-300 uppercase tracking-wider font-semibold whitespace-nowrap">Quá hạn</div>
                    <div className="text-sm font-bold text-rose-700 dark:text-rose-300 leading-tight whitespace-nowrap">{metrics.overdue}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Create Task Button: Sunset Orange Primary CTA */}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F58220] hover:bg-[#e06d0b] text-white font-medium text-sm shadow-md shadow-[#F58220]/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between shadow-xs min-w-0 break-words">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-200 p-1 rounded-lg shrink-0"
            aria-label="Đóng thông báo lỗi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Bar: View Switcher, Search, Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* View mode toggle */}
        <div className="flex items-center p-1 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 w-fit shadow-2xs whitespace-nowrap shrink-0">
          <button
            onClick={() => setViewMode('checklist')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0',
              viewMode === 'checklist'
                ? 'bg-white dark:bg-[#111F38] text-[#1E5AA8] dark:text-blue-400 font-bold shadow-xs border border-[#1E5AA8]/20 dark:border-blue-700/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
            )}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Check-list</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0',
              viewMode === 'kanban'
                ? 'bg-white dark:bg-[#111F38] text-[#1E5AA8] dark:text-blue-400 font-bold shadow-xs border border-[#1E5AA8]/20 dark:border-blue-700/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
            )}
          >
            <KanbanIcon className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2.5 flex-1 max-w-2xl justify-end flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công việc, thẻ, mô tả..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[#FFFCF7] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#1E5AA8] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#1E5AA8]/20 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs bg-[#FFFCF7] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-[#1E5AA8] dark:focus:border-blue-500 shadow-xs whitespace-nowrap shrink-0"
            aria-label="Lọc theo trạng thái"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="todo">Cần làm (To Do)</option>
            <option value="in_progress">Đang làm (In Progress)</option>
            <option value="done">Hoàn thành (Done)</option>
          </select>

          {/* Priority filter dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs bg-[#FFFCF7] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-[#1E5AA8] dark:focus:border-blue-500 shadow-xs whitespace-nowrap shrink-0"
            aria-label="Lọc theo độ ưu tiên"
          >
            <option value="all">Mọi độ ưu tiên</option>
            <option value="urgent">Khẩn cấp</option>
            <option value="high">Ưu tiên cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={() => fetchTasks(false)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-[#FFFCF7] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#1E5AA8] dark:hover:text-blue-400 hover:border-[#1E5AA8]/40 shadow-xs transition-colors shrink-0"
            title="Tải lại danh sách"
            aria-label="Tải lại danh sách"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin text-[#1E5AA8] dark:text-blue-400')} />
          </button>
        </div>
      </div>

      {/* Tag filter bar (if tags exist) - Horizontally scrollable */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono mr-1 flex items-center gap-1 whitespace-nowrap shrink-0">
            <TagIcon className="w-3 h-3 text-[#1E5AA8] dark:text-blue-400" /> Thẻ:
          </span>
          <button
            onClick={() => setSelectedTag('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0',
              selectedTag === 'all'
                ? 'bg-[#1E5AA8]/10 dark:bg-blue-950/60 text-[#1E5AA8] dark:text-blue-300 border border-[#1E5AA8]/30 dark:border-blue-800/60 shadow-xs font-bold'
                : 'bg-[#FFFCF7] dark:bg-[#0B1528] text-slate-600 dark:text-slate-300 hover:bg-[#FAF3E3] dark:hover:bg-slate-800 border border-[#F5E6C8] dark:border-slate-800'
            )}
          >
            Tất cả ({tasks.length})
          </button>
          {allTags.map((tag) => {
            const count = tasks.filter((t) => Array.isArray(t.tags) && t.tags.includes(tag)).length;
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? 'all' : tag)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5',
                  isSelected
                    ? 'bg-[#1E5AA8]/10 dark:bg-blue-950/60 text-[#1E5AA8] dark:text-blue-300 border border-[#1E5AA8]/30 dark:border-blue-800/60 shadow-xs font-bold'
                    : 'bg-[#FFFCF7] dark:bg-[#0B1528] text-slate-600 dark:text-slate-300 hover:bg-[#FAF3E3] dark:hover:bg-slate-800 border border-[#F5E6C8] dark:border-slate-800'
                )}
              >
                <span>#{tag}</span>
                <span className="text-[10px] opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Keyboard-Friendly Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="bg-[#FFFCF7] dark:bg-[#0B1528] rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 border border-[#F58220]/40 dark:border-[#F58220]/30 focus-within:border-[#F58220] focus-within:ring-2 focus-within:ring-[#F58220]/20 transition-all shadow-xs"
      >
        <div className="w-8 h-8 rounded-xl bg-[#F58220]/10 dark:bg-[#F58220]/20 flex items-center justify-center flex-shrink-0">
          <img
            src="/icons/3d/target.png"
            alt="New Task"
            className="w-5 h-5 object-contain drop-shadow-2xs"
          />
        </div>

        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Thêm nhanh công việc mới... (Nhập tiêu đề và nhấn Enter)"
          className="flex-1 bg-transparent border-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none min-w-0"
        />

        {/* Quick Priority picker */}
        <select
          value={quickPriority}
          onChange={(e) => setQuickPriority(e.target.value as any)}
          className="bg-[#FAF3E3] dark:bg-[#111F38] text-xs text-slate-700 dark:text-slate-200 border border-[#F5E6C8] dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1E5AA8] whitespace-nowrap shrink-0"
          aria-label="Chọn độ ưu tiên nhanh"
        >
          <option value="low">Thấp</option>
          <option value="medium">Trung bình</option>
          <option value="high">Cao</option>
          <option value="urgent">Khẩn cấp</option>
        </select>

        {/* Quick Due date */}
        <input
          type="date"
          value={quickDueDate}
          onChange={(e) => setQuickDueDate(e.target.value)}
          className="bg-[#FAF3E3] dark:bg-[#111F38] text-xs text-slate-700 dark:text-slate-200 border border-[#F5E6C8] dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1E5AA8] hidden sm:block whitespace-nowrap shrink-0"
          aria-label="Chọn hạn hoàn thành nhanh"
        />

        <button
          type="submit"
          disabled={!quickTitle.trim() || isQuickAdding}
          className="px-3.5 py-1.5 rounded-xl bg-[#F58220] hover:bg-[#e06d0b] disabled:opacity-40 text-white font-medium text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
        >
          <span>Tạo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Main View Display */}
      {loading ? (
        <div className="bg-[#FFFCF7] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-[#1E5AA8] dark:text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Đang tải danh sách công việc...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-[#FFFCF7] dark:bg-[#0B1528] border-2 border-dashed border-[#F5E6C8] dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <img
            src="/icons/3d/tick.png"
            alt="No Tasks"
            className="w-16 h-16 mx-auto mb-3 drop-shadow-md hover:scale-110 hover:-rotate-3 transition-transform duration-300"
          />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Chưa có công việc nào phù hợp</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto min-w-0 break-words">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || selectedTag !== 'all'
              ? 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để xem các công việc khác.'
              : 'Bắt đầu ngày mới bằng cách thêm một công việc vào checklist của bạn!'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-[#F58220] hover:bg-[#e06d0b] text-white text-xs font-medium inline-flex items-center gap-2 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo công việc đầu tiên</span>
          </button>
        </div>
      ) : viewMode === 'checklist' ? (
        /* Checklist View Mode (Fast interactive check-off) - with vertical scroll container */
        <div className="space-y-3 max-h-[72vh] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
          <AnimatePresence initial={false}>
            {filteredTasks.map((task) => {
              const isDone = task.status === 'done';
              const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const dateInfo = formatRelativeDueDate(task.dueDate);
              const isExpanded = Boolean(expandedSubtasks[task.id]);

              // Subtasks progress
              const totalSubs = task.subtasks?.length || 0;
              const doneSubs = task.subtasks?.filter((s) => s.completed).length || 0;
              const subPercent = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'rounded-2xl p-4 transition-all border shadow-xs',
                    isDone
                      ? 'bg-[#FAF3E3]/60 dark:bg-slate-900/60 border-[#F5E6C8]/60 dark:border-slate-800/60 opacity-80'
                      : 'bg-[#FFFCF7] dark:bg-[#0B1528] border-[#F5E6C8] dark:border-slate-800/80 hover:border-[#1E5AA8]/40 dark:hover:border-blue-500/40 hover:shadow-md'
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Interactive Checkbox in Sapphire Blue */}
                    <button
                      type="button"
                      onClick={() => handleToggleTaskStatus(task)}
                      className={cn(
                        'mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 border',
                        isDone
                          ? 'bg-[#1E5AA8] text-white border-[#1E5AA8] shadow-xs'
                          : 'border-slate-300 dark:border-slate-600 hover:border-[#F58220] text-transparent hover:text-[#F58220]/40 bg-white dark:bg-[#111F38]'
                      )}
                      aria-label={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                    >
                      <Check className={cn('w-4 h-4 transition-transform stroke-[2.5]', isDone && 'scale-100')} />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4
                            className={cn(
                              'text-sm font-semibold transition-all break-words',
                              isDone ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'
                            )}
                          >
                            {task.title}
                          </h4>

                          {task.description && (
                            <p
                              className={cn(
                                'text-xs mt-1 break-words line-clamp-2',
                                isDone ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'
                              )}
                            >
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E5AA8] dark:hover:text-blue-400 hover:bg-[#FAF3E3] dark:hover:bg-slate-800 transition-colors"
                            title="Chỉnh sửa công việc"
                            aria-label="Chỉnh sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Xóa công việc"
                            aria-label="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Badges & Meta info */}
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap text-xs">
                        {/* Status chip */}
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap shrink-0',
                            task.status === 'done'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
                              : task.status === 'in_progress'
                              ? 'bg-[#EFF6FF] text-[#1E5AA8] border-[#1E5AA8]/30 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60'
                              : 'bg-[#FAF3E3] text-slate-700 border-[#F5E6C8] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          )}
                        >
                          {task.status === 'done'
                            ? 'Hoàn thành'
                            : task.status === 'in_progress'
                            ? 'Đang làm'
                            : 'Cần làm'}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1',
                            priorityInfo.badgeClass
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', priorityInfo.indicator)} />
                          {priorityInfo.label}
                        </span>

                        {/* Due Date Badge */}
                        {task.dueDate && (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1 whitespace-nowrap shrink-0',
                              dateInfo.isOverdue
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60'
                                : dateInfo.isToday
                                ? 'bg-[#FFF7ED] text-[#F58220] border-[#F58220]/30 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60'
                                : 'bg-[#FAF3E3] text-slate-700 border-[#F5E6C8] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            )}
                          >
                            <Calendar className="w-3 h-3 text-[#1E5AA8] dark:text-blue-400 shrink-0" />
                            <span>{dateInfo.text}</span>
                          </span>
                        )}

                        {/* Tags */}
                        {Array.isArray(task.tags) &&
                          task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md text-[11px] bg-[#1E5AA8]/10 dark:bg-blue-950/60 text-[#1E5AA8] dark:text-blue-300 border border-[#1E5AA8]/20 dark:border-blue-800/60 font-mono whitespace-nowrap shrink-0"
                            >
                              #{tag}
                            </span>
                          ))}

                        {/* Subtasks counter toggle */}
                        {totalSubs > 0 && (
                          <button
                            onClick={() => toggleSubtasksExpanded(task.id)}
                            className="px-2 py-0.5 rounded-md text-[11px] bg-[#FAF3E3] dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#F5E6C8]/60 dark:hover:bg-slate-700 border border-[#F5E6C8] dark:border-slate-700 transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <CheckSquare className="w-3 h-3 text-[#1E5AA8] dark:text-blue-400 shrink-0" />
                            <span>
                              {doneSubs}/{totalSubs} việc nhỏ
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 shrink-0" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Subtasks Progress Bar with Sunset Orange & Sapphire Blue gradient */}
                      {totalSubs > 0 && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[#F5E6C8]/60 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#1E5AA8] to-[#F58220] transition-all duration-300"
                              style={{ width: `${subPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex-shrink-0">
                            {subPercent}%
                          </span>
                        </div>
                      )}

                      {/* Expandable Subtasks List */}
                      {isExpanded && (
                        <div className="mt-3 pl-3 border-l-2 border-[#1E5AA8]/30 dark:border-blue-700/40 space-y-2">
                          {task.subtasks.map((st) => (
                            <div
                              key={st.id}
                              className="flex items-center gap-2.5 group py-0.5"
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleSubtask(task, st.id)}
                                className={cn(
                                  'w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0',
                                  st.completed
                                    ? 'bg-[#1E5AA8] text-white border-[#1E5AA8]'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-[#F58220] text-transparent bg-white dark:bg-[#111F38]'
                                )}
                                aria-label="Đổi trạng thái việc phụ"
                              >
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </button>
                              <span
                                className={cn(
                                  'text-xs transition-colors break-words min-w-0',
                                  st.completed
                                    ? 'text-slate-400 dark:text-slate-500 line-through'
                                    : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                                )}
                              >
                                {st.title}
                              </span>
                            </div>
                          ))}

                          {/* Inline add subtask input */}
                          <div className="pt-1 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="+ Thêm việc nhỏ (nhấn Enter)..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddInlineSubtask(task, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                              className="text-xs bg-[#FAF3E3]/60 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-[#0B1528] focus:border-[#1E5AA8] dark:focus:border-blue-500 w-full max-w-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Kanban Board View Mode - with horizontal roll container and per-column vertical roll */
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[920px] md:min-w-0">
            {(
              [
                {
                  key: 'todo',
                  title: 'Cần làm (To Do)',
                  borderTop: 'border-t-4 border-t-slate-400',
                  colBg: 'bg-[#FAF3E3]/90 dark:bg-[#0B1528]/90 border-[#F5E6C8] dark:border-slate-800',
                  headerBg: 'bg-[#F5E6C8]/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100',
                  badgeBg: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200',
                  icon: '/icons/3d/calendar.png',
                },
                {
                  key: 'in_progress',
                  title: 'Đang làm (In Progress)',
                  borderTop: 'border-t-4 border-t-[#1E5AA8]',
                  colBg: 'bg-[#EFF6FF]/60 dark:bg-blue-950/20 border-[#1E5AA8]/20 dark:border-blue-900/40',
                  headerBg: 'bg-[#1E5AA8]/15 dark:bg-blue-900/40 text-[#1E5AA8] dark:text-blue-300',
                  badgeBg: 'bg-white dark:bg-slate-800 text-[#1E5AA8] dark:text-blue-300',
                  icon: '/icons/3d/target.png',
                },
                {
                  key: 'done',
                  title: 'Hoàn thành (Done)',
                  borderTop: 'border-t-4 border-t-[#F58220]',
                  colBg: 'bg-[#FFF7ED]/60 dark:bg-amber-950/20 border-[#F58220]/20 dark:border-amber-900/40',
                  headerBg: 'bg-[#F58220]/15 dark:bg-amber-900/40 text-[#F58220] dark:text-amber-300',
                  badgeBg: 'bg-white dark:bg-slate-800 text-[#F58220] dark:text-amber-300',
                  icon: '/icons/3d/tick.png',
                },
              ] as const
            ).map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.key);

              return (
                <div
                  key={col.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className={cn(
                    'rounded-2xl p-3 sm:p-4 flex flex-col min-h-[460px] min-w-[290px] border shadow-xs',
                    col.colBg,
                    col.borderTop
                  )}
                >
                  {/* Column Header - with nowrap to prevent awkward header wrap */}
                  <div className={cn('p-2.5 rounded-xl flex items-center justify-between mb-3 shrink-0', col.headerBg)}>
                    <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
                      <img
                        src={col.icon}
                        alt={col.title}
                        className="w-4 h-4 object-contain drop-shadow-2xs shrink-0"
                      />
                      <span className="font-bold text-xs sm:text-sm whitespace-nowrap">{col.title}</span>
                    </div>
                    <span className={cn('text-xs font-mono font-bold px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap shrink-0', col.badgeBg)}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Cards List with smooth vertical roll */}
                  <div className="space-y-2.5 flex-1 max-h-[68vh] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
                    {colTasks.length === 0 ? (
                      <div className="h-32 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-[#F5E6C8] dark:border-slate-800 rounded-xl bg-white/50 dark:bg-[#111F38]/40">
                        Kéo thả task vào đây
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                        const dateInfo = formatRelativeDueDate(task.dueDate);
                        const totalSubs = task.subtasks?.length || 0;
                        const doneSubs = task.subtasks?.filter((s) => s.completed).length || 0;

                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className="p-3 rounded-xl bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 hover:border-[#1E5AA8]/40 dark:hover:border-blue-500/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 break-words min-w-0">
                                {task.title}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="text-slate-400 hover:text-[#1E5AA8] dark:hover:text-blue-400 p-1 rounded"
                                  title="Chỉnh sửa"
                                  aria-label="Sửa task"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded"
                                  title="Xóa"
                                  aria-label="Xóa task"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 min-w-0 break-words">
                                {task.description}
                              </p>
                            )}

                            {/* Subtasks progress */}
                            {totalSubs > 0 && (
                              <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                                <CheckSquare className="w-3 h-3 text-[#1E5AA8] dark:text-blue-400 shrink-0" />
                                <span>
                                  {doneSubs}/{totalSubs} việc nhỏ
                                </span>
                              </div>
                            )}

                            {/* Badges row */}
                            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 whitespace-nowrap shrink-0',
                                  priorityInfo.badgeClass
                                )}
                              >
                                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', priorityInfo.indicator)} />
                                {priorityInfo.label}
                              </span>

                              {task.dueDate && (
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 whitespace-nowrap shrink-0',
                                    dateInfo.isOverdue
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60'
                                      : 'bg-[#FAF3E3] text-slate-700 border-[#F5E6C8] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                  )}
                                >
                                  <Calendar className="w-2.5 h-2.5 text-[#1E5AA8] dark:text-blue-400 shrink-0" />
                                  <span>{dateInfo.text}</span>
                                </span>
                              )}
                            </div>

                            {/* Quick Column Shift Selector */}
                            <div className="mt-2 pt-2 border-t border-[#F5E6C8]/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 gap-1">
                              <span className="whitespace-nowrap shrink-0">Chuyển sang:</span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {col.key !== 'todo' && (
                                  <button
                                    onClick={() => handleChangeStatus(task.id, 'todo')}
                                    className="px-1.5 py-0.5 rounded bg-[#FAF3E3] dark:bg-slate-800 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap shrink-0"
                                  >
                                    Cần làm
                                  </button>
                                )}
                                {col.key !== 'in_progress' && (
                                  <button
                                    onClick={() => handleChangeStatus(task.id, 'in_progress')}
                                    className="px-1.5 py-0.5 rounded bg-[#EFF6FF] dark:bg-blue-950/60 hover:bg-[#1E5AA8]/20 dark:hover:bg-blue-900/60 text-[#1E5AA8] dark:text-blue-300 font-medium whitespace-nowrap shrink-0"
                                  >
                                    Đang làm
                                  </button>
                                )}
                                {col.key !== 'done' && (
                                  <button
                                    onClick={() => handleChangeStatus(task.id, 'done')}
                                    className="px-1.5 py-0.5 rounded bg-[#FFF7ED] dark:bg-amber-950/60 hover:bg-[#F58220]/20 dark:hover:bg-amber-900/60 text-[#F58220] dark:text-amber-300 font-medium whitespace-nowrap shrink-0"
                                  >
                                    Xong
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Create / Edit Native Accessible Modal (<dialog>) with smooth scroll */}
      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        onClick={handleDialogBackdropClick}
        aria-labelledby="task-dialog-title"
        className="backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm bg-transparent p-0 max-w-xl w-full rounded-2xl shadow-2xl border border-[#F5E6C8] dark:border-slate-800 text-slate-800 dark:text-slate-100 overflow-hidden"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="bg-[#FFFCF7] dark:bg-[#0B1528] p-6 sm:p-7 space-y-5 max-h-[85vh] overflow-y-auto overscroll-contain custom-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F5E6C8] dark:border-slate-800 pb-4">
            <h2 id="task-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <img
                src={editingTaskId ? '/icons/3d/pencil.png' : '/icons/3d/tick.png'}
                alt="Modal Icon"
                className="w-6 h-6 object-contain drop-shadow-xs shrink-0"
              />
              <span className="whitespace-nowrap">{editingTaskId ? 'Chỉnh sửa Công việc' : 'Tạo Công việc Mới'}</span>
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
                Tiêu đề công việc <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                placeholder="Ví dụ: Thiết kế hệ thống dữ liệu LifeOS"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0B1528] focus:border-[#1E5AA8] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#1E5AA8]/20 outline-none transition-all"
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
                placeholder="Mô tả mục tiêu, yêu cầu hoặc ghi chú phụ..."
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0B1528] focus:border-[#1E5AA8] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#1E5AA8]/20 outline-none resize-none transition-all"
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Trạng thái
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0B1528] focus:border-[#1E5AA8] dark:focus:border-blue-500 outline-none"
                >
                  <option value="todo">Cần làm (To Do)</option>
                  <option value="in_progress">Đang làm (In Progress)</option>
                  <option value="done">Hoàn thành (Done)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Độ ưu tiên
                </label>
                <select
                  value={modalPriority}
                  onChange={(e) => setModalPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0B1528] focus:border-[#1E5AA8] dark:focus:border-blue-500 outline-none"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Ưu tiên cao</option>
                  <option value="urgent">Khẩn cấp (Urgent)</option>
                </select>
              </div>
            </div>

            {/* Due Date & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Hạn hoàn thành (Due Date)
                </label>
                <input
                  type="date"
                  value={modalDueDate}
                  onChange={(e) => setModalDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0B1528] focus:border-[#1E5AA8] dark:focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Thẻ phân loại (Tags)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={modalTagInput}
                    onChange={(e) => setModalTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleModalAddTag();
                      }
                    }}
                    placeholder="Nhập tag và bấm thêm..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0B1528] focus:border-[#1E5AA8] dark:focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleModalAddTag}
                    className="px-3 py-2 rounded-xl bg-[#FAF3E3] dark:bg-slate-800 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-[#F5E6C8] dark:border-slate-700 whitespace-nowrap shrink-0"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>

            {/* Tag Badges list in modal */}
            {modalTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {modalTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-xs bg-[#1E5AA8]/10 dark:bg-blue-950/60 text-[#1E5AA8] dark:text-blue-300 border border-[#1E5AA8]/20 dark:border-blue-800/60 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleModalRemoveTag(tag)}
                      className="text-[#1E5AA8] hover:text-[#174684] dark:hover:text-blue-200"
                      aria-label={`Xóa thẻ ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Dynamic Subtasks Builder with scrollable list */}
            <div className="pt-2 border-t border-[#F5E6C8] dark:border-slate-800 space-y-2.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Danh sách việc phụ (Subtasks checklist)
              </label>

              {/* Subtask input bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={modalSubtaskInput}
                  onChange={(e) => setModalSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleModalAddSubtask();
                    }
                  }}
                  placeholder="Thêm mục checklist phụ..."
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0B1528] focus:border-[#1E5AA8] dark:focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleModalAddSubtask()}
                  className="px-3.5 py-2 rounded-xl bg-[#1E5AA8]/10 hover:bg-[#1E5AA8]/20 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#1E5AA8] dark:text-blue-300 border border-[#1E5AA8]/25 dark:border-blue-800/60 text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  + Thêm việc
                </button>
              </div>

              {/* Subtasks items with dedicated vertical scroll */}
              {modalSubtasks.length > 0 && (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {modalSubtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleModalToggleSubtask(st.id)}
                          className={cn(
                            'w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0',
                            st.completed
                              ? 'bg-[#1E5AA8] text-white border-[#1E5AA8]'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0B1528] text-transparent'
                          )}
                          aria-label="Đổi trạng thái"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span
                          className={cn(
                            'break-words min-w-0',
                            st.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'
                          )}
                        >
                          {st.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleModalRemoveSubtask(st.id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded shrink-0"
                        aria-label="Xóa việc phụ"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                disabled={modalSaving || !modalTitle.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E5AA8] to-[#F58220] hover:from-[#174684] hover:to-[#e06d0b] text-white text-xs font-semibold shadow-md shadow-[#F58220]/20 transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {modalSaving ? 'Đang lưu...' : editingTaskId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
