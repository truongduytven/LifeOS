'use client';

import React, { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ChevronLeft,
  Clock,
  Globe,
  Share2,
  Copy,
  Check,
  Type,
  Sun,
  Moon,
  ShieldAlert,
  ArrowLeft,
  User,
  Sparkles,
} from 'lucide-react';
import type { Article } from '@/types/lifeos';

type ReaderTheme = 'oled' | 'sepia' | 'paper';
type ReaderFont = 'serif' | 'sans' | 'mono';

interface PublicArticleResponse extends Article {
  author?: string;
}

export default function PublicArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [article, setArticle] = useState<PublicArticleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reader Settings: Default to 'paper' (Warm Vanilla Cream theme)
  const [theme, setTheme] = useState<ReaderTheme>('paper');
  const [font, setFont] = useState<ReaderFont>('serif');
  const [fontSize, setFontSize] = useState<number>(19);
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Fetch article from public endpoint
  useEffect(() => {
    let isMounted = true;
    async function loadArticle() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/articles/public/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Bài viết không tồn tại hoặc đã tắt chế độ công khai.');
          } else {
            setError('Không thể tải bài viết vào lúc này.');
          }
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setArticle(data.article);
        }
      } catch {
        if (isMounted) setError('Lỗi kết nối khi tải bài viết.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (slug) {
      loadArticle();
    }
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Track window scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setReadingProgress(100);
      } else {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Theme styling configurations
  const themeClasses = {
    paper: {
      bg: 'bg-[#FAF3E3] dark:bg-[#0B1528]',
      text: 'text-[#1E293B] dark:text-slate-100',
      header: 'bg-[#FFFCF7]/95 dark:bg-[#111F38]/95 border-[#F5E6C8] dark:border-slate-800 text-[#1E5AA8] dark:text-slate-100 backdrop-blur-md shadow-sm',
      meta: 'text-slate-600 dark:text-slate-400',
      tag: 'bg-[#F5E6C8]/50 dark:bg-[#1E5AA8]/20 border-[#F5E6C8] dark:border-slate-700 text-[#1E5AA8] dark:text-blue-400',
      prose: 'text-[#2D3748] dark:text-slate-200',
      border: 'border-[#F5E6C8] dark:border-slate-800',
      btn: 'bg-[#FFFCF7] dark:bg-[#111F38] hover:bg-[#F5E6C8]/50 dark:hover:bg-[#162746] text-[#1E5AA8] dark:text-slate-100 border-[#F5E6C8] dark:border-slate-800',
    },
    sepia: {
      bg: 'bg-[#fbf0d9]',
      text: 'text-[#3c2f1f]',
      header: 'bg-[#f4e6ca]/90 border-[#e8d2b2] text-[#3c2f1f] backdrop-blur-md',
      meta: 'text-[#78644e]',
      tag: 'bg-[#f1dec0] border-[#dec29c] text-[#5e4933]',
      prose: 'text-[#433422]',
      border: 'border-[#dec29c]',
      btn: 'bg-[#f1dec0] hover:bg-[#e8cca8] text-[#3c2f1f] border-[#dec29c]',
    },
    oled: {
      bg: 'bg-[#080c14]',
      text: 'text-zinc-100',
      header: 'bg-[#080c14]/90 border-zinc-800 text-zinc-100 backdrop-blur-md',
      meta: 'text-zinc-400',
      tag: 'bg-zinc-800/80 border-zinc-700 text-zinc-300',
      prose: 'text-zinc-200',
      border: 'border-zinc-800',
      btn: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800',
    },
  }[theme];

  const fontClass = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
  }[font];

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF3E3] dark:bg-[#0B1528] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-2 border-[#F58220] border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Đang chuẩn bị trang đọc tập trung...</p>
      </div>
    );
  }

  // Error / Not Found Screen
  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#FAF3E3] dark:bg-[#0B1528] text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#FFFCF7] dark:bg-[#111F38] p-8 rounded-3xl border border-[#F5E6C8] dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto text-rose-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-[#1E5AA8] dark:text-slate-100">Bài viết không khả dụng</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {error || 'Bài viết này không tồn tại hoặc đã bị tắt chế độ chia sẻ công khai.'}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white text-sm font-medium transition-colors shadow-md shadow-[#F58220]/25 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Đăng nhập vào LifeOS</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const authorDisplay = article.author || 'Tác giả';
  const authorInitial = authorDisplay[0]?.toUpperCase() || 'T';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themeClasses.bg} ${themeClasses.text}`}>
      {/* Top Floating Reading Progress Bar (Sunset Orange) */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-black/5">
        <div
          className="h-full bg-gradient-to-r from-[#F58220] to-[#E06D10] transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Reader Sticky Header */}
      <header className={`sticky top-0 z-40 px-3 sm:px-8 py-2.5 sm:py-3.5 border-b transition-colors ${themeClasses.header}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Link
              href="/login"
              className={`p-1.5 min-h-[40px] min-w-[40px] rounded-xl border transition-colors flex items-center justify-center whitespace-nowrap shrink-0 ${themeClasses.btn}`}
              title="Về LifeOS"
            >
              <img
                src="/icons/3d/logo.png"
                alt="LifeOS"
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-sm"
              />
            </Link>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#F58220] flex items-center gap-1 whitespace-nowrap">
                <img
                  src="/icons/3d/glasses.png"
                  alt="Glasses"
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain inline"
                />
                LifeOS Reader
              </span>
              <h2 className="text-xs sm:text-sm font-semibold truncate leading-tight text-[#1E5AA8] dark:text-slate-100 max-w-[130px] xs:max-w-[200px] sm:max-w-md">
                {article.title}
              </h2>
            </div>
          </div>

          {/* Reader Controls Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Font Selector (Tablet & Desktop) */}
            <div className={`hidden md:flex items-center border rounded-xl p-0.5 text-xs ${themeClasses.border}`}>
              <button
                onClick={() => setFont('serif')}
                className={`px-2 py-1 rounded-lg font-serif transition-colors whitespace-nowrap shrink-0 ${
                  font === 'serif' ? 'bg-[#1E5AA8] text-white' : 'hover:opacity-80'
                }`}
              >
                Serif
              </button>
              <button
                onClick={() => setFont('sans')}
                className={`px-2 py-1 rounded-lg font-sans transition-colors whitespace-nowrap shrink-0 ${
                  font === 'sans' ? 'bg-[#1E5AA8] text-white' : 'hover:opacity-80'
                }`}
              >
                Sans
              </button>
              <button
                onClick={() => setFont('mono')}
                className={`px-2 py-1 rounded-lg font-mono transition-colors whitespace-nowrap shrink-0 ${
                  font === 'mono' ? 'bg-[#1E5AA8] text-white' : 'hover:opacity-80'
                }`}
              >
                Mono
              </button>
            </div>

            {/* Font Size Buttons */}
            <div className={`flex items-center border rounded-xl p-0.5 text-xs ${themeClasses.border}`}>
              <button
                onClick={() => setFontSize((s) => Math.max(15, s - 2))}
                className="px-1.5 sm:px-2 py-1 hover:opacity-80 font-bold whitespace-nowrap shrink-0"
                title="Giảm cỡ chữ"
              >
                A-
              </button>
              <span className="px-1 text-[10px] sm:text-[11px] opacity-70 font-mono">{fontSize}</span>
              <button
                onClick={() => setFontSize((s) => Math.min(26, s + 2))}
                className="px-1.5 sm:px-2 py-1 hover:opacity-80 font-bold whitespace-nowrap shrink-0"
                title="Tăng cỡ chữ"
              >
                A+
              </button>
            </div>

            {/* Theme Toggle */}
            <div className={`flex items-center border rounded-xl p-0.5 text-xs ${themeClasses.border}`}>
              <button
                onClick={() => setTheme('paper')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                  theme === 'paper' ? 'bg-[#1E5AA8] text-white' : 'hover:opacity-80'
                }`}
                title="Vanilla Cream Paper (Mặc định)"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                  theme === 'sepia' ? 'bg-[#92400e] text-white' : 'hover:opacity-80'
                }`}
                title="Warm Sepia"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#dfc092] border border-[#a27845]" />
              </button>
              <button
                onClick={() => setTheme('oled')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                  theme === 'oled' ? 'bg-zinc-800 text-white' : 'hover:opacity-80'
                }`}
                title="Dark OLED"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Copy Public Link Button */}
            <button
              onClick={handleCopyLink}
              className={`p-2 rounded-xl border transition-colors whitespace-nowrap shrink-0 ${themeClasses.btn}`}
              title="Sao chép link bài viết này"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4 text-[#F58220]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Reader Content Article */}
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        {/* Cover Image */}
        {article.coverImage && (
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[#F5E6C8] dark:border-slate-800 max-h-96 w-full mb-10">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Meta Header */}
        <div className="space-y-5 border-b pb-8 border-[#F5E6C8] dark:border-slate-800 mb-10">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`px-3 py-1 rounded-full font-medium border whitespace-nowrap shrink-0 ${themeClasses.tag}`}>
              {article.category || 'General'}
            </span>
            <span className={themeClasses.meta}>•</span>
            <span className={`flex items-center gap-1 whitespace-nowrap ${themeClasses.meta}`}>
              <Clock className="w-3.5 h-3.5 text-[#F58220]" />
              {article.readingTime || 1} phút đọc
            </span>
            <span className={themeClasses.meta}>•</span>
            <span className={`whitespace-nowrap ${themeClasses.meta}`}>
              {new Date(article.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-[#1E5AA8] dark:text-slate-100 min-w-0 break-words ${fontClass}`}>
            {article.title}
          </h1>

          {/* Author Badge */}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-9 h-9 rounded-full bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 flex items-center justify-center text-[#1E5AA8] dark:text-blue-400 font-bold text-sm shrink-0">
              {authorInitial}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight text-slate-800 dark:text-slate-200 truncate">{authorDisplay}</div>
              <div className={`text-xs ${themeClasses.meta}`}>Tác giả bài viết</div>
            </div>
          </div>

          {article.excerpt && (
            <p className="text-lg italic leading-relaxed opacity-90 border-l-2 pl-4 border-[#F58220] pt-2 min-w-0 break-words">
              {article.excerpt}
            </p>
          )}
        </div>

        {/* Article Body */}
        <article
          className={`prose-reader ${fontClass} ${themeClasses.prose} min-w-0 break-words`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.85,
          }}
        >
          {article.content ? (
            article.content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('# ')) {
                return (
                  <h1 key={idx} className="text-2xl font-bold mt-10 mb-4 text-[#1E5AA8] dark:text-blue-400 min-w-0 break-words">
                    {paragraph.replace('# ', '')}
                  </h1>
                );
              }
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-xl font-bold mt-8 mb-3 text-[#1E5AA8] dark:text-blue-400 min-w-0 break-words">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('> ')) {
                return (
                  <blockquote key={idx} className="border-l-4 border-[#F58220] pl-4 py-1 italic my-5 opacity-90 min-w-0 break-words">
                    {paragraph.replace('> ', '')}
                  </blockquote>
                );
              }
              return (
                <p key={idx} className="mb-6 whitespace-pre-line leading-relaxed min-w-0 break-words">
                  {paragraph}
                </p>
              );
            })
          ) : (
            <p className="italic opacity-60">Chưa có nội dung cho bài viết này.</p>
          )}
        </article>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-10 border-t border-[#F5E6C8] dark:border-slate-800 mt-12">
            {article.tags.map((t) => (
              <span
                key={t}
                className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 ${themeClasses.tag}`}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Reader Footer Banner */}
        <footer className="mt-16 pt-8 border-t border-[#F5E6C8] dark:border-slate-800 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#F58220]">
            <Sparkles className="w-4 h-4" />
            <span>Xuất bản từ không gian làm việc số LifeOS</span>
          </div>
          <p className={`text-xs max-w-sm mx-auto ${themeClasses.meta}`}>
            Bài viết này được tạo và lưu trữ trên nền tảng cá nhân LifeOS với cơ sở dữ liệu Neon PostgreSQL.
          </p>
        </footer>
      </main>
    </div>
  );
}
