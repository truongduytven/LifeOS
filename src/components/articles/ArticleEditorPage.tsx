'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Save,
  Eye,
  Columns,
  PenTool,
  Clock,
  FileText,
  Globe,
  Heart,
  Share2,
  Copy,
  Check,
  Tag as TagIcon,
  X,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List as ListIcon,
  Link as LinkIcon,
} from 'lucide-react';
import type { Article } from '@/types/lifeos';
import GlassCard from '@/components/ui/GlassCard';
import Icon3D from '@/components/ui/Icon3D';

export const CATEGORIES = [
  'Công nghệ',
  'Phát triển bản thân',
  'Kỹ thuật số',
  'Thiết kế',
  'Tư duy & Triết học',
  'Sách & Trích dẫn',
  'Cuộc sống',
  'Chung',
];

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Safe inline markdown parser (Bold, Italic, Code, Safe Links) without raw HTML injection
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[#1E5AA8] dark:text-sky-300 font-mono text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const href = linkMatch[2];
      const isSafe =
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('/');
      return isSafe ? (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1E5AA8] dark:text-sky-400 underline font-medium hover:text-[#F58220] transition-colors"
        >
          {linkMatch[1]}
        </a>
      ) : (
        linkMatch[1]
      );
    }
    return part;
  });
}

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

interface CoverImageFrameProps {
  src: string;
  alt: string;
  className?: string;
  compact?: boolean;
  priority?: boolean;
  children?: React.ReactNode;
}

function CoverImageFrame({
  src,
  alt,
  className = '',
  compact = false,
  priority = false,
  children,
}: CoverImageFrameProps) {
  const trimmedSrc = src.trim();
  const isSafe = isSafeCoverUrl(trimmedSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [trimmedSrc]);

  return (
    <div
      className={`relative w-full aspect-video overflow-hidden bg-gradient-to-tr from-[#FAF3E3]/90 via-[#F5E6C8]/45 to-[#FFFCF7]/90 dark:from-[#0B1528]/90 dark:via-[#111F38]/85 dark:to-[#0B1528]/90 backdrop-blur-md ${className}`}
    >
      {isSafe && !hasError ? (
        <img
          src={trimmedSrc}
          alt={alt}
          fetchPriority={priority ? 'high' : undefined}
          className="w-full h-full object-cover object-center"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-4 text-center">
          <Icon3D name="bookmark" size={compact ? 28 : 40} />
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {!isSafe
              ? 'URL ảnh không hợp lệ (chỉ hỗ trợ http://, https:// hoặc /)'
              : 'Không thể tải ảnh bìa'}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

interface ArticleEditorPageProps {
  mode: 'create' | 'edit';
  articleId?: number;
}

interface DraftPayload {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  readingTime: number;
  isPublic: boolean;
  isFavorite: boolean;
  readStatus: 'unread' | 'reading' | 'completed';
  tags: string[];
  savedAt: number;
}

export default function ArticleEditorPage({
  mode,
  articleId,
}: ArticleEditorPageProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Core Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [readingTime, setReadingTime] = useState(3);
  const [autoCalculateReadingTime, setAutoCalculateReadingTime] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [readStatus, setReadStatus] = useState<'unread' | 'reading' | 'completed'>('unread');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // UI States
  const [loadingArticle, setLoadingArticle] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'write' | 'split' | 'preview'>('write');
  const [showMetaMobile, setShowMetaMobile] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Draft & Dirty States
  const [isDirty, setIsDirty] = useState(false);
  const [draftDetected, setDraftDetected] = useState<DraftPayload | null>(null);
  const [lastDraftSavedTime, setLastDraftSavedTime] = useState<number | null>(null);

  const draftKey = useMemo(() => {
    return mode === 'create'
      ? 'lifeos_article_draft_new'
      : `lifeos_article_draft_${articleId}`;
  }, [mode, articleId]);

  // Live Word Count & Reading Time
  const wordCount = useMemo(() => {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  useEffect(() => {
    if (autoCalculateReadingTime) {
      const calculated = Math.max(1, Math.ceil(wordCount / 200));
      setReadingTime(calculated);
    }
  }, [wordCount, autoCalculateReadingTime]);

  // Load article when in edit mode
  useEffect(() => {
    if (mode !== 'edit') {
      // Check for create draft
      try {
        const stored = localStorage.getItem(draftKey);
        if (stored) {
          const parsed = JSON.parse(stored) as DraftPayload;
          if (parsed && (parsed.title || parsed.content)) {
            setDraftDetected(parsed);
          }
        }
      } catch (e) {
        console.error('Error reading draft from localStorage:', e);
      }
      return;
    }

    if (!articleId || isNaN(articleId)) {
      setErrorMessage('Mã bài viết không hợp lệ.');
      setLoadingArticle(false);
      return;
    }

    let isMounted = true;
    async function fetchArticle() {
      try {
        setLoadingArticle(true);
        setErrorMessage(null);
        const res = await fetch(`/api/articles/${articleId}`);

        if (!res.ok) {
          if (res.status === 404) {
            setErrorMessage('Không tìm thấy bài viết hoặc bài viết đã bị xóa.');
          } else if (res.status === 401) {
            setErrorMessage('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
          } else {
            setErrorMessage('Không thể tải bài viết. Vui lòng thử lại sau.');
          }
          return;
        }

        const data: Article = await res.json();
        if (!isMounted) return;

        setTitle(data.title || '');
        setSlug(data.slug || '');
        setSlugManuallyEdited(true);
        setCategory(data.category || CATEGORIES[0]);
        setExcerpt(data.excerpt || '');
        setContent(data.content || '');
        setCoverImage(data.coverImage || '');
        setReadingTime(data.readingTime || 3);
        setIsPublic(Boolean(data.isPublic));
        setIsFavorite(Boolean(data.isFavorite));
        setReadStatus(data.readStatus || 'unread');
        setTags(Array.isArray(data.tags) ? data.tags : []);

        // Check if there is an unsaved local draft that is newer
        try {
          const stored = localStorage.getItem(draftKey);
          if (stored) {
            const parsed = JSON.parse(stored) as DraftPayload;
            const articleTimestamp = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;
            if (parsed && parsed.savedAt && parsed.savedAt > articleTimestamp) {
              setDraftDetected(parsed);
            }
          }
        } catch {
          // ignore
        }
      } catch (err) {
        console.error('Lỗi khi tải bài viết:', err);
        if (isMounted) setErrorMessage('Lỗi kết nối khi tải bài viết.');
      } finally {
        if (isMounted) setLoadingArticle(false);
      }
    }

    fetchArticle();

    return () => {
      isMounted = false;
    };
  }, [mode, articleId, draftKey]);

  // Track user modifications & auto-save draft with debounce
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // Title change with auto-slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    markDirty();
    if (!slugManuallyEdited && mode === 'create') {
      setSlug(slugify(val));
    }
  };

  // Debounced Auto-Save Draft to LocalStorage
  useEffect(() => {
    if (!isDirty || loadingArticle || isSaving) return;

    const timer = setTimeout(() => {
      try {
        const payload: DraftPayload = {
          title,
          slug,
          category,
          excerpt,
          content,
          coverImage,
          readingTime,
          isPublic,
          isFavorite,
          readStatus,
          tags,
          savedAt: Date.now(),
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
        setLastDraftSavedTime(Date.now());
      } catch (e) {
        console.error('Error saving draft to localStorage:', e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    isDirty,
    loadingArticle,
    isSaving,
    draftKey,
    title,
    slug,
    category,
    excerpt,
    content,
    coverImage,
    readingTime,
    isPublic,
    isFavorite,
    readStatus,
    tags,
  ]);

  // Window BeforeUnload prompt for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSaving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSaving]);

  // Restore Draft Action
  const handleRestoreDraft = () => {
    if (!draftDetected) return;
    setTitle(draftDetected.title || '');
    setSlug(draftDetected.slug || '');
    setSlugManuallyEdited(true);
    setCategory(draftDetected.category || CATEGORIES[0]);
    setExcerpt(draftDetected.excerpt || '');
    setContent(draftDetected.content || '');
    setCoverImage(draftDetected.coverImage || '');
    setReadingTime(draftDetected.readingTime || 3);
    setIsPublic(Boolean(draftDetected.isPublic));
    setIsFavorite(Boolean(draftDetected.isFavorite));
    setReadStatus(draftDetected.readStatus || 'unread');
    setTags(draftDetected.tags || []);
    setDraftDetected(null);
    setIsDirty(true);
  };

  // Discard Draft Action
  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setDraftDetected(null);
  };

  // Tag Management
  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
      markDirty();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    markDirty();
  };

  // Markdown Toolbar helper to insert tags around cursor
  const insertMarkdown = (prefix: string, suffix = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'nội dung'}${suffix}`;
    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    markDirty();

    setTimeout(() => {
      el.focus();
      const newCursor = start + prefix.length + (selected ? selected.length : 'nội dung'.length);
      el.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  // Save / Submit Article
  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề bài viết.');
      return;
    }

    const finalSlug = slug.trim() ? slugify(slug) : slugify(title);
    if (!finalSlug) {
      setErrorMessage('Đường dẫn bài viết (slug) không hợp lệ.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload = {
        title: title.trim(),
        slug: finalSlug,
        category,
        excerpt: excerpt.trim() || null,
        content: content.trim() || null,
        coverImage: coverImage.trim() || null,
        readingTime,
        isPublic,
        isFavorite,
        readStatus,
        tags,
      };

      let res: Response;
      if (mode === 'edit' && articleId) {
        res = await fetch(`/api/articles/${articleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        // Clear local draft upon successful save
        localStorage.removeItem(draftKey);
        setIsDirty(false);
        setSuccessToast(
          mode === 'edit' ? 'Đã lưu thay đổi bài viết!' : 'Đã tạo bài viết thành công!'
        );
        setTimeout(() => {
          router.push('/articles');
        }, 800);
      } else {
        const data = await res.json().catch(() => null);
        setErrorMessage(
          data?.error ||
            'Không thể lưu bài viết. Vui lòng kiểm tra lại đường dẫn liên kết (slug).'
        );
      }
    } catch (err) {
      console.error('Lỗi khi lưu bài viết:', err);
      setErrorMessage('Lỗi kết nối khi lưu bài viết.');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy public link
  const handleCopyLink = () => {
    if (!slug) return;
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Loading Screen for Edit Mode
  if (loadingArticle) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-3 border-[#F58220] border-t-transparent animate-spin" />
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          Đang tải dữ liệu bài viết...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-sm shadow-xl"
          >
            <Check className="w-5 h-5" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="flex items-center gap-2 shrink-0">
              {mode === 'edit' && !title && (
                <Link
                  href="/articles"
                  className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
                >
                  Quay lại danh sách
                </Link>
              )}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 transition-colors"
                aria-label="Đóng thông báo lỗi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draft Recovery Banner */}
      <AnimatePresence>
        {draftDetected && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl p-4 bg-[#F58220]/10 dark:bg-amber-950/40 border border-[#F58220]/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800 dark:text-slate-100 text-sm shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <RotateCcw className="w-5 h-5 text-[#F58220] shrink-0" />
              <div>
                <span className="font-bold text-[#F58220]">
                  Phát hiện bản nháp chưa lưu
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 block sm:inline sm:ml-2">
                  (Đã tự động lưu lúc{' '}
                  {new Date(draftDetected.savedAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                  )
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] text-white text-xs font-semibold hover:opacity-95 transition-opacity"
              >
                Khôi phục bản nháp
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Bỏ qua
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Top Glass Bar */}
      <header className="glass-panel sticky top-16 lg:top-4 z-20 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-xl border border-white/70 dark:border-white/10">
        {/* Left: Back button & Breadcrumb Status */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/articles"
            className="min-h-[44px] min-w-[44px] px-3 flex items-center justify-center rounded-xl bg-[#FAF3E3]/80 dark:bg-[#111F38]/90 border border-[#F5E6C8] dark:border-slate-800 hover:bg-[#F5E6C8] dark:hover:bg-[#162746] text-[#1E5AA8] dark:text-sky-300 font-semibold text-xs transition-colors shrink-0"
            title="Quay lại danh sách bài viết"
          >
            <ChevronLeft className="w-5 h-5 mr-0.5" />
            <span className="hidden xs:inline">Bài viết</span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-[#F58220] font-bold">
                {mode === 'create' ? 'Soạn bài mới' : 'Chỉnh sửa bài viết'}
              </span>
              <span className="hidden sm:inline text-xs text-slate-400">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#F58220]" />
                {wordCount} từ (~{readingTime} phút đọc)
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
              {isDirty ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Có thay đổi chưa lưu
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Đã đồng bộ
                </span>
              )}
              {lastDraftSavedTime && (
                <span className="text-slate-400 hidden md:inline">
                  • Nháp lưu lúc{' '}
                  {new Date(lastDraftSavedTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* View Mode Toggle: Write / Split / Preview */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#FAF3E3]/70 dark:bg-slate-800/80 border border-[#F5E6C8] dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('write')}
              className={`min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
                viewMode === 'write'
                  ? 'bg-[#1E5AA8] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Chế độ soạn thảo"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Viết</span>
            </button>

            {/* Split Mode on Desktop Only */}
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg hidden lg:flex items-center gap-1 font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-[#1E5AA8] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Chia đôi màn hình: Soạn thảo + Xem trước"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Chia đôi</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
                viewMode === 'preview'
                  ? 'bg-[#1E5AA8] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Chế độ xem trước kết quả"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xem trước</span>
            </button>
          </div>

          {/* Mobile Metadata Toggle */}
          <button
            type="button"
            onClick={() => setShowMetaMobile(!showMetaMobile)}
            className={`lg:hidden min-h-[44px] min-w-[44px] px-3 flex items-center justify-center rounded-xl border transition-colors ${
              showMetaMobile
                ? 'bg-[#1E5AA8] text-white border-[#1E5AA8]'
                : 'bg-[#FAF3E3]/80 dark:bg-[#111F38]/90 border-[#F5E6C8] dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
            title="Cài đặt thông tin bài viết"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1" />
            <span className="text-xs font-semibold">Cài đặt</span>
          </button>

          {/* Primary Save Action */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#F58220]/25 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap shrink-0"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isSaving
                ? 'Đang lưu...'
                : mode === 'create'
                ? 'Đăng bài viết'
                : 'Lưu thay đổi'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Grid: 2-Column on Desktop (Canvas + Metadata Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Left Column: Writing Canvas & Live Preview */}
        <div className="space-y-4 min-w-0">
          {/* Title & Excerpt Input Card */}
          <div className="glass-card rounded-3xl p-5 sm:p-7 border border-white/70 dark:border-white/10 shadow-sm space-y-4">
            <div>
              <input
                type="text"
                placeholder="Tiêu đề bài viết..."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-transparent text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1E5AA8] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none tracking-tight leading-tight"
              />
            </div>

            {/* Quick Excerpt */}
            <div>
              <input
                type="text"
                placeholder="Tóm tắt ngắn (Excerpt) về nội dung bài viết..."
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  markDirty();
                }}
                className="w-full bg-transparent text-sm sm:text-base text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none border-t border-[#F5E6C8]/60 dark:border-slate-800 pt-3 italic"
              />
            </div>
          </div>

          {/* Markdown Formatting Toolbar */}
          {viewMode !== 'preview' && (
            <div className="glass-card rounded-2xl p-2 px-3 flex flex-wrap items-center gap-1 sm:gap-1.5 border border-white/70 dark:border-white/10 text-xs">
              <span className="text-[11px] font-mono text-slate-400 font-semibold px-1">
                Markdown:
              </span>
              <button
                type="button"
                onClick={() => insertMarkdown('# ', '')}
                className="p-1.5 rounded-lg hover:bg-[#FAF3E3] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                title="Tiêu đề H1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('## ', '')}
                className="p-1.5 rounded-lg hover:bg-[#FAF3E3] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                title="Tiêu đề H2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('### ', '')}
                className="p-1.5 rounded-lg hover:bg-[#FAF3E3] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                title="Tiêu đề H3"
              >
                <Heading3 className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />
              <button
                type="button"
                onClick={() => insertMarkdown('**', '**')}
                className="p-1.5 rounded-lg hover:bg-[#FAF3E3] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title="In đậm (**text**)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('*', '*')}
                className="p-1.5 rounded-lg hover:bg-[#FAF3E3] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title="In nghiêng (*text*)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('> ', '')}
                className="p-1.5 rounded-lg hover:bg-[#FAF3E3] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title="Trích dẫn (> trích dẫn)"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('`', '`')}
                className="p-1.5 rounded-lg hover:bg-[#FAF3E3] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title="Đoạn mã (`code`)"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('- ', '')}
                className="p-1.5 rounded-lg hover:bg-[#FAF3E3] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title="Danh sách gạch đầu dòng (- mục)"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('[Tiêu đề link](', ')')}
                className="p-1.5 rounded-lg hover:bg-[#FAF3E3] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title="Chèn liên kết"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* View Modes Container: Write, Split, or Preview */}
          <div className="min-w-0">
            {/* 1. WRITE VIEW */}
            {viewMode === 'write' && (
              <div className="glass-card rounded-3xl p-5 sm:p-7 border border-white/70 dark:border-white/10 shadow-sm">
                <textarea
                  ref={textareaRef}
                  rows={24}
                  placeholder="Bắt đầu viết nội dung bài viết của bạn tại đây với hỗ trợ định dạng Markdown...
# Tiêu đề mục lớn
## Tiêu đề con
> Đoạn trích dẫn tâm đắc
Nội dung thông thường với **in đậm**, *in nghiêng*, `code` và liên kết [LifeOS](https://...)"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    markDirty();
                  }}
                  className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base leading-relaxed focus:outline-none resize-y min-h-[60vh] font-mono sm:font-sans custom-scrollbar"
                />
              </div>
            )}

            {/* 2. SPLIT VIEW (Desktop: Write Left, Preview Right) */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Editor Half */}
                <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/70 dark:border-white/10 shadow-sm flex flex-col">
                  <div className="text-xs font-mono font-bold text-slate-400 mb-2 uppercase">
                    Soạn thảo
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={24}
                    placeholder="Viết nội dung Markdown tại đây..."
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      markDirty();
                    }}
                    className="w-full flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm leading-relaxed focus:outline-none resize-y min-h-[60vh] font-mono custom-scrollbar"
                  />
                </div>

                {/* Live Preview Half */}
                <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/70 dark:border-white/10 shadow-sm flex flex-col max-h-[80vh] overflow-y-auto overscroll-contain custom-scrollbar">
                  <div className="text-xs font-mono font-bold text-[#F58220] mb-3 uppercase flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Xem trước trực tiếp
                  </div>
                  {isSafeCoverUrl(coverImage) && (
                    <CoverImageFrame
                      src={coverImage}
                      alt={title || 'Ảnh bìa bài viết'}
                      className="rounded-2xl mb-5 shrink-0 border border-white/60 dark:border-white/10 shadow-sm"
                    />
                  )}
                  <div className="prose-reader text-sm leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
                    {content ? (
                      content.split('\n\n').map((paragraph, pIdx) => {
                        if (paragraph.startsWith('# ')) {
                          return (
                            <h1
                              key={pIdx}
                              className="text-xl font-bold mt-4 mb-2 text-[#1E5AA8] dark:text-sky-300"
                            >
                              {paragraph.replace('# ', '')}
                            </h1>
                          );
                        }
                        if (paragraph.startsWith('## ')) {
                          return (
                            <h2
                              key={pIdx}
                              className="text-lg font-bold mt-3 mb-1.5 text-[#1E5AA8] dark:text-sky-300"
                            >
                              {paragraph.replace('## ', '')}
                            </h2>
                          );
                        }
                        if (paragraph.startsWith('### ')) {
                          return (
                            <h3
                              key={pIdx}
                              className="text-base font-bold mt-2 mb-1 text-[#1E5AA8] dark:text-sky-300"
                            >
                              {paragraph.replace('### ', '')}
                            </h3>
                          );
                        }
                        if (paragraph.startsWith('> ')) {
                          return (
                            <blockquote
                              key={pIdx}
                              className="border-l-3 border-[#F58220] pl-3 py-1 italic my-2 bg-black/5 dark:bg-white/5 rounded-r-lg text-slate-700 dark:text-slate-300"
                            >
                              {parseInlineMarkdown(paragraph.replace('> ', ''))}
                            </blockquote>
                          );
                        }
                        if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                          const lines = paragraph.split('\n');
                          return (
                            <ul key={pIdx} className="list-disc pl-5 space-y-1">
                              {lines.map((line, lIdx) => (
                                <li key={lIdx}>
                                  {parseInlineMarkdown(line.replace(/^[-*]\s+/, ''))}
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        return (
                          <p key={pIdx} className="whitespace-pre-line leading-relaxed">
                            {parseInlineMarkdown(paragraph)}
                          </p>
                        );
                      })
                    ) : (
                      <p className="italic text-slate-400">
                        Chưa có nội dung xem trước.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. PREVIEW VIEW (Full Width Reader Surface) */}
            {viewMode === 'preview' && (
              <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/70 dark:border-white/10 shadow-md space-y-6">
                {isSafeCoverUrl(coverImage) && (
                  <CoverImageFrame
                    src={coverImage}
                    alt={title || 'Ảnh bìa bài viết'}
                    priority={true}
                    className="rounded-2xl mb-6 border border-white/60 dark:border-white/10 shadow-sm"
                  />
                )}

                <div className="space-y-3 border-b pb-6 border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#1E5AA8]/10 text-[#1E5AA8] dark:text-sky-300 border border-[#1E5AA8]/20">
                      {category}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#F58220]" />
                      {readingTime} phút đọc ({wordCount} từ)
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1E5AA8] dark:text-sky-300">
                    {title || '(Chưa có tiêu đề)'}
                  </h1>

                  {excerpt && (
                    <p className="text-base italic leading-relaxed text-slate-600 dark:text-slate-400 border-l-3 pl-3 border-[#F58220]">
                      {excerpt}
                    </p>
                  )}
                </div>

                <div className="prose-reader text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-5">
                  {content ? (
                    content.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('# ')) {
                        return (
                          <h1
                            key={pIdx}
                            className="text-2xl font-bold mt-6 mb-3 text-[#1E5AA8] dark:text-sky-300"
                          >
                            {paragraph.replace('# ', '')}
                          </h1>
                        );
                      }
                      if (paragraph.startsWith('## ')) {
                        return (
                          <h2
                            key={pIdx}
                            className="text-xl font-bold mt-5 mb-2 text-[#1E5AA8] dark:text-sky-300"
                          >
                            {paragraph.replace('## ', '')}
                          </h2>
                        );
                      }
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h3
                            key={pIdx}
                            className="text-lg font-bold mt-4 mb-2 text-[#1E5AA8] dark:text-sky-300"
                          >
                            {paragraph.replace('### ', '')}
                          </h3>
                        );
                      }
                      if (paragraph.startsWith('> ')) {
                        return (
                          <blockquote
                            key={pIdx}
                            className="border-l-4 border-[#F58220] pl-4 py-1.5 italic my-4 bg-black/5 dark:bg-white/5 rounded-r-xl"
                          >
                            {parseInlineMarkdown(paragraph.replace('> ', ''))}
                          </blockquote>
                        );
                      }
                      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                        const lines = paragraph.split('\n');
                        return (
                          <ul key={pIdx} className="list-disc pl-6 space-y-1.5 my-3">
                            {lines.map((line, lIdx) => (
                              <li key={lIdx}>
                                {parseInlineMarkdown(line.replace(/^[-*]\s+/, ''))}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={pIdx} className="whitespace-pre-line leading-relaxed">
                          {parseInlineMarkdown(paragraph)}
                        </p>
                      );
                    })
                  ) : (
                    <p className="italic text-slate-400">
                      Chưa có nội dung cho bài viết này.
                    </p>
                  )}
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-200 dark:border-slate-800">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF3E3] dark:bg-slate-800 border border-[#F5E6C8] dark:border-slate-700 text-[#1E5AA8] dark:text-sky-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Frosted Glass Metadata Panel (Desktop permanent, Mobile collapsible) */}
        <div
          className={`${
            showMetaMobile ? 'block' : 'hidden'
          } lg:block space-y-4`}
        >
          <GlassCard
            tilt={false}
            padding="p-5 sm:p-6"
            className="rounded-3xl border border-white/70 dark:border-white/10 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F5E6C8]/60 dark:border-slate-800">
              <h3 className="font-bold text-sm text-[#1E5AA8] dark:text-slate-100 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#F58220]" />
                Cài đặt bài viết
              </h3>
              <button
                type="button"
                onClick={() => setShowMetaMobile(false)}
                className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chủ đề
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  markDirty();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Slug / Permalinks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Đường dẫn liên kết (Slug)
              </label>
              <div className="flex items-center rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 px-3 py-1 text-xs">
                <span className="text-slate-400 font-mono">/p/</span>
                <input
                  type="text"
                  placeholder="duong-dan-bai-viet"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setSlugManuallyEdited(true);
                    markDirty();
                  }}
                  className="w-full px-1 py-1.5 bg-transparent text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Read Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Trạng thái đọc
              </label>
              <select
                value={readStatus}
                onChange={(e) => {
                  setReadStatus(e.target.value as 'unread' | 'reading' | 'completed');
                  markDirty();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8]"
              >
                <option value="unread">Chưa đọc</option>
                <option value="reading">Đang đọc</option>
                <option value="completed">Đã đọc xong</option>
              </select>
            </div>

            {/* Reading Time */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Thời gian đọc (phút)
                </label>
                <label className="inline-flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCalculateReadingTime}
                    onChange={(e) => setAutoCalculateReadingTime(e.target.checked)}
                    className="rounded text-[#1E5AA8]"
                  />
                  <span>Tự động tính</span>
                </label>
              </div>
              <input
                type="number"
                min={1}
                disabled={autoCalculateReadingTime}
                value={readingTime}
                onChange={(e) => {
                  setReadingTime(parseInt(e.target.value) || 1);
                  markDirty();
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs disabled:opacity-75 focus:outline-none"
              />
            </div>

            {/* Cover Image URL & Thumbnail preview */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ảnh bìa (Cover Image URL)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  markDirty();
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-[#1E5AA8]"
              />
              {coverImage.trim() && (
                <CoverImageFrame
                  src={coverImage}
                  alt="Cover preview"
                  compact={true}
                  className="mt-2 rounded-xl border border-[#F5E6C8] dark:border-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage('');
                      markDirty();
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Xóa ảnh bìa"
                    aria-label="Xóa ảnh bìa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </CoverImageFrame>
              )}
            </div>

            {/* Tags (#tags) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Thẻ (#tags)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Thêm thẻ..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-xl bg-[#1E5AA8] text-white text-xs font-semibold hover:bg-[#174684] transition-colors"
                >
                  Thêm
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1E5AA8]/10 dark:bg-[#1E5AA8]/20 border border-[#1E5AA8]/20 text-[#1E5AA8] dark:text-sky-300 text-[11px] font-semibold"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite & Public Toggles */}
            <div className="pt-2 border-t border-[#F5E6C8]/60 dark:border-slate-800 space-y-3">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Heart
                    className={`w-4 h-4 ${
                      isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-400'
                    }`}
                  />
                  Đánh dấu yêu thích
                </span>
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => {
                    setIsFavorite(e.target.checked);
                    markDirty();
                  }}
                  className="w-4 h-4 rounded text-[#F58220]"
                />
              </label>

              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#1E5AA8] dark:text-sky-400" />
                    Chia sẻ công khai
                  </span>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => {
                      setIsPublic(e.target.checked);
                      markDirty();
                    }}
                    className="w-4 h-4 rounded text-[#1E5AA8]"
                  />
                </label>

                {isPublic && slug && (
                  <div className="p-2.5 rounded-xl bg-[#FAF3E3]/80 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-[11px] flex items-center justify-between gap-1">
                    <span className="font-mono truncate text-[#1E5AA8] dark:text-sky-300">
                      /p/{slug}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 text-slate-500 hover:text-[#F58220] transition-colors shrink-0"
                      title="Sao chép link công khai"
                    >
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
