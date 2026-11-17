'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Clock,
  Sun,
  Moon,
  AlertCircle,
  ArrowRight,
  Loader2,
  BookOpen,
  RotateCcw,
  Filter,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Icon3D from '@/components/ui/Icon3D';

interface PublicArticleSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  author: string;
}

interface PublicArticlesResponse {
  articles: PublicArticleSummary[];
  total: number;
  categories: string[];
  limit: number;
  offset: number;
}

const PAGE_LIMIT = 24;

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

function formatVietnameseDate(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function PublicArticleCover({
  src,
  alt,
  category,
  readingTime,
}: {
  src?: string | null;
  alt: string;
  category: string;
  readingTime: number;
}) {
  const trimmedSrc = src?.trim() || '';
  const hasSrc = Boolean(trimmedSrc);
  const isSafe = isSafeCoverUrl(trimmedSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [trimmedSrc]);

  return (
    <div className="relative w-full aspect-video overflow-hidden border-b border-[#F5E6C8]/70 dark:border-slate-800 bg-gradient-to-tr from-[#FAF3E3] via-[#F5E6C8]/45 to-[#FFFCF7] dark:from-[#0B1528] dark:via-[#111F38] dark:to-[#0B1528] backdrop-blur-md">
      {hasSrc && isSafe && !hasError ? (
        <img
          src={trimmedSrc}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={() => setHasError(true)}
        />
      ) : hasSrc ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-4 text-center">
          <Icon3D name="bookmark" size={40} />
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Không thể tải ảnh bìa
          </span>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/icons/3d/file-text.png"
            alt=""
            aria-hidden="true"
            className="w-14 h-14 object-contain group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
          />
        </div>
      )}

      {/* Top Category Badge */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        <span className="px-2.5 py-1 rounded-lg bg-[#FFFCF7]/90 dark:bg-[#111F38]/90 backdrop-blur-md text-[#1E5AA8] dark:text-sky-300 text-[11px] font-semibold border border-white/80 dark:border-slate-700 shadow-sm whitespace-nowrap shrink-0 max-w-[75%] truncate">
          {category || 'Chung'}
        </span>
      </div>

      {/* Bottom Reading Time Badge */}
      <div className="absolute bottom-3 left-3 pointer-events-none">
        <span className="px-2.5 py-1 rounded-lg bg-[#FFFCF7]/90 dark:bg-[#111F38]/90 backdrop-blur-md text-slate-700 dark:text-slate-200 text-[11px] border border-white/80 dark:border-slate-700 inline-flex items-center gap-1 font-medium shadow-sm whitespace-nowrap shrink-0">
          <Clock className="w-3 h-3 text-[#F58220] shrink-0" />
          <span>{readingTime || 1} phút đọc</span>
        </span>
      </div>
    </div>
  );
}

export default function PublicArticlesDirectoryPage() {
  const [articles, setArticles] = useState<PublicArticleSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);

  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync initial theme from localStorage ('lifeos_theme')
  useEffect(() => {
    const storedTheme = localStorage.getItem('lifeos_theme');
    if (storedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        localStorage.setItem('lifeos_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('lifeos_theme', 'light');
      }
      return next;
    });
  };

  // Debounce search input (300ms)
  useEffect(() => {
    const trimmed = searchInput.trim();
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchArticles = useCallback(
    async ({
      q,
      category,
      offset,
      append,
    }: {
      q: string;
      category: string;
      offset: number;
      append: boolean;
    }) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setErrorMessage(null);

        const params = new URLSearchParams();
        params.set('limit', String(PAGE_LIMIT));
        params.set('offset', String(offset));
        if (q) params.set('q', q);
        if (category && category !== 'Tất cả') params.set('category', category);

        const res = await fetch(`/api/articles/public?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error('Không thể tải danh sách bài viết công khai.');
        }

        const data: PublicArticlesResponse = await res.json();
        const incoming = Array.isArray(data.articles) ? data.articles : [];

        setArticles((prev) => {
          if (!append) return incoming;
          const seen = new Set(prev.map((item) => item.id));
          return [...prev, ...incoming.filter((item) => !seen.has(item.id))];
        });
        setTotal(typeof data.total === 'number' ? data.total : incoming.length);
        if (Array.isArray(data.categories)) {
          setCategories(data.categories.filter((cat) => cat && cat !== 'Tất cả'));
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Lỗi kết nối khi tải danh sách bài viết công khai.'
        );
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchArticles({
      q: debouncedQuery,
      category: selectedCategory,
      offset: 0,
      append: false,
    });
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [debouncedQuery, selectedCategory, fetchArticles]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDebouncedQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedQuery('');
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedQuery('');
    setSelectedCategory('Tất cả');
  };

  const handleLoadMore = () => {
    if (loadingMore || articles.length >= total) return;
    fetchArticles({
      q: debouncedQuery,
      category: selectedCategory,
      offset: articles.length,
      append: true,
    });
  };

  const hasActiveFilters = Boolean(debouncedQuery) || selectedCategory !== 'Tất cả';
  const categoryOptions = ['Tất cả', ...categories];

  return (
    <div className="min-h-screen bg-[#FAF3E3] dark:bg-[#0B1528] text-slate-900 dark:text-slate-100 relative overflow-x-hidden transition-colors duration-200 flex flex-col">
      {/* Ambient Light-Mode Refraction Glow Orbs (Hidden in Dark Mode) */}
      <div className="dark:hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-28 -left-28 w-[30rem] h-[30rem] bg-[#1E5AA8]/15 rounded-full blur-[110px]" />
        <div className="absolute top-24 -right-24 w-[28rem] h-[28rem] bg-[#F58220]/15 rounded-full blur-[110px]" />
        <div className="absolute bottom-10 left-1/3 w-[26rem] h-[26rem] bg-[#F5E6C8]/80 rounded-full blur-[100px]" />
      </div>

      {/* Sticky Frosted-Glass Header */}
      <header className="sticky top-0 z-40 border-b border-[#F5E6C8]/80 dark:border-white/10 bg-[#FFFCF7]/85 dark:bg-[#111F38]/85 backdrop-blur-xl shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <Link
            href="/p"
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] rounded-xl"
          >
            <span className="p-1.5 min-h-[44px] min-w-[44px] rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <img
                src="/icons/3d/logo.png"
                alt="LifeOS"
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
              />
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F58220] block leading-tight truncate">
                LifeOS Public
              </span>
              <span className="text-sm sm:text-base font-bold text-[#1E5AA8] dark:text-slate-100 block leading-tight truncate">
                Thư viện Bài viết Công khai
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              aria-pressed={isDark}
              title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] hover:bg-[#F5E6C8]/70 dark:hover:bg-[#172a4a] border border-[#F5E6C8] dark:border-slate-700 text-[#1E5AA8] dark:text-slate-200 flex items-center justify-center gap-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-[#F58220] shrink-0" />
                  <span className="hidden sm:inline">Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#1E5AA8] shrink-0" />
                  <span className="hidden sm:inline">Tối</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Hero & Search Panel */}
        <section className="glass-panel rounded-3xl p-5 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase tracking-wider text-[#F58220] dark:text-amber-400 font-bold bg-[#F58220]/10 dark:bg-[#F58220]/20 border border-[#F58220]/20 dark:border-[#F58220]/40 px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                  Kho Tri thức Mở
                </span>
                {!loading && (
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-[#FAF3E3]/80 dark:bg-[#0B1528]/80 border border-[#F5E6C8] dark:border-slate-700 px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                    {total} bài viết công khai
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1E5AA8] dark:text-slate-100 flex items-center gap-3 min-w-0 break-words">
                <Icon3D name="glasses" size={42} priority className="shrink-0" />
                <span className="min-w-0 break-words">Thư viện Bài viết Công khai</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Tìm kiếm và đọc các ghi chép, bài viết chuyên sâu được chia sẻ công khai từ không gian LifeOS.
              </p>
            </div>
          </div>

          {/* Search Landmark & Filter Pills */}
          <div className="space-y-4">
            <search>
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="relative flex items-center gap-2"
              >
                <div className="relative flex-1 min-w-0">
                  <Search
                    className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Tìm theo tiêu đề, tóm tắt hoặc thẻ (#tag)..."
                    aria-label="Tìm kiếm bài viết công khai"
                    className="w-full min-h-[48px] pl-11 pr-11 py-2.5 rounded-2xl glass-input text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 [&::-webkit-search-cancel-button]:hidden"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      aria-label="Xóa từ khóa tìm kiếm"
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </search>

            {/* Horizontally Scrollable Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium inline-flex items-center gap-1.5 pr-1 whitespace-nowrap shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#F58220]" />
                Chủ đề:
              </span>
              {categoryOptions.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#1E5AA8] text-white font-semibold shadow-sm shadow-[#1E5AA8]/25'
                        : 'bg-[#FFFCF7]/80 dark:bg-[#0B1528]/80 text-slate-700 dark:text-slate-300 hover:bg-[#F5E6C8]/70 dark:hover:bg-[#172a4a] border border-[#F5E6C8] dark:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dismissible Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-2xl p-4 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 dark:border-rose-500/50 backdrop-blur-md flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 text-sm shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="font-medium min-w-0 break-words">{errorMessage}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  fetchArticles({
                    q: debouncedQuery,
                    category: selectedCategory,
                    offset: 0,
                    append: false,
                  })
                }
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Thử lại
              </button>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="Đóng thông báo lỗi"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton Grid */}
        {loading && (
          <div
            aria-label="Đang tải bài viết"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="glass-card rounded-3xl overflow-hidden border border-white/60 dark:border-white/10 animate-pulse"
              >
                <div className="w-full aspect-video bg-slate-200/70 dark:bg-slate-800/80" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200/70 dark:bg-slate-800 rounded-lg w-4/5" />
                  <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded-lg w-full" />
                  <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded-lg w-2/3" />
                  <div className="pt-3 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800">
                    <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded w-24" />
                    <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !errorMessage && articles.length === 0 && (
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-white/70 dark:border-white/10 text-center max-w-lg mx-auto my-6 space-y-4">
            <div className="flex justify-center">
              <Icon3D name={hasActiveFilters ? 'bookmark' : 'file-text'} size={56} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1E5AA8] dark:text-slate-100">
              {hasActiveFilters
                ? 'Không tìm thấy bài viết phù hợp'
                : 'Chưa có bài viết công khai nào'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {hasActiveFilters
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn chủ đề khác để khám phá thêm nội dung.'
                : 'Các bài viết được bật chế độ chia sẻ công khai sẽ xuất hiện tại đây.'}
            </p>
            {hasActiveFilters && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white text-sm font-semibold shadow-md shadow-[#F58220]/25 transition-all whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Responsive 1 / 2 / 3-Column Articles Grid */}
        {!loading && articles.length > 0 && (
          <section aria-label="Danh sách bài viết công khai" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {articles.map((article) => {
                const authorDisplay = article.author || 'Tác giả';
                const authorInitial = authorDisplay[0]?.toUpperCase() || 'T';
                const formattedDate = formatVietnameseDate(article.createdAt);

                return (
                  <Link
                    key={article.id}
                    href={`/p/${article.slug}`}
                    className="block h-full group rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF3E3] dark:focus-visible:ring-offset-[#0B1528]"
                  >
                    <GlassCard
                      tilt={true}
                      glowColor="sapphire"
                      padding="p-0"
                      className="h-full flex flex-col justify-between overflow-hidden border border-white/70 dark:border-white/10 transition-all duration-300 group-hover:-translate-y-1"
                    >
                      <div>
                        <PublicArticleCover
                          src={article.coverImage}
                          alt={article.title}
                          category={article.category}
                          readingTime={article.readingTime}
                        />

                        {/* Card Body */}
                        <div className="p-5 space-y-3">
                          <h2 className="font-bold text-[#1E5AA8] dark:text-slate-100 text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-[#F58220] dark:group-hover:text-[#F58220] transition-colors min-w-0 break-words">
                            {article.title}
                          </h2>

                          {article.excerpt ? (
                            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed min-w-0 break-words">
                              {article.excerpt}
                            </p>
                          ) : (
                            <p className="text-slate-400 dark:text-slate-500 text-sm italic line-clamp-2 leading-relaxed">
                              Nhấn để mở bài viết trong chế độ đọc tập trung.
                            </p>
                          )}

                          {/* Tags (up to 3) */}
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {article.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2.5 py-0.5 rounded-full bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium whitespace-nowrap shrink-0"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {article.tags.length > 3 && (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 self-center whitespace-nowrap">
                                  +{article.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 py-3.5 border-t border-[#F5E6C8]/70 dark:border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-full bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-700 flex items-center justify-center text-[#1E5AA8] dark:text-sky-300 font-bold text-xs shrink-0">
                            {authorInitial}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                              {authorDisplay}
                            </span>
                            {formattedDate && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                {formattedDate}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E5AA8] dark:text-sky-300 group-hover:text-[#F58220] transition-colors whitespace-nowrap shrink-0">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Đọc</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </GlassCard>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col items-center justify-center gap-3 pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Đang hiển thị {articles.length} / {total} bài viết
              </p>

              {articles.length < total && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-[#FFFCF7] dark:bg-[#111F38] hover:bg-[#F5E6C8]/60 dark:hover:bg-[#172a4a] text-[#1E5AA8] dark:text-sky-300 border border-[#F5E6C8] dark:border-slate-700 font-semibold text-sm shadow-sm inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#F58220]" />
                      <span>Đang tải thêm...</span>
                    </>
                  ) : (
                    <span>Tải thêm bài viết</span>
                  )}
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Clean Public Footer */}
      <footer className="relative z-10 border-t border-[#F5E6C8]/80 dark:border-white/10 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Thư viện Bài viết Công khai — LifeOS</span>
          <Link
            href="/login"
            className="text-[#1E5AA8] dark:text-sky-300 hover:text-[#F58220] font-medium transition-colors whitespace-nowrap"
          >
            Đăng nhập vào không gian làm việc
          </Link>
        </div>
      </footer>
    </div>
  );
}
