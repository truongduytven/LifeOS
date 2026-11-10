'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import type { Note } from '@/types/lifeos';

// Brand-Harmonious Pastel & Vanilla Color Palette Configuration with Dark Mode Support
export const COLOR_PALETTES = [
  {
    id: 'sapphire',
    aliases: ['#1e3a8a', '#1E5AA8', 'sapphire', 'indigo'],
    name: 'Xanh Lam (Sapphire)',
    bg: 'bg-[#EFF6FF]/90 dark:bg-blue-950/40',
    border: 'border-[#1E5AA8]/30 dark:border-[#1E5AA8]/50',
    accentBorder: 'border-t-4 border-t-[#1E5AA8]',
    text: 'text-[#1E5AA8] dark:text-sky-300',
    badge: 'bg-[#1E5AA8]/15 text-[#1E5AA8] dark:bg-blue-900/50 dark:text-sky-300',
    dotBg: 'bg-[#1E5AA8]',
  },
  {
    id: 'sunset',
    aliases: ['#78350f', '#F58220', 'sunset', 'amber'],
    name: 'Cam Hoàng Hôn (Sunset)',
    bg: 'bg-[#FFF7ED]/90 dark:bg-amber-950/40',
    border: 'border-[#F58220]/30 dark:border-[#F58220]/50',
    accentBorder: 'border-t-4 border-t-[#F58220]',
    text: 'text-[#F58220] dark:text-amber-300',
    badge: 'bg-[#F58220]/15 text-[#F58220] dark:bg-amber-900/50 dark:text-amber-300',
    dotBg: 'bg-[#F58220]',
  },
  {
    id: 'vanilla',
    aliases: ['#FAF3E3', '#F5E6C8', 'vanilla'],
    name: 'Kem Vani (Vanilla)',
    bg: 'bg-[#FAF3E3]/90 dark:bg-[#111F38]/80',
    border: 'border-[#F5E6C8] dark:border-slate-800',
    accentBorder: 'border-t-4 border-t-[#F5E6C8] dark:border-t-slate-600',
    text: 'text-slate-800 dark:text-slate-100',
    badge: 'bg-[#F5E6C8] text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    dotBg: 'bg-[#F5E6C8]',
  },
  {
    id: 'emerald',
    aliases: ['#064e3b', '#10b981', 'emerald'],
    name: 'Ngọc Bích (Emerald)',
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    border: 'border-emerald-200/80 dark:border-emerald-800/50',
    accentBorder: 'border-t-4 border-t-emerald-500',
    text: 'text-emerald-950 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    dotBg: 'bg-emerald-500',
  },
  {
    id: 'rose',
    aliases: ['#881337', '#e11d48', 'rose'],
    name: 'Hoa Hồng (Rose)',
    bg: 'bg-rose-50/80 dark:bg-rose-950/40',
    border: 'border-rose-200/80 dark:border-rose-800/50',
    accentBorder: 'border-t-4 border-t-rose-500',
    text: 'text-rose-950 dark:text-rose-300',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    dotBg: 'bg-rose-500',
  },
  {
    id: 'violet',
    aliases: ['#581c87', '#8b5cf6', 'violet'],
    name: 'Thạch Anh (Violet)',
    bg: 'bg-violet-50/80 dark:bg-violet-950/40',
    border: 'border-violet-200/80 dark:border-violet-800/50',
    accentBorder: 'border-t-4 border-t-violet-500',
    text: 'text-violet-950 dark:text-violet-300',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    dotBg: 'bg-violet-500',
  },
  {
    id: 'slate',
    aliases: ['#1e293b', 'slate'],
    name: 'Xám Sáng (Slate)',
    bg: 'bg-slate-50/90 dark:bg-slate-900/80',
    border: 'border-slate-200/90 dark:border-slate-800',
    accentBorder: 'border-t-4 border-t-slate-400 dark:border-t-slate-600',
    text: 'text-slate-800 dark:text-slate-200',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    dotBg: 'bg-slate-400',
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

  // Accessible Dialog Ref
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Fetch Notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : data.notes || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải ghi chú:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Synchronize modal state with native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isEditorOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isEditorOpen]);

  const handleDialogClose = () => {
    setIsEditorOpen(false);
    setEditingNote(null);
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
        setIsEditorOpen(false);
        setEditingNote(null);
      }
    }
  };

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
        }
      }
    } catch (err) {
      console.error('Lỗi khi lưu ghi chú:', err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Pin directly
  const handleTogglePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      }
    } catch (err) {
      console.error('Lỗi khi ghim ghi chú:', err);
    }
  };

  // Delete Note
  const handleDelete = async (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (err) {
      console.error('Lỗi khi xóa ghi chú:', err);
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
      {/* Header & Controls: Vanilla Cream & Sunset Orange Hero with 3D Notebook & Dark Mode */}
      <div className="bg-gradient-to-r from-[#FAF3E3]/95 via-[#F5E6C8]/60 to-[#FFF7ED]/90 dark:from-[#0C1E38]/90 dark:via-[#111F38]/80 dark:to-[#0B1528]/95 border border-[#F5E6C8] dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs uppercase font-mono tracking-widest text-[#F58220] dark:text-amber-400 font-bold bg-[#F58220]/10 dark:bg-[#F58220]/20 border border-[#F58220]/20 dark:border-[#F58220]/40 px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
              Ghi chép & Ý tưởng
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E5AA8] shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Vanilla & Pastel Studio</span>
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
            Ghi chép nhanh các ý tưởng, mã nguồn, danh sách việc cần làm với nhãn và màu sắc hài hòa.
          </p>
        </div>

        {/* Primary CTA Button: Sunset Orange */}
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F58220] hover:bg-[#e06d0b] text-white font-medium shadow-md shadow-[#F58220]/25 active:scale-95 transition-all text-sm self-start md:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Ghi chú mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 p-3.5 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
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

        {/* Tags Quick Carousel: Smooth Horizontal Scroll */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar max-w-full md:max-w-md">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 pl-1 pr-1 font-medium whitespace-nowrap shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#1E5AA8] dark:text-sky-400" /> Lọc:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all border ${
                selectedTag === null
                  ? 'bg-[#1E5AA8] text-white border-[#1E5AA8] shadow-xs font-bold'
                  : 'bg-[#FFFCF7] text-slate-600 hover:bg-[#FAF3E3] border-[#F5E6C8] dark:bg-[#0B1528] dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              Tất cả ({notes.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all border ${
                  selectedTag === tag
                    ? 'bg-[#1E5AA8] text-white border-[#1E5AA8] shadow-xs font-bold'
                    : 'bg-[#FFFCF7] text-slate-600 hover:bg-[#FAF3E3] border-[#F5E6C8] dark:bg-[#0B1528] dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 h-44 rounded-2xl animate-pulse p-5 space-y-3 shadow-xs">
              <div className="h-5 bg-[#F5E6C8]/60 dark:bg-slate-700 rounded-md w-3/4" />
              <div className="h-4 bg-[#FAF3E3] dark:bg-slate-800 rounded-md w-full" />
              <div className="h-4 bg-[#FAF3E3] dark:bg-slate-800 rounded-md w-2/3" />
              <div className="h-6 bg-[#FAF3E3] dark:bg-slate-800 rounded-md w-1/3 mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && notes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FFFCF7] dark:bg-[#111F38] border-2 border-dashed border-[#F5E6C8] dark:border-slate-800 p-10 rounded-2xl text-center max-w-lg mx-auto my-12 shadow-xs"
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
            className="px-5 py-2.5 rounded-xl bg-[#F58220] hover:bg-[#e06d0b] text-white font-medium text-sm transition-all shadow-md shadow-[#F58220]/25 whitespace-nowrap shrink-0"
          >
            Tạo ghi chú mới
          </button>
        </motion.div>
      )}

      {/* Filtered Empty State */}
      {!loading && notes.length > 0 && filteredNotes.length === 0 && (
        <div className="bg-[#FFFCF7] dark:bg-[#111F38] border border-[#F5E6C8] dark:border-slate-800 p-8 rounded-2xl text-center max-w-md mx-auto my-8 shadow-xs">
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

      {/* Note Editor Modal (Native Accessible Dialog) */}
      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        onClick={handleDialogBackdropClick}
        aria-labelledby="note-dialog-title"
        className="backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm bg-transparent p-0 max-w-2xl w-[calc(100%-2rem)] mx-auto rounded-2xl shadow-2xl border border-[#F5E6C8] dark:border-slate-800 text-slate-800 dark:text-slate-100 overflow-hidden my-auto max-h-[90dvh] sm:max-h-[85vh]"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="bg-[#FFFCF7] dark:bg-[#0B1528] p-5 sm:p-7 space-y-5 max-h-[90dvh] sm:max-h-[85vh] overflow-y-auto overscroll-contain custom-scrollbar">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#F5E6C8] dark:border-slate-800">
            <h2 id="note-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <img
                src="/icons/3d/pencil.png"
                alt="Edit Note"
                className="w-6 h-6 object-contain drop-shadow-xs shrink-0"
              />
              <span className="min-w-0 break-words">{editingNote ? 'Chỉnh sửa ghi chú' : 'Ghi chú mới'}</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-[#FAF3E3] dark:hover:bg-slate-800 transition-all shrink-0"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
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
                onClick={() => setIsEditorOpen(false)}
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
        </div>
      </dialog>
    </div>
  );
}

// Subcomponent: Individual Note Card with Vanilla & Brand Accent + Dark Mode
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
      onClick={onEdit}
      className={`group relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between ${colorConfig.bg} ${colorConfig.border} ${colorConfig.accentBorder} shadow-xs`}
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
                className="px-2 py-0.5 rounded-md bg-[#FFFCF7] dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-[#F5E6C8] dark:border-slate-700 shadow-2xs transition-colors whitespace-nowrap shrink-0"
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
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
