'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Heart,
  Globe,
  Share2,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  BookMarked,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Type,
  Sun,
  Moon,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Tag as TagIcon,
  Eye,
} from 'lucide-react';
import type { Article } from '@/types/lifeos';

type ReaderTheme = 'oled' | 'sepia' | 'paper';
type ReaderFont = 'serif' | 'sans' | 'mono';

const CATEGORIES = [
  'Tất cả',
  'Công nghệ',
  'Phát triển bản thân',
  'Kỹ thuật số',
  'Thiết kế',
  'Tư duy & Triết học',
  'Sách & Trích dẫn',
  'Cuộc sống',
];

export default function ArticlesStudio() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'reading' | 'completed' | 'favorite'>('all');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Reader Mode States: Default to 'paper' (Vanilla Cream editorial surface)
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('paper');
  const [readerFont, setReaderFont] = useState<ReaderFont>('serif');
  const [readerFontSize, setReaderFontSize] = useState<number>(18);
  const [readerLineHeight, setReaderLineHeight] = useState<number>(1.85);
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const readerScrollRef = useRef<HTMLDivElement>(null);

  // Editor Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorSlug, setEditorSlug] = useState('');
  const [editorCategory, setEditorCategory] = useState('Công nghệ');
  const [editorExcerpt, setEditorExcerpt] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorCoverImage, setEditorCoverImage] = useState('');
  const [editorReadingTime, setEditorReadingTime] = useState<number>(3);
  const [editorIsPublic, setEditorIsPublic] = useState(false);
  const [editorIsFavorite, setEditorIsFavorite] = useState(false);
  const [editorReadStatus, setEditorReadStatus] = useState<'unread' | 'reading' | 'completed'>('unread');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Copied link toast state
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Fetch articles
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : data.articles || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách bài viết:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      // Tab filter
      if (activeTab === 'unread' && art.readStatus !== 'unread') return false;
      if (activeTab === 'reading' && art.readStatus !== 'reading') return false;
      if (activeTab === 'completed' && art.readStatus !== 'completed') return false;
      if (activeTab === 'favorite' && !art.isFavorite) return false;

      // Category filter
      if (selectedCategory !== 'Tất cả' && art.category !== selectedCategory) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = art.title.toLowerCase().includes(q);
        const matchesExcerpt = art.excerpt?.toLowerCase().includes(q);
        const matchesContent = art.content?.toLowerCase().includes(q);
        const matchesTag = art.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesExcerpt && !matchesContent && !matchesTag) return false;
      }

      return true;
    });
  }, [articles, activeTab, selectedCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: articles.length,
      unread: articles.filter((a) => a.readStatus === 'unread').length,
      reading: articles.filter((a) => a.readStatus === 'reading').length,
      completed: articles.filter((a) => a.readStatus === 'completed').length,
      favorites: articles.filter((a) => a.isFavorite).length,
    };
  }, [articles]);

  // Handle Open Create
  const handleOpenCreate = () => {
    setEditingArticle(null);
    setEditorTitle('');
    setEditorSlug('');
    setEditorCategory('Công nghệ');
    setEditorExcerpt('');
    setEditorContent('');
    setEditorCoverImage('');
    setEditorReadingTime(3);
    setEditorIsPublic(false);
    setEditorIsFavorite(false);
    setEditorReadStatus('unread');
    setEditorTags([]);
    setTagInput('');
    setIsEditorOpen(true);
  };

  // Handle Open Edit
  const handleOpenEdit = (art: Article) => {
    setEditingArticle(art);
    setEditorTitle(art.title);
    setEditorSlug(art.slug);
    setEditorCategory(art.category || 'Công nghệ');
    setEditorExcerpt(art.excerpt || '');
    setEditorContent(art.content || '');
    setEditorCoverImage(art.coverImage || '');
    setEditorReadingTime(art.readingTime || 3);
    setEditorIsPublic(art.isPublic);
    setEditorIsFavorite(art.isFavorite);
    setEditorReadStatus(art.readStatus);
    setEditorTags([...(art.tags || [])]);
    setTagInput('');
    setIsEditorOpen(true);
  };

  // Auto calculate reading time when content changes
  const handleContentChange = (val: string) => {
    setEditorContent(val);
    const words = val.trim().split(/\s+/).filter(Boolean).length;
    const estTime = Math.max(1, Math.ceil(words / 200));
    setEditorReadingTime(estTime);
  };

  // Auto generate slug from title if not set
  const handleTitleChange = (val: string) => {
    setEditorTitle(val);
    if (!editingArticle) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      setEditorSlug(generated);
    }
  };

  // Save / Update Article
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorTitle.trim() || !editorSlug.trim()) return;

    try {
      setSaving(true);
      const payload = {
        title: editorTitle.trim(),
        slug: editorSlug.trim(),
        category: editorCategory,
        excerpt: editorExcerpt.trim() || null,
        content: editorContent.trim() || null,
        coverImage: editorCoverImage.trim() || null,
        readingTime: editorReadingTime,
        isPublic: editorIsPublic,
        isFavorite: editorIsFavorite,
        readStatus: editorReadStatus,
        tags: editorTags,
      };

      if (editingArticle) {
        const res = await fetch(`/api/articles/${editingArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const updated = await res.json();
          setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          if (readingArticle?.id === updated.id) setReadingArticle(updated);
          setIsEditorOpen(false);
        }
      } else {
        const res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const created = await res.json();
          setArticles((prev) => [created, ...prev]);
          setIsEditorOpen(false);
        }
      }
    } catch (err) {
      console.error('Lỗi khi lưu bài viết:', err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (art: Article, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updatedFav = !art.isFavorite;
      const res = await fetch(`/api/articles/${art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: updatedFav }),
      });
      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) => (a.id === art.id ? { ...a, isFavorite: updatedFav } : a))
        );
        if (readingArticle?.id === art.id) {
          setReadingArticle((prev) => (prev ? { ...prev, isFavorite: updatedFav } : null));
        }
      }
    } catch (err) {
      console.error('Lỗi cập nhật yêu thích:', err);
    }
  };

  // Toggle Public status
  const handleTogglePublic = async (art: Article, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updatedPublic = !art.isPublic;
      const res = await fetch(`/api/articles/${art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: updatedPublic }),
      });
      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) => (a.id === art.id ? { ...a, isPublic: updatedPublic } : a))
        );
        if (readingArticle?.id === art.id) {
          setReadingArticle((prev) => (prev ? { ...prev, isPublic: updatedPublic } : null));
        }
      }
    } catch (err) {
      console.error('Lỗi cập nhật chia sẻ công khai:', err);
    }
  };

  // Change Read Status
  const handleChangeStatus = async (
    art: Article,
    status: 'unread' | 'reading' | 'completed'
  ) => {
    try {
      const res = await fetch(`/api/articles/${art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readStatus: status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        if (readingArticle?.id === updated.id) setReadingArticle(updated);
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đọc:', err);
    }
  };

  // Delete Article
  const handleDelete = async (artId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      const res = await fetch(`/api/articles/${artId}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== artId));
        if (readingArticle?.id === artId) setReadingArticle(null);
      }
    } catch (err) {
      console.error('Lỗi khi xóa bài viết:', err);
    }
  };

  // Copy Public Link
  const handleCopyPublicLink = (slug: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  // Reader Mode: Scroll progress handler
  const handleReaderScroll = () => {
    if (!readerScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = readerScrollRef.current;
    if (scrollHeight <= clientHeight) {
      setReadingProgress(100);
    } else {
      const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100));
      setReadingProgress(progress);
    }
  };

  // Reader Mode: Next and Previous Article in the current filtered list
  const currentReaderIndex = useMemo(() => {
    if (!readingArticle) return -1;
    return filteredArticles.findIndex((a) => a.id === readingArticle.id);
  }, [readingArticle, filteredArticles]);

  const prevArticle = currentReaderIndex > 0 ? filteredArticles[currentReaderIndex - 1] : null;
  const nextArticle =
    currentReaderIndex >= 0 && currentReaderIndex < filteredArticles.length - 1
      ? filteredArticles[currentReaderIndex + 1]
      : null;

  // Reader Theme Styles - Warm Vanilla Cream 'paper' theme
  const readerThemeStyles = {
    paper: {
      wrapper: 'bg-[#FAF3E3] dark:bg-[#0B1528] text-[#1E293B] dark:text-slate-100',
      header: 'bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 border-[#F5E6C8] dark:border-slate-800 text-[#1E5AA8] dark:text-slate-100 shadow-sm',
      body: 'text-[#2D3748] dark:text-slate-200',
      accent: 'text-[#1E5AA8] dark:text-blue-400',
      meta: 'text-slate-600 dark:text-slate-400',
      tag: 'bg-[#F5E6C8]/50 dark:bg-[#1E5AA8]/20 border-[#F5E6C8] dark:border-slate-700 text-[#1E5AA8] dark:text-blue-400',
      btn: 'bg-[#FFFCF7] dark:bg-[#111F38] hover:bg-[#F5E6C8]/50 dark:hover:bg-[#162746] text-[#1E5AA8] dark:text-slate-100 border-[#F5E6C8] dark:border-slate-800',
    },
    sepia: {
      wrapper: 'bg-[#fbf0d9] text-[#3c2f1f]',
      header: 'bg-[#f4e6ca]/95 border-[#e8d2b2] text-[#3c2f1f]',
      body: 'text-[#433422]',
      accent: 'text-[#92400e]',
      meta: 'text-[#78644e]',
      tag: 'bg-[#f1dec0] border-[#dec29c] text-[#5e4933]',
      btn: 'bg-[#f1dec0] hover:bg-[#e8cca8] text-[#3c2f1f] border-[#dec29c]',
    },
    oled: {
      wrapper: 'bg-black text-zinc-100',
      header: 'bg-black/90 border-zinc-800 text-zinc-100',
      body: 'text-zinc-200',
      accent: 'text-[#F58220]',
      meta: 'text-zinc-500',
      tag: 'bg-zinc-900 border-zinc-800 text-zinc-400',
      btn: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800',
    },
  }[readerTheme];

  const readerFontClass = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
  }[readerFont];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E5AA8] dark:text-slate-100 flex items-center gap-3">
            <img
              src="/icons/3d/bookmark.png"
              alt="Bookmark"
              className="w-9 h-9 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
            />
            Studio Bài viết & Chế độ Đọc
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Quản lý kho tri thức, danh sách đọc tập trung và chia sẻ bài viết công khai với link độc lập
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-medium shadow-md shadow-[#F58220]/25 active:scale-95 transition-all text-sm self-start md:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Viết bài mới</span>
        </button>
      </div>

      {/* Reading List Tabs & Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'all'
              ? 'bg-[#F5E6C8]/60 dark:bg-[#1E5AA8]/30 border-[#1E5AA8] ring-2 ring-[#1E5AA8]/20 shadow-md'
              : 'bg-[#FFFCF7] dark:bg-[#111F38] border-[#F5E6C8] dark:border-slate-800 hover:border-[#1E5AA8]/30 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Tất cả bài viết</div>
          <div className="text-xl font-bold text-[#1E5AA8] dark:text-slate-100 mt-1 flex items-baseline justify-between">
            {stats.total}
            <BookMarked className="w-4 h-4 text-[#1E5AA8] dark:text-blue-400" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'unread'
              ? 'bg-[#F5E6C8]/60 dark:bg-[#F58220]/25 border-[#F58220] ring-2 ring-[#F58220]/20 shadow-md'
              : 'bg-[#FFFCF7] dark:bg-[#111F38] border-[#F5E6C8] dark:border-slate-800 hover:border-[#F58220]/40 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Chưa đọc (Unread)</div>
          <div className="text-xl font-bold text-[#F58220] dark:text-[#F58220] mt-1 flex items-baseline justify-between">
            {stats.unread}
            <Clock className="w-4 h-4 text-[#F58220]" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('reading')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'reading'
              ? 'bg-[#F5E6C8]/60 dark:bg-[#1E5AA8]/30 border-[#1E5AA8] ring-2 ring-[#1E5AA8]/20 shadow-md'
              : 'bg-[#FFFCF7] dark:bg-[#111F38] border-[#F5E6C8] dark:border-slate-800 hover:border-[#1E5AA8]/40 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Đang đọc (Reading)</div>
          <div className="text-xl font-bold text-[#1E5AA8] dark:text-slate-100 mt-1 flex items-baseline justify-between">
            {stats.reading}
            <BookOpen className="w-4 h-4 text-[#1E5AA8] dark:text-blue-400" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'completed'
              ? 'bg-[#F5E6C8]/60 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-[#FFFCF7] dark:bg-[#111F38] border-[#F5E6C8] dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Đã xong (Completed)</div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-baseline justify-between">
            {stats.completed}
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFCF7] dark:bg-[#111F38] p-3.5 rounded-2xl border border-[#F5E6C8] dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, tóm tắt hoặc nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15 text-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 pl-1 font-medium whitespace-nowrap shrink-0">
            <Filter className="w-3.5 h-3.5" /> Chủ đề:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1E5AA8] text-white shadow-sm shadow-[#1E5AA8]/20'
                  : 'bg-[#FAF3E3] dark:bg-[#0B1528] text-slate-700 dark:text-slate-300 hover:bg-[#F5E6C8]/60 dark:hover:bg-[#162746] border border-[#F5E6C8] dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-[#FFFCF7] dark:bg-[#111F38] rounded-2xl border border-[#F5E6C8] dark:border-slate-800 h-80 animate-pulse p-4 space-y-4 shadow-sm">
              <div className="h-36 bg-[#FAF3E3] dark:bg-[#0B1528] rounded-xl" />
              <div className="h-5 bg-[#FAF3E3] dark:bg-[#0B1528] rounded w-3/4" />
              <div className="h-4 bg-[#FAF3E3] dark:bg-[#0B1528] rounded w-full" />
              <div className="h-4 bg-[#FAF3E3] dark:bg-[#0B1528] rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FFFCF7] dark:bg-[#111F38] p-12 rounded-3xl border border-[#F5E6C8] dark:border-slate-800 shadow-sm text-center max-w-lg mx-auto my-12"
        >
          <img
            src="/icons/3d/glasses.png"
            alt="Glasses"
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
          />
          <h3 className="text-lg font-semibold text-[#1E5AA8] dark:text-slate-100 mb-2">Chưa có bài viết nào</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Bắt đầu tạo bài viết mới hoặc lưu lại những trang sách tâm đắc để thưởng thức trong Chế độ Đọc tập trung.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-medium text-sm transition-all shadow-md shadow-[#F58220]/25 whitespace-nowrap shrink-0"
          >
            Tạo bài viết đầu tiên
          </button>
        </motion.div>
      )}

      {/* Filtered Empty State */}
      {!loading && articles.length > 0 && filteredArticles.length === 0 && (
        <div className="bg-[#FFFCF7] dark:bg-[#111F38] p-10 rounded-2xl border border-[#F5E6C8] dark:border-slate-800 shadow-sm text-center max-w-md mx-auto my-10">
          <p className="text-[#1E5AA8] dark:text-slate-100 font-medium">Không tìm thấy bài viết nào phù hợp</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hãy điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          <button
            onClick={() => {
              setActiveTab('all');
              setSelectedCategory('Tất cả');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] text-slate-700 dark:text-slate-300 text-xs font-medium border border-[#F5E6C8] dark:border-slate-800 hover:bg-[#F5E6C8]/60 dark:hover:bg-[#162746] whitespace-nowrap shrink-0"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Articles Grid */}
      {!loading && filteredArticles.length > 0 && (
        <div className="max-h-[72vh] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filteredArticles.map((art) => (
                <ArticleCard
                  key={art.id}
                  article={art}
                  onRead={() => {
                    setReadingArticle(art);
                    setReadingProgress(0);
                    if (art.readStatus === 'unread') {
                      handleChangeStatus(art, 'reading');
                    }
                  }}
                  onEdit={() => handleOpenEdit(art)}
                  onDelete={() => handleDelete(art.id)}
                  onToggleFavorite={(e) => handleToggleFavorite(art, e)}
                  onTogglePublic={(e) => handleTogglePublic(art, e)}
                  onCopyPublicLink={(e) => handleCopyPublicLink(art.slug, e)}
                  isCopied={copiedSlug === art.slug}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Fullscreen Reader Mode Overlay */}
      <AnimatePresence>
        {readingArticle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-900/40 backdrop-blur-md"
          >
            {/* Top Reading Progress Bar (Sunset Orange) */}
            <div className="h-1.5 bg-black/5 w-full">
              <div
                className="h-full bg-gradient-to-r from-[#F58220] to-[#E06D10] transition-all duration-150"
                style={{ width: `${readingProgress}%` }}
              />
            </div>

            {/* Reader Floating Header Bar */}
            <header
              className={`px-6 py-3.5 border-b flex items-center justify-between gap-4 backdrop-blur-md transition-colors ${readerThemeStyles.header}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setReadingArticle(null)}
                  className={`p-2 rounded-xl border transition-colors ${readerThemeStyles.btn}`}
                  title="Quay lại danh sách"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex items-center gap-2">
                  <img
                    src="/icons/3d/glasses.png"
                    alt="Reader"
                    className="w-6 h-6 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-sm hidden sm:inline"
                  />
                  <div>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider block leading-tight ${readerThemeStyles.accent}`}>
                      Chế độ Đọc Tập trung
                    </span>
                    <h3 className="font-bold text-sm truncate max-w-sm sm:max-w-md leading-tight">
                      {readingArticle.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Reader Controls Toolbar */}
              <div className="flex items-center gap-2">
                {/* Font Selector */}
                <div className="hidden sm:flex items-center border rounded-xl p-0.5 text-xs border-current/20">
                  <button
                    onClick={() => setReaderFont('serif')}
                    className={`px-2 py-1 rounded-lg font-serif transition-colors ${
                      readerFont === 'serif' ? 'bg-[#1E5AA8] text-white' : 'hover:opacity-80'
                    }`}
                  >
                    Serif
                  </button>
                  <button
                    onClick={() => setReaderFont('sans')}
                    className={`px-2 py-1 rounded-lg font-sans transition-colors ${
                      readerFont === 'sans' ? 'bg-[#1E5AA8] text-white' : 'hover:opacity-80'
                    }`}
                  >
                    Sans
                  </button>
                  <button
                    onClick={() => setReaderFont('mono')}
                    className={`px-2 py-1 rounded-lg font-mono transition-colors ${
                      readerFont === 'mono' ? 'bg-[#1E5AA8] text-white' : 'hover:opacity-80'
                    }`}
                  >
                    Mono
                  </button>
                </div>

                {/* Font Size Selector */}
                <div className="flex items-center border rounded-xl p-0.5 text-xs border-current/20">
                  <button
                    onClick={() => setReaderFontSize((s) => Math.max(14, s - 2))}
                    className="px-2 py-1 hover:opacity-80 font-bold"
                    title="Giảm kích thước chữ"
                  >
                    A-
                  </button>
                  <span className="px-1 text-[11px] font-mono opacity-80">{readerFontSize}</span>
                  <button
                    onClick={() => setReaderFontSize((s) => Math.min(26, s + 2))}
                    className="px-2 py-1 hover:opacity-80 font-bold"
                    title="Tăng kích thước chữ"
                  >
                    A+
                  </button>
                </div>

                {/* Theme Selector (Default: Paper Vanilla Cream, also supports Sepia & OLED) */}
                <div className="flex items-center border rounded-xl p-0.5 text-xs border-current/20">
                  <button
                    onClick={() => setReaderTheme('paper')}
                    className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                      readerTheme === 'paper' ? 'bg-[#1E5AA8] text-white' : 'hover:opacity-80'
                    }`}
                    title="Vanilla Cream Paper Theme (Mặc định)"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Paper</span>
                  </button>
                  <button
                    onClick={() => setReaderTheme('sepia')}
                    className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                      readerTheme === 'sepia' ? 'bg-[#92400e] text-white' : 'hover:opacity-80'
                    }`}
                    title="Warm Sepia Theme"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dfc092] border border-[#a27845]" />
                    <span className="hidden md:inline">Sepia</span>
                  </button>
                  <button
                    onClick={() => setReaderTheme('oled')}
                    className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                      readerTheme === 'oled' ? 'bg-zinc-800 text-white' : 'hover:opacity-80'
                    }`}
                    title="Dark OLED Theme"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">OLED</span>
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setReadingArticle(null)}
                  className={`p-2 rounded-xl border transition-colors ${readerThemeStyles.btn}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Scrollable Reader Content */}
            <div
              ref={readerScrollRef}
              onScroll={handleReaderScroll}
              className={`flex-1 overflow-y-auto overscroll-contain custom-scrollbar px-6 py-12 transition-colors ${readerThemeStyles.wrapper}`}
            >
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Cover Image in Reader */}
                {readingArticle.coverImage && (
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-[#F5E6C8] max-h-80 w-full mb-8">
                    <img
                      src={readingArticle.coverImage}
                      alt={readingArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Header Information */}
                <div className="space-y-4 border-b pb-6 border-current/15">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${readerThemeStyles.tag}`}>
                      {readingArticle.category}
                    </span>
                    <span className={`text-xs ${readerThemeStyles.meta}`}>
                      {new Date(readingArticle.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    {readingArticle.isPublic && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1E5AA8]/10 text-[#1E5AA8] border border-[#1E5AA8]/20 text-xs font-medium">
                        <Globe className="w-3 h-3" /> Công khai
                      </span>
                    )}
                  </div>

                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#1E5AA8] ${readerFontClass}`}>
                    {readingArticle.title}
                  </h1>

                  {readingArticle.excerpt && (
                    <p className="text-base sm:text-lg italic leading-relaxed opacity-85 border-l-2 pl-4 border-[#F58220]">
                      {readingArticle.excerpt}
                    </p>
                  )}
                </div>

                {/* Main Article Body Text */}
                <div
                  className={`prose-reader ${readerFontClass} ${readerThemeStyles.body}`}
                  style={{
                    fontSize: `${readerFontSize}px`,
                    lineHeight: readerLineHeight,
                  }}
                >
                  {readingArticle.content ? (
                    readingArticle.content.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('# ')) {
                        return (
                          <h1 key={pIdx} className="text-2xl font-bold mt-8 mb-4 text-[#1E5AA8]">
                            {paragraph.replace('# ', '')}
                          </h1>
                        );
                      }
                      if (paragraph.startsWith('## ')) {
                        return (
                          <h2 key={pIdx} className="text-xl font-bold mt-6 mb-3 text-[#1E5AA8]">
                            {paragraph.replace('## ', '')}
                          </h2>
                        );
                      }
                      if (paragraph.startsWith('> ')) {
                        return (
                          <blockquote key={pIdx} className="border-l-4 border-[#F58220] pl-4 py-1 italic my-4 opacity-90">
                            {paragraph.replace('> ', '')}
                          </blockquote>
                        );
                      }
                      return (
                        <p key={pIdx} className="mb-6 whitespace-pre-line leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    })
                  ) : (
                    <p className="italic opacity-60">Chưa có nội dung cho bài viết này.</p>
                  )}
                </div>

                {/* Article Footer & Status Action */}
                <div className="pt-10 border-t border-current/15 space-y-6">
                  {/* Mark as completed prompt */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-current/15 bg-current/5">
                    <div>
                      <h4 className="font-semibold text-sm">Bạn đã đọc xong bài viết này?</h4>
                      <p className={`text-xs mt-0.5 ${readerThemeStyles.meta}`}>
                        Cập nhật tiến trình của bạn trong danh sách đọc LifeOS.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {readingArticle.readStatus !== 'completed' ? (
                        <button
                          onClick={() => handleChangeStatus(readingArticle, 'completed')}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#F58220]/25"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã xong
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Đã hoàn thành
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Previous / Next Article Navigation */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    {prevArticle ? (
                      <button
                        onClick={() => {
                          setReadingArticle(prevArticle);
                          setReadingProgress(0);
                        }}
                        className={`flex-1 p-3.5 rounded-2xl border text-left transition-colors flex items-center gap-2 ${readerThemeStyles.btn}`}
                      >
                        <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                            Bài trước
                          </span>
                          <span className="text-xs font-semibold truncate block">
                            {prevArticle.title}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="flex-1" />
                    )}

                    {nextArticle ? (
                      <button
                        onClick={() => {
                          setReadingArticle(nextArticle);
                          setReadingProgress(0);
                        }}
                        className={`flex-1 p-3.5 rounded-2xl border text-right transition-colors flex items-center justify-end gap-2 ${readerThemeStyles.btn}`}
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                            Bài tiếp theo
                          </span>
                          <span className="text-xs font-semibold truncate block">
                            {nextArticle.title}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      </button>
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / Edit Article Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#FFFCF7] dark:bg-[#111F38] w-full max-w-3xl rounded-2xl p-6 shadow-2xl relative border border-[#F5E6C8] dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] overflow-y-auto overscroll-contain custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#F5E6C8]/60 dark:border-slate-800">
                <h2 className="text-lg font-bold text-[#1E5AA8] dark:text-slate-100 flex items-center gap-2">
                  <img
                    src="/icons/3d/pencil.png"
                    alt="Pencil"
                    className="w-6 h-6 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-sm"
                  />
                  {editingArticle ? 'Chỉnh sửa bài viết' : 'Soạn bài viết mới'}
                </h2>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveArticle} className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* Title and Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tiêu đề bài viết <span className="text-[#F58220]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập tiêu đề..."
                      value={editorTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Đường dẫn tĩnh (Slug URL) <span className="text-[#F58220]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="tieu-de-bai-viet"
                      value={editorSlug}
                      onChange={(e) => setEditorSlug(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-mono focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15"
                    />
                  </div>
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Chủ đề
                    </label>
                    <select
                      value={editorCategory}
                      onChange={(e) => setEditorCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15"
                    >
                      {CATEGORIES.filter((c) => c !== 'Tất cả').map((cat) => (
                        <option key={cat} value={cat} className="bg-white dark:bg-[#0B1528] text-slate-900 dark:text-slate-100">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Trạng thái đọc
                    </label>
                    <select
                      value={editorReadStatus}
                      onChange={(e) =>
                        setEditorReadStatus(e.target.value as 'unread' | 'reading' | 'completed')
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15"
                    >
                      <option value="unread" className="bg-white dark:bg-[#0B1528] text-slate-900 dark:text-slate-100">Chưa đọc</option>
                      <option value="reading" className="bg-white dark:bg-[#0B1528] text-slate-900 dark:text-slate-100">Đang đọc</option>
                      <option value="completed" className="bg-white dark:bg-[#0B1528] text-slate-900 dark:text-slate-100">Đã đọc xong</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Thời gian đọc (phút)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editorReadingTime}
                      onChange={(e) => setEditorReadingTime(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15"
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tóm tắt ngắn (Excerpt)
                  </label>
                  <input
                    type="text"
                    placeholder="Mô tả ngắn gọn về nội dung bài viết..."
                    value={editorExcerpt}
                    onChange={(e) => setEditorExcerpt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15"
                  />
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ảnh bìa (Cover Image URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={editorCoverImage}
                    onChange={(e) => setEditorCoverImage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nội dung bài viết (Markdown hỗ trợ # H1, ## H2, &gt; trích dẫn)
                  </label>
                  <textarea
                    rows={10}
                    placeholder="Viết nội dung bài viết của bạn tại đây..."
                    value={editorContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-sans focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15 resize-y"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Thẻ (#tags)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Thêm thẻ (nhấn Enter để thêm)..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = tagInput.trim().replace(/^#/, '');
                          if (val && !editorTags.includes(val)) {
                            setEditorTags([...editorTags, val]);
                            setTagInput('');
                          }
                        }
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = tagInput.trim().replace(/^#/, '');
                        if (val && !editorTags.includes(val)) {
                          setEditorTags([...editorTags, val]);
                          setTagInput('');
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] hover:bg-[#F5E6C8]/70 dark:hover:bg-[#162746] text-slate-700 dark:text-slate-300 text-xs font-medium border border-[#F5E6C8] dark:border-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      Thêm
                    </button>
                  </div>
                  {editorTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {editorTags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-[#1E5AA8] dark:text-blue-400 text-xs font-medium whitespace-nowrap shrink-0"
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => setEditorTags(editorTags.filter((x) => x !== t))}
                            className="hover:text-rose-500 ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Public & Favorite Toggles */}
                <div className="pt-2 flex flex-wrap gap-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editorIsPublic}
                      onChange={(e) => setEditorIsPublic(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        editorIsPublic ? 'bg-[#1E5AA8]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                          editorIsPublic ? 'left-4' : 'left-0.5'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-[#1E5AA8] dark:text-blue-400" /> Chia sẻ công khai (/p/{editorSlug || 'slug'})
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editorIsFavorite}
                      onChange={(e) => setEditorIsFavorite(e.target.checked)}
                      className="sr-only"
                    />
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        editorIsFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Yêu thích</span>
                  </label>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F5E6C8]/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] text-sm font-medium transition-all whitespace-nowrap shrink-0"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md shadow-[#F58220]/25 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    {saving ? 'Đang lưu...' : editingArticle ? 'Cập nhật' : 'Đăng bài'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponent: Individual Article Card
interface ArticleCardProps {
  article: Article;
  onRead: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onTogglePublic: (e: React.MouseEvent) => void;
  onCopyPublicLink: (e: React.MouseEvent) => void;
  isCopied: boolean;
}

function ArticleCard({
  article,
  onRead,
  onEdit,
  onDelete,
  onToggleFavorite,
  onTogglePublic,
  onCopyPublicLink,
  isCopied,
}: ArticleCardProps) {
  const statusBadge = {
    unread: { text: 'Chưa đọc', color: 'bg-[#F58220]/15 text-[#F58220] border-[#F58220]/30' },
    reading: { text: 'Đang đọc', color: 'bg-[#1E5AA8]/15 dark:bg-blue-950/40 text-[#1E5AA8] dark:text-blue-400 border-[#1E5AA8]/30 dark:border-blue-900/50' },
    completed: { text: 'Đã xong', color: 'bg-emerald-500/15 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-900/50' },
  }[article.readStatus];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#FFFCF7] dark:bg-[#111F38] rounded-2xl overflow-hidden border border-[#F5E6C8] dark:border-slate-800 hover:border-[#1E5AA8]/40 dark:hover:border-slate-700 flex flex-col justify-between group transition-all duration-300 shadow-sm hover:shadow-md"
    >
      <div>
        {/* Cover Image or Warm Vanilla Gradient */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-tr from-[#FAF3E3] via-[#F5E6C8]/40 to-[#FFFCF7] dark:from-[#0B1528] dark:via-[#111F38] dark:to-[#0B1528] border-b border-[#F5E6C8]/70 dark:border-slate-800">
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src="/icons/3d/file-text.png"
                alt="Article"
                className="w-14 h-14 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
              />
            </div>
          )}

          {/* Top badges over cover image */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-lg bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 backdrop-blur-md text-[#1E5AA8] dark:text-blue-400 text-[11px] font-semibold border border-[#F5E6C8] dark:border-slate-800 shadow-sm whitespace-nowrap shrink-0">
              {article.category || 'General'}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleFavorite}
                className="p-1.5 rounded-lg bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 backdrop-blur-md text-slate-400 hover:text-rose-500 transition-colors border border-[#F5E6C8] dark:border-slate-800 shadow-sm shrink-0"
                title={article.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    article.isFavorite ? 'text-rose-500 fill-rose-500' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Bottom badge over cover: Read status */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border backdrop-blur-md whitespace-nowrap shrink-0 ${statusBadge.color}`}>
              {statusBadge.text}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 backdrop-blur-md text-slate-700 dark:text-slate-300 text-[11px] border border-[#F5E6C8] dark:border-slate-800 flex items-center gap-1 font-medium shadow-sm whitespace-nowrap shrink-0">
              <Clock className="w-3 h-3 text-[#F58220]" />
              {article.readingTime || 1} phút
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          <h3
            onClick={onRead}
            className="font-bold text-[#1E5AA8] dark:text-slate-100 text-base leading-snug line-clamp-2 hover:text-[#F58220] cursor-pointer transition-colors min-w-0 break-words"
          >
            {article.title}
          </h3>

          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed min-w-0 break-words">
            {article.excerpt || article.content?.slice(0, 100) || '(Không có tóm tắt)'}
          </p>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium whitespace-nowrap shrink-0"
                >
                  #{tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="text-[11px] text-slate-400">+{article.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Public Sharing info */}
          {article.isPublic && (
            <div className="pt-2 flex items-center justify-between text-xs text-[#1E5AA8] dark:text-blue-400 bg-[#FAF3E3] dark:bg-[#0B1528] px-2.5 py-1.5 rounded-xl border border-[#F5E6C8] dark:border-slate-800">
              <span className="flex items-center gap-1 text-[11px] font-mono">
                <Globe className="w-3 h-3 text-[#1E5AA8] dark:text-blue-400" /> /p/{article.slug}
              </span>
              <button
                type="button"
                onClick={onCopyPublicLink}
                className="hover:text-[#F58220] transition-colors flex items-center gap-1 text-[11px] font-medium whitespace-nowrap shrink-0"
                title="Sao chép link chia sẻ công khai"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" /> Đã chép
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#F58220]" /> Chép link
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 pt-2 border-t border-[#F5E6C8]/60 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onRead}
          className="flex-1 px-3 py-2 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] hover:bg-[#F5E6C8]/60 dark:hover:bg-[#162746] text-[#1E5AA8] dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#F5E6C8] dark:border-slate-800 hover:border-[#1E5AA8]/30 dark:hover:border-slate-700 whitespace-nowrap shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Đọc ngay</span>
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="p-2 rounded-xl text-slate-400 hover:text-[#1E5AA8] dark:hover:text-blue-400 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] transition-colors shrink-0"
          title="Chỉnh sửa bài viết"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
          title="Xóa bài viết"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
