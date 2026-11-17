'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
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
  Sun,
  Moon,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { Article } from '@/types/lifeos';
import GlassCard from '@/components/ui/GlassCard';
import Icon3D from '@/components/ui/Icon3D';

type ReaderTheme = 'oled' | 'sepia' | 'paper';
type ReaderFont = 'serif' | 'sans' | 'mono';

function isSafeCoverUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  );
}

interface ArticleCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  lazy?: boolean;
  surfaceOverride?: {
    background: string;
    text: string;
    borderColor?: string;
  };
  children?: React.ReactNode;
}

function ArticleCoverImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  priority = false,
  lazy = false,
  surfaceOverride,
  children,
}: ArticleCoverImageProps) {
  const trimmedSrc = src?.trim() || '';
  const hasSrc = Boolean(trimmedSrc);
  const isSafe = isSafeCoverUrl(trimmedSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [trimmedSrc]);

  return (
    <div
      className={`relative w-full aspect-video overflow-hidden ${
        surfaceOverride
          ? ''
          : 'bg-gradient-to-tr from-[#FAF3E3] via-[#F5E6C8]/40 to-[#FFFCF7] dark:from-[#0B1528] dark:via-[#111F38] dark:to-[#0B1528]'
      } backdrop-blur-md ${className}`}
      style={
        surfaceOverride
          ? {
              background: surfaceOverride.background,
              borderColor: surfaceOverride.borderColor,
            }
          : undefined
      }
    >
      {hasSrc && isSafe && !hasError ? (
        <img
          src={trimmedSrc}
          alt={alt}
          loading={lazy ? 'lazy' : undefined}
          fetchPriority={priority ? 'high' : undefined}
          className={`w-full h-full object-cover object-center ${imgClassName}`}
          onError={() => setHasError(true)}
        />
      ) : hasSrc ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-4 text-center">
          <Icon3D name="bookmark" size={40} />
          <span
            className={`text-[11px] font-medium ${
              surfaceOverride ? '' : 'text-slate-500 dark:text-slate-400'
            }`}
            style={surfaceOverride ? { color: surfaceOverride.text } : undefined}
          >
            Không thể tải ảnh bìa
          </span>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/icons/3d/file-text.png"
            alt="Article"
            className="w-14 h-14 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
          />
        </div>
      )}
      {children}
    </div>
  );
}

const CATEGORIES = [
  'Tất cả',
  'Công nghệ',
  'Phát triển bản thân',
  'Kỹ thuật số',
  'Thiết kế',
  'Tư duy & Triết học',
  'Sách & Trích dẫn',
  'Cuộc sống',
  'Chung',
];

export default function ArticlesStudio() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'reading' | 'completed' | 'favorite'>('all');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Reader Mode States: Default to 'paper' (Vanilla Cream editorial surface)
  const [mounted, setMounted] = useState(false);
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('paper');
  const [readerFont, setReaderFont] = useState<ReaderFont>('serif');
  const [readerFontSize, setReaderFontSize] = useState<number>(18);
  const [readerLineHeight, setReaderLineHeight] = useState<number>(1.85);
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const readerScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Copied link toast state
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Fetch articles
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch('/api/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : data.articles || []);
      } else {
        setErrorMessage('Không thể tải danh sách bài viết. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách bài viết:', err);
      setErrorMessage('Lỗi kết nối khi tải danh sách bài viết.');
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

  // Toggle Favorite
  const handleToggleFavorite = async (art: Article, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const previousFav = art.isFavorite;
    const updatedFav = !previousFav;

    // Optimistic update
    setArticles((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, isFavorite: updatedFav } : a))
    );
    if (readingArticle?.id === art.id) {
      setReadingArticle((prev) => (prev ? { ...prev, isFavorite: updatedFav } : null));
    }

    try {
      const res = await fetch(`/api/articles/${art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: updatedFav }),
      });
      if (!res.ok) {
        // Rollback
        setArticles((prev) =>
          prev.map((a) => (a.id === art.id ? { ...a, isFavorite: previousFav } : a))
        );
        if (readingArticle?.id === art.id) {
          setReadingArticle((prev) => (prev ? { ...prev, isFavorite: previousFav } : null));
        }
        setErrorMessage('Không thể cập nhật yêu thích.');
      }
    } catch (err) {
      console.error('Lỗi cập nhật yêu thích:', err);
      setArticles((prev) =>
        prev.map((a) => (a.id === art.id ? { ...a, isFavorite: previousFav } : a))
      );
      if (readingArticle?.id === art.id) {
        setReadingArticle((prev) => (prev ? { ...prev, isFavorite: previousFav } : null));
      }
      setErrorMessage('Lỗi kết nối khi cập nhật yêu thích.');
    }
  };

  // Toggle Public status with ROLLBACK and UI ERROR BANNER on failure
  const handleTogglePublic = async (art: Article, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const previousPublic = art.isPublic;
    const nextPublic = !previousPublic;

    // Optimistic update
    setArticles((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, isPublic: nextPublic } : a))
    );
    if (readingArticle?.id === art.id) {
      setReadingArticle((prev) => (prev ? { ...prev, isPublic: nextPublic } : null));
    }
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/articles/${art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: nextPublic }),
      });

      if (!res.ok) {
        // Rollback state
        setArticles((prev) =>
          prev.map((a) => (a.id === art.id ? { ...a, isPublic: previousPublic } : a))
        );
        if (readingArticle?.id === art.id) {
          setReadingArticle((prev) => (prev ? { ...prev, isPublic: previousPublic } : null));
        }
        const errData = await res.json().catch(() => null);
        setErrorMessage(
          errData?.error || 'Không thể cập nhật trạng thái chia sẻ công khai. Đã hoàn tác.'
        );
      }
    } catch (err) {
      console.error('Lỗi cập nhật chia sẻ công khai:', err);
      // Rollback state
      setArticles((prev) =>
        prev.map((a) => (a.id === art.id ? { ...a, isPublic: previousPublic } : a))
      );
      if (readingArticle?.id === art.id) {
        setReadingArticle((prev) => (prev ? { ...prev, isPublic: previousPublic } : null));
      }
      setErrorMessage('Lỗi kết nối khi cập nhật trạng thái chia sẻ công khai. Đã hoàn tác.');
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
      } else {
        setErrorMessage('Không thể cập nhật trạng thái đọc.');
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đọc:', err);
      setErrorMessage('Lỗi kết nối khi cập nhật trạng thái đọc.');
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
      } else {
        setErrorMessage('Không thể xóa bài viết. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi khi xóa bài viết:', err);
      setErrorMessage('Lỗi kết nối khi xóa bài viết.');
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

  // Reader Theme Styles - Explicit inline color tokens so .dark overrides in globals.css never hijack Paper or Sepia
  const readerThemeStyles = {
    paper: {
      wrapperBg: '#FAF3E3',
      headerBg: 'rgba(255, 252, 247, 0.95)',
      textColor: '#0F172A',
      bodyColor: '#0F172A',
      headingColor: '#1E5AA8',
      accentColor: '#1E5AA8',
      metaColor: '#475569',
      borderColor: '#E8D9BC',
      dividerColor: 'rgba(30, 90, 168, 0.16)',
      controlBorder: 'rgba(15, 23, 42, 0.18)',
      tagBg: 'rgba(245, 230, 200, 0.55)',
      tagBorder: '#E8D9BC',
      tagText: '#1E5AA8',
      btnBg: '#FFFCF7',
      btnText: '#1E5AA8',
      activeControlBg: '#1E5AA8',
      publicBadgeBg: 'rgba(30, 90, 168, 0.1)',
      publicBadgeBorder: 'rgba(30, 90, 168, 0.25)',
      footerCardBg: 'rgba(255, 252, 247, 0.75)',
      progressTrackBg: 'rgba(30, 90, 168, 0.1)',
      coverFallbackBg: 'linear-gradient(to top right, #FAF3E3, rgba(245, 230, 200, 0.5), #FFFCF7)',
      completedBg: 'rgba(16, 185, 129, 0.15)',
      completedBorder: 'rgba(16, 185, 129, 0.35)',
      completedText: '#047857',
    },
    sepia: {
      wrapperBg: '#FBF0D9',
      headerBg: 'rgba(244, 230, 202, 0.95)',
      textColor: '#433422',
      bodyColor: '#433422',
      headingColor: '#3C2F1F',
      accentColor: '#92400E',
      metaColor: '#78644E',
      borderColor: '#E8D2B2',
      dividerColor: 'rgba(67, 52, 34, 0.16)',
      controlBorder: 'rgba(67, 52, 34, 0.2)',
      tagBg: '#F1DEC0',
      tagBorder: '#DEC29C',
      tagText: '#5E4933',
      btnBg: '#F1DEC0',
      btnText: '#3C2F1F',
      activeControlBg: '#92400E',
      publicBadgeBg: 'rgba(146, 64, 14, 0.1)',
      publicBadgeBorder: 'rgba(146, 64, 14, 0.25)',
      footerCardBg: 'rgba(241, 222, 192, 0.55)',
      progressTrackBg: 'rgba(67, 52, 34, 0.1)',
      coverFallbackBg: 'linear-gradient(to top right, #FBF0D9, #F1DEC0, #F4E6CA)',
      completedBg: 'rgba(16, 185, 129, 0.15)',
      completedBorder: 'rgba(16, 185, 129, 0.35)',
      completedText: '#047857',
    },
    oled: {
      wrapperBg: '#000000',
      headerBg: 'rgba(0, 0, 0, 0.92)',
      textColor: '#F4F4F5',
      bodyColor: '#E4E4E7',
      headingColor: '#F4F4F5',
      accentColor: '#F58220',
      metaColor: '#A1A1AA',
      borderColor: '#27272A',
      dividerColor: 'rgba(255, 255, 255, 0.14)',
      controlBorder: 'rgba(255, 255, 255, 0.18)',
      tagBg: '#18181B',
      tagBorder: '#27272A',
      tagText: '#D4D4D8',
      btnBg: '#18181B',
      btnText: '#E4E4E7',
      activeControlBg: '#F58220',
      publicBadgeBg: 'rgba(245, 130, 32, 0.14)',
      publicBadgeBorder: 'rgba(245, 130, 32, 0.3)',
      footerCardBg: 'rgba(24, 24, 27, 0.8)',
      progressTrackBg: 'rgba(255, 255, 255, 0.12)',
      coverFallbackBg: 'linear-gradient(to top right, #09090B, #18181B, #09090B)',
      completedBg: 'rgba(16, 185, 129, 0.2)',
      completedBorder: 'rgba(16, 185, 129, 0.35)',
      completedText: '#6EE7B7',
    },
  }[readerTheme];

  const readerFontClass = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
  }[readerFont];

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

      {/* Top Header: Frosted Glass Panel with 3D Bookmark */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs uppercase font-mono tracking-widest text-[#F58220] dark:text-amber-400 font-bold bg-[#F58220]/10 dark:bg-[#F58220]/20 border border-[#F58220]/20 dark:border-[#F58220]/40 px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
              Kho Tri thức & Bài viết
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E5AA8] shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
              Chế độ Đọc tập trung & Soạn thảo Chuyên sâu
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <img
              src="/icons/3d/bookmark.png"
              alt="Bookmark"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md shrink-0"
            />
            <span className="min-w-0 break-words">Studio Bài viết & Chế độ Đọc</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Quản lý kho tri thức, danh sách đọc tập trung và chia sẻ bài viết công khai với link độc lập
          </p>
        </div>

        {/* Dedicated Full Page Editor Navigation */}
        <Link
          href="/articles/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-semibold shadow-md shadow-[#F58220]/25 active:scale-95 transition-all text-sm self-start md:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Viết bài mới</span>
        </Link>
      </div>

      {/* Reading List Tabs & Quick Stats: Frosted Glass Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            activeTab === 'all'
              ? 'border-[#1E5AA8] dark:border-sky-400 ring-2 ring-[#1E5AA8]/20 shadow-md'
              : 'hover:border-[#1E5AA8]/30 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Tất cả bài viết</div>
          <div className="text-xl font-bold text-[#1E5AA8] dark:text-sky-300 mt-1 flex items-baseline justify-between">
            {stats.total}
            <BookMarked className="w-4 h-4 text-[#1E5AA8] dark:text-sky-400" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            activeTab === 'unread'
              ? 'border-[#F58220] ring-2 ring-[#F58220]/20 shadow-md'
              : 'hover:border-[#F58220]/30'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Chưa đọc</div>
          <div className="text-xl font-bold text-[#F58220] dark:text-amber-400 mt-1 flex items-baseline justify-between">
            {stats.unread}
            <Clock className="w-4 h-4 text-[#F58220]" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('reading')}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            activeTab === 'reading'
              ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
              : 'hover:border-sky-500/30'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Đang đọc</div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1 flex items-baseline justify-between">
            {stats.reading}
            <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            activeTab === 'completed'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'hover:border-emerald-500/30'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Đã đọc xong</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline justify-between">
            {stats.completed}
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </button>
      </div>

      {/* Search and Category Filter Bar: Frosted Glass */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, tóm tắt hoặc nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/20 text-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 pl-1 font-medium whitespace-nowrap shrink-0">
            <Filter className="w-3.5 h-3.5" /> Chủ đề:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1E5AA8] text-white shadow-sm shadow-[#1E5AA8]/25 font-semibold'
                  : 'bg-[#FAF3E3]/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 border border-[#F5E6C8] dark:border-slate-700'
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
            <div
              key={idx}
              className="glass-card rounded-3xl min-h-80 animate-pulse p-4 space-y-4 border border-white/60 dark:border-white/10"
            >
              <div className="w-full aspect-video bg-slate-200/60 dark:bg-slate-800 rounded-2xl" />
              <div className="h-5 bg-slate-200/60 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-200/60 dark:bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-200/60 dark:bg-slate-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 rounded-3xl border border-white/70 dark:border-white/10 text-center max-w-lg mx-auto my-12"
        >
          <img
            src="/icons/3d/glasses.png"
            alt="Glasses"
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
          />
          <h3 className="text-lg font-bold text-[#1E5AA8] dark:text-slate-100 mb-2">Chưa có bài viết nào</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Bắt đầu tạo bài viết mới trên trang soạn thảo chuyên sâu để thỏa sức sáng tạo và quản lý nội dung dài.
          </p>
          <Link
            href="/articles/new"
            className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-semibold text-sm transition-all shadow-md shadow-[#F58220]/25 whitespace-nowrap shrink-0"
          >
            Tạo bài viết đầu tiên
          </Link>
        </motion.div>
      )}

      {/* Filtered Empty State */}
      {!loading && articles.length > 0 && filteredArticles.length === 0 && (
        <div className="glass-card p-10 rounded-3xl border border-white/70 dark:border-white/10 text-center max-w-md mx-auto my-10">
          <p className="text-[#1E5AA8] dark:text-slate-100 font-bold">Không tìm thấy bài viết nào phù hợp</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hãy điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          <button
            onClick={() => {
              setActiveTab('all');
              setSelectedCategory('Tất cả');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-[#F5E6C8] dark:border-slate-800 hover:bg-[#F5E6C8]/60 dark:hover:bg-[#162746] whitespace-nowrap shrink-0"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Articles Grid: Frosted Glass Cards */}
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

      {/* Fullscreen Reader Mode Overlay (portaled to escape z-10 & space-y-6) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {readingArticle && (
              <motion.div
                key="article-reader-overlay"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="fixed inset-0 z-[60] mt-0 flex flex-col"
                style={{
                  backgroundColor: readerThemeStyles.wrapperBg,
                  color: readerThemeStyles.textColor,
                  colorScheme: readerTheme === 'oled' ? 'dark' : 'light',
                }}
              >
                {/* Top Reading Progress Bar (Sunset Orange) */}
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{ backgroundColor: readerThemeStyles.progressTrackBg }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#F58220] to-[#E06D10] transition-all duration-150"
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>

                {/* Reader Floating Header Bar (Optimized for Mobile Screens down to 320px) */}
                <header
                  className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-xl transition-colors shadow-sm shrink-0"
                  style={{
                    backgroundColor: readerThemeStyles.headerBg,
                    borderColor: readerThemeStyles.borderColor,
                    color: readerThemeStyles.textColor,
                  }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => setReadingArticle(null)}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-opacity hover:opacity-85 shrink-0"
                      style={{
                        backgroundColor: readerThemeStyles.btnBg,
                        borderColor: readerThemeStyles.borderColor,
                        color: readerThemeStyles.btnText,
                      }}
                      title="Quay lại danh sách"
                      aria-label="Quay lại danh sách"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex items-center gap-2">
                      <img
                        src="/icons/3d/glasses.png"
                        alt="Reader"
                        className="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-sm hidden xs:inline shrink-0"
                      />
                      <div className="min-w-0">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider block leading-tight truncate"
                          style={{ color: readerThemeStyles.accentColor }}
                        >
                          Chế độ Đọc
                        </span>
                        <h3
                          className="font-bold text-xs sm:text-sm truncate max-w-[110px] xs:max-w-[160px] sm:max-w-md leading-tight"
                          style={{ color: readerThemeStyles.textColor }}
                        >
                          {readingArticle.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Reader Controls Toolbar */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Edit Button in Reader Toolbar */}
                    <Link
                      href={`/articles/${readingArticle.id}/edit`}
                      className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-opacity hover:opacity-85"
                      style={{
                        backgroundColor: readerThemeStyles.btnBg,
                        borderColor: readerThemeStyles.borderColor,
                        color: readerThemeStyles.btnText,
                      }}
                      title="Chỉnh sửa bài viết này trong trang riêng"
                      aria-label="Chỉnh sửa bài viết"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    {/* Font Selector (Tablet & Desktop) */}
                    <div
                      className="hidden md:flex items-center border rounded-xl p-0.5 text-xs"
                      style={{ borderColor: readerThemeStyles.controlBorder }}
                    >
                      <button
                        onClick={() => setReaderFont('serif')}
                        className={`px-2.5 py-1.5 rounded-lg font-serif transition-colors ${
                          readerFont === 'serif' ? 'font-semibold' : 'hover:opacity-80'
                        }`}
                        style={
                          readerFont === 'serif'
                            ? { backgroundColor: readerThemeStyles.activeControlBg, color: '#FFFFFF' }
                            : undefined
                        }
                      >
                        Serif
                      </button>
                      <button
                        onClick={() => setReaderFont('sans')}
                        className={`px-2.5 py-1.5 rounded-lg font-sans transition-colors ${
                          readerFont === 'sans' ? 'font-semibold' : 'hover:opacity-80'
                        }`}
                        style={
                          readerFont === 'sans'
                            ? { backgroundColor: readerThemeStyles.activeControlBg, color: '#FFFFFF' }
                            : undefined
                        }
                      >
                        Sans
                      </button>
                      <button
                        onClick={() => setReaderFont('mono')}
                        className={`px-2.5 py-1.5 rounded-lg font-mono transition-colors ${
                          readerFont === 'mono' ? 'font-semibold' : 'hover:opacity-80'
                        }`}
                        style={
                          readerFont === 'mono'
                            ? { backgroundColor: readerThemeStyles.activeControlBg, color: '#FFFFFF' }
                            : undefined
                        }
                      >
                        Mono
                      </button>
                    </div>

                    {/* Font Size Selector */}
                    <div
                      className="flex items-center border rounded-xl p-0.5 text-xs"
                      style={{ borderColor: readerThemeStyles.controlBorder }}
                    >
                      <button
                        onClick={() => setReaderFontSize((s) => Math.max(14, s - 2))}
                        className="min-h-[40px] px-2 py-1 hover:opacity-80 font-bold"
                        title="Giảm kích thước chữ"
                      >
                        A-
                      </button>
                      <span className="px-1 text-[11px] font-mono opacity-80">{readerFontSize}</span>
                      <button
                        onClick={() => setReaderFontSize((s) => Math.min(26, s + 2))}
                        className="min-h-[40px] px-2 py-1 hover:opacity-80 font-bold"
                        title="Tăng kích thước chữ"
                      >
                        A+
                      </button>
                    </div>

                    {/* Theme Selector (Paper Vanilla Cream, Sepia, OLED) */}
                    <div
                      className="flex items-center border rounded-xl p-0.5 text-xs"
                      style={{ borderColor: readerThemeStyles.controlBorder }}
                    >
                      <button
                        onClick={() => setReaderTheme('paper')}
                        className={`min-h-[40px] p-2 sm:px-2.5 sm:py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                          readerTheme === 'paper' ? 'font-semibold' : 'hover:opacity-80'
                        }`}
                        style={
                          readerTheme === 'paper'
                            ? { backgroundColor: '#1E5AA8', color: '#FFFFFF' }
                            : undefined
                        }
                        title="Vanilla Cream Paper"
                      >
                        <Sun className="w-4 h-4" />
                        <span className="hidden md:inline">Paper</span>
                      </button>
                      <button
                        onClick={() => setReaderTheme('sepia')}
                        className={`min-h-[40px] p-2 sm:px-2.5 sm:py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                          readerTheme === 'sepia' ? 'font-semibold' : 'hover:opacity-80'
                        }`}
                        style={
                          readerTheme === 'sepia'
                            ? { backgroundColor: '#92400E', color: '#FFFFFF' }
                            : undefined
                        }
                        title="Warm Sepia"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#dfc092] border border-[#a27845]" />
                        <span className="hidden md:inline">Sepia</span>
                      </button>
                      <button
                        onClick={() => setReaderTheme('oled')}
                        className={`min-h-[40px] p-2 sm:px-2.5 sm:py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                          readerTheme === 'oled' ? 'font-semibold' : 'hover:opacity-80'
                        }`}
                        style={
                          readerTheme === 'oled'
                            ? { backgroundColor: '#27272A', color: '#FFFFFF' }
                            : undefined
                        }
                        title="Dark OLED"
                      >
                        <Moon className="w-4 h-4" />
                        <span className="hidden md:inline">OLED</span>
                      </button>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setReadingArticle(null)}
                      className="hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center p-2 rounded-xl border transition-opacity hover:opacity-85"
                      style={{
                        backgroundColor: readerThemeStyles.btnBg,
                        borderColor: readerThemeStyles.borderColor,
                        color: readerThemeStyles.btnText,
                      }}
                      title="Đóng chế độ đọc"
                      aria-label="Đóng"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </header>

                {/* Scrollable Reader Content */}
                <div
                  ref={readerScrollRef}
                  onScroll={handleReaderScroll}
                  className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar px-6 py-12 transition-colors"
                  style={{
                    backgroundColor: readerThemeStyles.wrapperBg,
                    color: readerThemeStyles.textColor,
                  }}
                >
                  <div className="max-w-2xl mx-auto space-y-8">
                    {/* Cover Image in Reader */}
                    {isSafeCoverUrl(readingArticle.coverImage) && (
                      <ArticleCoverImage
                        src={readingArticle.coverImage}
                        alt={readingArticle.title}
                        priority={true}
                        surfaceOverride={{
                          background: readerThemeStyles.coverFallbackBg,
                          text: readerThemeStyles.metaColor,
                          borderColor: readerThemeStyles.borderColor,
                        }}
                        className="rounded-3xl shadow-xl border mb-8"
                      />
                    )}

                    {/* Header Information */}
                    <div
                      className="space-y-4 border-b pb-6"
                      style={{ borderColor: readerThemeStyles.dividerColor }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: readerThemeStyles.tagBg,
                            borderColor: readerThemeStyles.tagBorder,
                            color: readerThemeStyles.tagText,
                          }}
                        >
                          {readingArticle.category}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: readerThemeStyles.metaColor }}
                        >
                          {new Date(readingArticle.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        {readingArticle.isPublic && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-medium"
                            style={{
                              backgroundColor: readerThemeStyles.publicBadgeBg,
                              color: readerThemeStyles.accentColor,
                              borderColor: readerThemeStyles.publicBadgeBorder,
                            }}
                          >
                            <Globe className="w-3 h-3" /> Công khai
                          </span>
                        )}
                      </div>

                      <h1
                        className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight ${readerFontClass}`}
                        style={{ color: readerThemeStyles.headingColor }}
                      >
                        {readingArticle.title}
                      </h1>

                      {readingArticle.excerpt && (
                        <p
                          className="text-base sm:text-lg italic leading-relaxed opacity-85 border-l-2 pl-4"
                          style={{
                            borderColor: '#F58220',
                            color: readerThemeStyles.bodyColor,
                          }}
                        >
                          {readingArticle.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Main Article Body Text */}
                    <div
                      className={`prose-reader ${readerFontClass}`}
                      style={{
                        fontSize: `${readerFontSize}px`,
                        lineHeight: readerLineHeight,
                        color: readerThemeStyles.bodyColor,
                      }}
                    >
                      {readingArticle.content ? (
                        readingArticle.content.split('\n\n').map((paragraph, pIdx) => {
                          if (paragraph.startsWith('# ')) {
                            return (
                              <h1
                                key={pIdx}
                                className="text-2xl font-bold mt-8 mb-4"
                                style={{ color: readerThemeStyles.headingColor }}
                              >
                                {paragraph.replace('# ', '')}
                              </h1>
                            );
                          }
                          if (paragraph.startsWith('## ')) {
                            return (
                              <h2
                                key={pIdx}
                                className="text-xl font-bold mt-6 mb-3"
                                style={{ color: readerThemeStyles.headingColor }}
                              >
                                {paragraph.replace('## ', '')}
                              </h2>
                            );
                          }
                          if (paragraph.startsWith('> ')) {
                            return (
                              <blockquote
                                key={pIdx}
                                className="border-l-4 pl-4 py-1 italic my-4 opacity-90"
                                style={{ borderColor: '#F58220' }}
                              >
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
                    <div
                      className="pt-10 border-t space-y-6"
                      style={{ borderColor: readerThemeStyles.dividerColor }}
                    >
                      {/* Mark as completed prompt */}
                      <div
                        className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border"
                        style={{
                          borderColor: readerThemeStyles.dividerColor,
                          backgroundColor: readerThemeStyles.footerCardBg,
                        }}
                      >
                        <div>
                          <h4
                            className="font-semibold text-sm"
                            style={{ color: readerThemeStyles.textColor }}
                          >
                            Bạn đã đọc xong bài viết này?
                          </h4>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: readerThemeStyles.metaColor }}
                          >
                            Cập nhật tiến trình của bạn trong danh sách đọc LifeOS.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {readingArticle.readStatus !== 'completed' ? (
                            <button
                              onClick={() => handleChangeStatus(readingArticle, 'completed')}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#F58220]/25"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã xong
                            </button>
                          ) : (
                            <span
                              className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5"
                              style={{
                                backgroundColor: readerThemeStyles.completedBg,
                                borderColor: readerThemeStyles.completedBorder,
                                color: readerThemeStyles.completedText,
                              }}
                            >
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
                            className="flex-1 p-3.5 rounded-2xl border text-left transition-opacity hover:opacity-85 flex items-center gap-2"
                            style={{
                              backgroundColor: readerThemeStyles.btnBg,
                              borderColor: readerThemeStyles.borderColor,
                              color: readerThemeStyles.btnText,
                            }}
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
                            className="flex-1 p-3.5 rounded-2xl border text-right transition-opacity hover:opacity-85 flex items-center justify-end gap-2"
                            style={{
                              backgroundColor: readerThemeStyles.btnBg,
                              borderColor: readerThemeStyles.borderColor,
                              color: readerThemeStyles.btnText,
                            }}
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
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

// Subcomponent: Individual Article Card with Frosted Glass & Tilt
interface ArticleCardProps {
  article: Article;
  onRead: () => void;
  onDelete: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onTogglePublic: (e: React.MouseEvent) => void;
  onCopyPublicLink: (e: React.MouseEvent) => void;
  isCopied: boolean;
}

function ArticleCard({
  article,
  onRead,
  onDelete,
  onToggleFavorite,
  onTogglePublic,
  onCopyPublicLink,
  isCopied,
}: ArticleCardProps) {
  const statusBadge = {
    unread: { text: 'Chưa đọc', color: 'bg-[#F58220]/15 text-[#F58220] dark:text-amber-400 border-[#F58220]/30' },
    reading: { text: 'Đang đọc', color: 'bg-[#1E5AA8]/15 dark:bg-blue-950/40 text-[#1E5AA8] dark:text-sky-300 border-[#1E5AA8]/30 dark:border-blue-900/50' },
    completed: { text: 'Đã xong', color: 'bg-emerald-500/15 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-900/50' },
  }[article.readStatus];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-full"
    >
      <GlassCard
        tilt={true}
        glowColor="sapphire"
        padding="p-0"
        className="h-full flex flex-col justify-between group overflow-hidden border border-white/70 dark:border-white/10 transition-all duration-300 hover:-translate-y-1"
      >
        <div>
          {/* Cover Image or Warm Vanilla Gradient */}
          <ArticleCoverImage
            src={article.coverImage}
            alt={article.title}
            lazy={true}
            imgClassName="group-hover:scale-105 transition-transform duration-500"
            className="border-b border-[#F5E6C8]/70 dark:border-slate-800"
          >
            {/* Top badges over cover image */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
              <span className="px-2.5 py-1 rounded-lg bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 backdrop-blur-md text-[#1E5AA8] dark:text-sky-300 text-[11px] font-semibold border border-white/80 dark:border-slate-700 shadow-sm whitespace-nowrap shrink-0">
                {article.category || 'Chung'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  className="p-1.5 rounded-lg bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 backdrop-blur-md text-slate-400 hover:text-rose-500 transition-colors border border-white/80 dark:border-slate-700 shadow-sm shrink-0"
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

            {/* Bottom badge over cover: Read status & reading time */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border backdrop-blur-md whitespace-nowrap shrink-0 ${statusBadge.color}`}>
                {statusBadge.text}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 backdrop-blur-md text-slate-700 dark:text-slate-300 text-[11px] border border-white/80 dark:border-slate-700 flex items-center gap-1 font-medium shadow-sm whitespace-nowrap shrink-0">
                <Clock className="w-3 h-3 text-[#F58220]" />
                {article.readingTime || 1} phút
              </span>
            </div>
          </ArticleCoverImage>

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
              <div className="pt-2 flex items-center justify-between text-xs text-[#1E5AA8] dark:text-sky-300 bg-[#FAF3E3] dark:bg-[#0B1528] px-2.5 py-1.5 rounded-xl border border-[#F5E6C8] dark:border-slate-800">
                <span className="flex items-center gap-1 text-[11px] font-mono truncate mr-2">
                  <Globe className="w-3 h-3 text-[#1E5AA8] dark:text-sky-400 shrink-0" /> /p/{article.slug}
                </span>
                <button
                  type="button"
                  onClick={onCopyPublicLink}
                  className="hover:text-[#F58220] transition-colors flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap shrink-0"
                  title="Sao chép link chia sẻ công khai"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Đã chép
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
            className="flex-1 px-3 py-2 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] hover:bg-[#F5E6C8]/60 dark:hover:bg-[#162746] text-[#1E5AA8] dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#F5E6C8] dark:border-slate-800 hover:border-[#1E5AA8]/30 dark:hover:border-slate-700 whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Đọc ngay</span>
          </button>

          <button
            type="button"
            onClick={onTogglePublic}
            className={`p-2 rounded-xl border transition-colors shrink-0 ${
              article.isPublic
                ? 'text-[#1E5AA8] dark:text-sky-300 bg-[#1E5AA8]/10 border-[#1E5AA8]/30'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] border-transparent'
            }`}
            title={article.isPublic ? 'Bật công khai (Nhấp để tắt)' : 'Tắt công khai (Nhấp để bật)'}
            aria-label="Chuyển đổi trạng thái chia sẻ công khai"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>

          {/* Navigate to Dedicated Edit Page */}
          <Link
            href={`/articles/${article.id}/edit`}
            className="p-2 rounded-xl text-slate-400 hover:text-[#1E5AA8] dark:hover:text-sky-400 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] transition-colors shrink-0 flex items-center justify-center"
            title="Chỉnh sửa bài viết trong trang riêng"
            aria-label="Chỉnh sửa bài viết"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
            title="Xóa bài viết"
            aria-label="Xóa bài viết"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
