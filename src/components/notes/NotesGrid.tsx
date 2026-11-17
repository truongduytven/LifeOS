'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Copy,
  Check,
  Tag,
  Palette,
  X,
  Sparkles,
  Clock,
  Filter,
  AlertCircle,
} from 'lucide-react';
import type { Note } from '@/types/lifeos';
import GlassCard from '@/components/ui/GlassCard';
import ResponsiveModal from '@/components/ui/ResponsiveModal';

// Brand-Harmonious Pastel & Vanilla Color Palette Configuration with Frosted Glass & Dark Mode Support
export const COLOR_PALETTES: Array<{
  id: string;
  aliases: string[];
  name: string;
  bg: string;
  border: string;
  accentBorder: string;
  text: string;
  badge: string;
  dotBg: string;
  glowColor: 'sapphire' | 'sunset' | 'emerald' | 'none';
}> = [
  {
    id: 'sapphire',
    aliases: ['#1e3a8a', '#1E5AA8', 'sapphire', 'indigo'],
    name: 'Xanh Lam (Sapphire)',
    bg: 'bg-[#EFF6FF]/70 dark:bg-blue-950/30 backdrop-blur-md',
    border: 'border-[#1E5AA8]/30 dark:border-[#1E5AA8]/50',
    accentBorder: 'border-t-4 border-t-[#1E5AA8]',
    text: 'text-[#1E5AA8] dark:text-sky-300',
    badge: 'bg-[#1E5AA8]/15 text-[#1E5AA8] dark:bg-blue-900/50 dark:text-sky-300',
    dotBg: 'bg-[#1E5AA8]',
    glowColor: 'sapphire',
  },
  {
    id: 'sunset',
    aliases: ['#78350f', '#F58220', 'sunset', 'amber'],
    name: 'Cam Hoàng Hôn (Sunset)',
    bg: 'bg-[#FFF7ED]/70 dark:bg-amber-950/30 backdrop-blur-md',
    border: 'border-[#F58220]/30 dark:border-[#F58220]/50',
    accentBorder: 'border-t-4 border-t-[#F58220]',
    text: 'text-[#F58220] dark:text-amber-300',
    badge: 'bg-[#F58220]/15 text-[#F58220] dark:bg-amber-900/50 dark:text-amber-300',
    dotBg: 'bg-[#F58220]',
    glowColor: 'sunset',
  },
  {
    id: 'vanilla',
    aliases: ['#FAF3E3', '#F5E6C8', 'vanilla'],
    name: 'Kem Vani (Vanilla)',
    bg: 'bg-[#FAF3E3]/70 dark:bg-[#111F38]/60 backdrop-blur-md',
    border: 'border-[#F5E6C8] dark:border-slate-800',
    accentBorder: 'border-t-4 border-t-[#F5E6C8] dark:border-t-slate-600',
    text: 'text-slate-800 dark:text-slate-100',
    badge: 'bg-[#F5E6C8] text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    dotBg: 'bg-[#F5E6C8]',
    glowColor: 'none',
  },
  {
    id: 'emerald',
    aliases: ['#064e3b', '#10b981', 'emerald'],
    name: 'Ngọc Bích (Emerald)',
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/30 backdrop-blur-md',
    border: 'border-emerald-200/80 dark:border-emerald-800/50',
    accentBorder: 'border-t-4 border-t-emerald-500',
    text: 'text-emerald-950 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    dotBg: 'bg-emerald-500',
    glowColor: 'emerald',
  },
  {
    id: 'rose',
    aliases: ['#881337', '#e11d48', 'rose'],
    name: 'Hoa Hồng (Rose)',
    bg: 'bg-rose-50/70 dark:bg-rose-950/30 backdrop-blur-md',
    border: 'border-rose-200/80 dark:border-rose-800/50',
    accentBorder: 'border-t-4 border-t-rose-500',
    text: 'text-rose-950 dark:text-rose-300',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    dotBg: 'bg-rose-500',
    glowColor: 'sunset',
  },
  {
    id: 'violet',
    aliases: ['#581c87', '#8b5cf6', 'violet'],
    name: 'Thạch Anh (Violet)',
    bg: 'bg-violet-50/70 dark:bg-violet-950/30 backdrop-blur-md',
    border: 'border-violet-200/80 dark:border-violet-800/50',
    accentBorder: 'border-t-4 border-t-violet-500',
    text: 'text-violet-950 dark:text-violet-300',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    dotBg: 'bg-violet-500',
    glowColor: 'sapphire',
  },
  {
    id: 'slate',
    aliases: ['#1e293b', 'slate'],
    name: 'Xám Sáng (Slate)',
    bg: 'bg-slate-50/75 dark:bg-slate-900/70 backdrop-blur-md',
    border: 'border-slate-200/90 dark:border-slate-800',
    accentBorder: 'border-t-4 border-t-slate-400 dark:border-t-slate-600',
    text: 'text-slate-800 dark:text-slate-200',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    dotBg: 'bg-slate-400',
    glowColor: 'none',
  },
];

function getColorConfig(colorId?: string) {
  if (!colorId) return COLOR_PALETTES[0];
  const found = COLOR_PALETTES.find(
    (c) => c.id === colorId || c.aliases.includes(colorId.toLowerCase())
  );
  return found || COLOR_PALETTES[0];
}

export default function NotesGrid() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorColor, setEditorColor] = useState(COLOR_PALETTES[0].id);
  const [editorIsPinned, setEditorIsPinned] = useState(false);
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Fetch Notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : data.notes || []);
      } else {
        setErrorMessage('Không thể tải danh sách ghi chú. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Lỗi khi tải ghi chú:', err);
      setErrorMessage('Lỗi kết nối khi tải danh sách ghi chú.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Distinct tags list
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      n.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [notes]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        searchQuery === '' ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = !selectedTag || note.tags?.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTag]);

  const pinnedNotes = useMemo(
    () => filteredNotes.filter((n) => n.isPinned),
    [filteredNotes]
  );
  const unpinnedNotes = useMemo(
    () => filteredNotes.filter((n) => !n.isPinned),
    [filteredNotes]
  );

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingNote(null);
    setEditorTitle('');
    setEditorContent('');
    setEditorColor(COLOR_PALETTES[0].id);
    setEditorIsPinned(false);
    setEditorTags([]);
    setTagInput('');
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorColor(note.color || COLOR_PALETTES[0].id);
    setEditorIsPinned(note.isPinned);
    setEditorTags([...(note.tags || [])]);
    setTagInput('');
    setIsEditorOpen(true);
  };

  // Save Note (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorTitle.trim() || saving) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      const payload = {
        title: editorTitle.trim(),
        content: editorContent,
        color: editorColor,
        isPinned: editorIsPinned,
        tags: editorTags,
      };

      if (editingNote) {
        // Update
        const res = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setNotes((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          setIsEditorOpen(false);
          setEditingNote(null);
        } else {
          const errData = await res.json().catch(() => null);
          setErrorMessage(errData?.error || 'Không thể cập nhật ghi chú. Vui lòng thử lại.');
        }
      } else {
        // Create
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setNotes((prev) => [created, ...prev]);
          setIsEditorOpen(false);
          setEditingNote(null);
        } else {
          const errData = await res.json().catch(() => null);
          setErrorMessage(errData?.error || 'Không thể tạo ghi chú. Vui lòng thử lại.');
        }
      }
    } catch (err) {
      console.error('Lỗi khi lưu ghi chú:', err);
      setErrorMessage('Lỗi kết nối khi lưu ghi chú.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Pin directly
  const handleTogglePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      } else {
        setErrorMessage('Không thể cập nhật trạng thái ghim ghi chú.');
      }
    } catch (err) {
      console.error('Lỗi khi ghim ghi chú:', err);
      setErrorMessage('Lỗi kết nối khi ghim ghi chú.');
    }
  };

  // Delete Note
  const handleDelete = async (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } else {
        setErrorMessage('Không thể xóa ghi chú. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi khi xóa ghi chú:', err);
      setErrorMessage('Lỗi kết nối khi xóa ghi chú.');
    }
  };

  // Copy Note Content
  const handleCopy = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add Tag in Editor
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !editorTags.includes(trimmed)) {
      setEditorTags([...editorTags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditorTags(editorTags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Dismissible Error Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="rounded-2xl p-4 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 dark:border-rose-500/50 backdrop-blur-md flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 text-sm shadow-sm"
            role="alert"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="truncate font-medium">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 transition-colors shrink-0"
              aria-label="Đóng thông báo lỗi"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Controls: Frosted Glass Panel with 3D Notebook & Dark Mode */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs uppercase font-mono tracking-widest text-[#F58220] dark:text-amber-400 font-bold bg-[#F58220]/10 dark:bg-[#F58220]/20 border border-[#F58220]/20 dark:border-[#F58220]/40 px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
              Ghi chép & Ý tưởng
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E5AA8] shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Frosted Glass & Pastel Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <img
              src="/icons/3d/notebook.png"
              alt="Notes"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-md hover:scale-110 hover:-rotate-3 transition-transform duration-300 shrink-0"
            />
            <span className="min-w-0 break-words">Quản lý Ghi chú</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Ghi chép nhanh các ý tưởng, mã nguồn, danh sách việc cần làm với thẻ gương mờ và màu sắc trực quan.
          </p>
        </div>

        {/* Primary CTA Button: Sunset Orange */}
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-semibold shadow-md shadow-[#F58220]/25 active:scale-95 transition-all text-sm self-start md:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span className="whitespace-nowrap">Ghi chú mới</span>
        </button>
      </div>

      {/* Filter and Search Bar: Glass Card */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, nội dung hoặc #thẻ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 rounded-xl bg-[#FAF3E3]/50 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0B1528] focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/20 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tags horizontal scroll */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedTag === null
                  ? 'bg-[#1E5AA8] text-white shadow-xs'
                  : 'bg-[#FAF3E3]/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 border border-[#F5E6C8] dark:border-slate-700'
              }`}
            >
              Tất cả ({notes.length})
            </button>
            {allTags.map((tag) => {
              const count = notes.filter((n) => n.tags?.includes(tag)).length;
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                    isSelected
                      ? 'bg-[#F58220] text-white font-semibold shadow-xs'
                      : 'bg-[#FAF3E3]/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 border border-[#F5E6C8] dark:border-slate-700'
                  }`}
                >
                  <span>#{tag}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-5 border border-white/60 dark:border-white/10 animate-pulse space-y-4"
            >
              <div className="h-5 bg-slate-200/70 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-200/70 dark:bg-slate-800 rounded-md w-full" />
                <div className="h-3.5 bg-slate-200/70 dark:bg-slate-800 rounded-md w-5/6" />
                <div className="h-3.5 bg-slate-200/70 dark:bg-slate-800 rounded-md w-2/3" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded-full w-14" />
                <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded-full w-12" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && notes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-2 border-dashed border-[#F5E6C8] dark:border-slate-800 p-10 rounded-3xl text-center max-w-lg mx-auto my-12"
        >
          <img
            src="/icons/3d/bulb.png"
            alt="Ideas"
            className="w-16 h-16 mx-auto mb-4 drop-shadow-md hover:scale-110 hover:-rotate-3 transition-transform duration-300"
          />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Chưa có ghi chú nào</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Bắt đầu tạo ghi chú đầu tiên của bạn để lưu lại ý tưởng, công thức, mã nguồn hoặc việc cần nhớ.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] text-white font-medium text-sm transition-all shadow-md shadow-[#F58220]/25 whitespace-nowrap shrink-0"
          >
            Tạo ghi chú mới
          </button>
        </motion.div>
      )}

      {/* Filtered Empty State */}
      {!loading && notes.length > 0 && filteredNotes.length === 0 && (
        <div className="glass-card p-8 rounded-2xl text-center max-w-md mx-auto my-8">
          <p className="text-slate-800 dark:text-slate-200 font-semibold">Không tìm thấy ghi chú phù hợp</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn nhãn khác.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTag(null);
            }}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-[#FAF3E3] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 text-xs font-medium border border-[#F5E6C8] dark:border-slate-700 whitespace-nowrap shrink-0"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Pinned Notes Grid */}
      {!loading && pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F58220] dark:text-amber-400">
            <img
              src="/icons/3d/pin.png"
              alt="Pinned"
              className="w-4 h-4 object-contain drop-shadow-2xs hover:scale-110 hover:rotate-12 transition-transform duration-300 shrink-0"
            />
            <span className="whitespace-nowrap">Đã ghim ({pinnedNotes.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => handleOpenEdit(note)}
                  onTogglePin={(e) => handleTogglePin(note, e)}
                  onDelete={(e) => handleDelete(note.id, e)}
                  onCopy={(e) => handleCopy(note, e)}
                  isCopied={copiedId === note.id}
                  onSelectTag={(t) => setSelectedTag(t)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Unpinned Notes Grid */}
      {!loading && unpinnedNotes.length > 0 && (
        <div className="space-y-3">
          {pinnedNotes.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-3">
              <span className="whitespace-nowrap">Ghi chú khác ({unpinnedNotes.length})</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {unpinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => handleOpenEdit(note)}
                  onTogglePin={(e) => handleTogglePin(note, e)}
                  onDelete={(e) => handleDelete(note.id, e)}
                  onCopy={(e) => handleCopy(note, e)}
                  isCopied={copiedId === note.id}
                  onSelectTag={(t) => setSelectedTag(t)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={handleOpenCreate}
        className="fixed bottom-24 right-4 lg:hidden z-30 w-14 h-14 rounded-full bg-gradient-to-tr from-[#1E5AA8] to-[#F58220] text-white shadow-xl shadow-[#F58220]/30 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
        aria-label="Tạo ghi chú mới"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Responsive Note Editor Modal */}
      <ResponsiveModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
        title={editingNote ? 'Chỉnh sửa ghi chú' : 'Ghi chú mới'}
        subtitle="Soạn thảo ý tưởng, danh sách việc cần làm hoặc lưu lại mã nguồn"
        icon={
          <img
            src="/icons/3d/pencil.png"
            alt="Edit Note"
            className="w-6 h-6 object-contain drop-shadow-xs shrink-0"
          />
        }
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tiêu đề <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Tiêu đề ghi chú..."
              value={editorTitle}
              onChange={(e) => setEditorTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#111F38] focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/20 outline-none transition-all"
            />
          </div>

          {/* Content Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Nội dung (hỗ trợ Markdown)
              </label>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => setEditorContent((prev) => prev + '\n- [ ] ')}
                  className="px-2 py-0.5 rounded bg-[#FAF3E3] dark:bg-slate-800 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 font-medium border border-[#F5E6C8] dark:border-slate-700 whitespace-nowrap shrink-0"
                >
                  + Checklist
                </button>
                <button
                  type="button"
                  onClick={() => setEditorContent((prev) => prev + '`code`')}
                  className="px-2 py-0.5 rounded bg-[#FAF3E3] dark:bg-slate-800 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 font-medium border border-[#F5E6C8] dark:border-slate-700 whitespace-nowrap shrink-0"
                >
                  + Code
                </button>
              </div>
            </div>
            <textarea
              rows={8}
              placeholder="Viết nội dung ghi chú ở đây..."
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-mono focus:bg-white dark:focus:bg-[#111F38] focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/20 outline-none resize-y transition-all"
            />
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#1E5AA8] dark:text-sky-400" /> Màu sắc thẻ
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_PALETTES.map((color) => {
                const isSelected =
                  editorColor === color.id || color.aliases.includes(editorColor.toLowerCase());
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setEditorColor(color.id)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform shrink-0 ${color.dotBg} ${
                      isSelected
                        ? 'scale-110 border-slate-900 dark:border-white shadow-md ring-2 ring-[#F58220]'
                        : 'border-white opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    title={color.name}
                  />
                );
              })}
            </div>
          </div>

          {/* Tags Management */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#1E5AA8] dark:text-sky-400" /> Thẻ (#tags)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Thêm thẻ (nhấn Enter hoặc bấm Thêm)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#FAF3E3]/50 dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:bg-white dark:focus:bg-[#111F38] focus:border-[#1E5AA8] dark:focus:border-sky-400 outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-[#FAF3E3] dark:bg-slate-800 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-[#F5E6C8] dark:border-slate-700 whitespace-nowrap shrink-0"
              >
                Thêm
              </button>
            </div>

            {editorTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {editorTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1E5AA8]/10 dark:bg-[#1E5AA8]/20 border border-[#1E5AA8]/20 dark:border-[#1E5AA8]/40 text-[#1E5AA8] dark:text-sky-300 text-xs font-medium whitespace-nowrap shrink-0"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-500 transition-colors"
                      aria-label={`Xóa thẻ ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pin Toggle */}
          <div className="pt-2">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none p-2 rounded-xl hover:bg-[#FAF3E3] dark:hover:bg-[#111F38] transition-colors">
              <input
                type="checkbox"
                checked={editorIsPinned}
                onChange={(e) => setEditorIsPinned(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                  editorIsPinned ? 'bg-[#F58220]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    editorIsPinned ? 'left-4' : 'left-1'
                  }`}
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                <img
                  src="/icons/3d/pin.png"
                  alt="Pin"
                  className="w-4 h-4 object-contain shrink-0"
                />
                Ghim ghi chú này lên đầu trang
              </span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F5E6C8] dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsEditorOpen(false);
                setEditingNote(null);
              }}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#FAF3E3] dark:hover:bg-slate-800 text-xs font-medium transition-all border border-[#F5E6C8] dark:border-slate-700 whitespace-nowrap shrink-0"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1E5AA8] to-[#F58220] hover:from-[#174684] hover:to-[#e06d0b] disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-[#F58220]/20 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {saving ? 'Đang lưu...' : editingNote ? 'Cập nhật' : 'Tạo ghi chú'}
            </button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}

// Subcomponent: Individual Note Card with Translucent Frosted Glass, 3D Hover Lift & Color-Coded Accents
interface NoteCardProps {
  note: Note;
  onEdit: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onCopy: (e: React.MouseEvent) => void;
  isCopied: boolean;
  onSelectTag: (tag: string) => void;
}

function NoteCard({
  note,
  onEdit,
  onTogglePin,
  onDelete,
  onCopy,
  isCopied,
  onSelectTag,
}: NoteCardProps) {
  const colorConfig = getColorConfig(note.color);

  // Format date helper
  const dateStr = useMemo(() => {
    if (!note.createdAt) return '';
    try {
      const d = new Date(note.createdAt);
      return d.toLocaleDateString('vi-VN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, [note.createdAt]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-full"
    >
      <GlassCard
        onClick={onEdit}
        tilt={true}
        glowColor={colorConfig.glowColor}
        className={`group h-full flex flex-col justify-between ${colorConfig.bg} ${colorConfig.border} ${colorConfig.accentBorder} transition-all duration-300 hover:-translate-y-1`}
        padding="p-5"
      >
        <div>
          {/* Top actions bar */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug line-clamp-2 flex-1 min-w-0 break-words">
              {note.title}
            </h3>
            <button
              type="button"
              onClick={onTogglePin}
              className={`p-1.5 rounded-lg transition-all shrink-0 ${
                note.isPinned
                  ? 'text-[#F58220] bg-[#FFF7ED] dark:bg-amber-950/60 border border-[#F58220]/30 dark:border-[#F58220]/50 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-[#FAF3E3] dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100'
              }`}
              title={note.isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
              aria-label={note.isPinned ? 'Bỏ ghim ghi chú' : 'Ghim ghi chú'}
            >
              {note.isPinned ? (
                <img
                  src="/icons/3d/pin.png"
                  alt="Pinned"
                  className="w-4 h-4 object-contain"
                />
              ) : (
                <Pin className="w-4 h-4 rotate-45" />
              )}
            </button>
          </div>

          {/* Content Preview: Scrollable if Long */}
          <div className="max-h-[220px] overflow-y-auto overscroll-contain custom-scrollbar pr-1 mb-3">
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm whitespace-pre-line font-normal leading-relaxed min-w-0 break-words">
              {note.content || '(Không có nội dung)'}
            </p>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {note.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag(tag);
                  }}
                  className="px-2 py-0.5 rounded-md bg-[#FFFCF7]/90 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-[#F5E6C8] dark:border-slate-700 shadow-2xs transition-colors whitespace-nowrap shrink-0"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F5E6C8]/70 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 text-[11px] whitespace-nowrap shrink-0">
            <Clock className="w-3 h-3 text-[#1E5AA8] dark:text-sky-400 shrink-0" />
            <span>{dateStr}</span>
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={onCopy}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors relative shrink-0"
              title="Sao chép nội dung"
              aria-label="Sao chép nội dung ghi chú"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0"
              title="Xóa ghi chú"
              aria-label="Xóa ghi chú"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
