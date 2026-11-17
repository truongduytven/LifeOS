'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FileText,
  Upload,
  Link as LinkIcon,
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  Plus,
  X,
  FileUp,
  File,
  Image as ImageIcon,
  Check,
  Tag as TagIcon,
  Sparkles,
  LayoutGrid,
  List,
  HardDrive,
  Globe,
  Paperclip,
  AlertCircle,
} from 'lucide-react';
import type { DocumentItem } from '@/types/lifeos';
import GlassCard from '@/components/ui/GlassCard';
import ResponsiveModal from '@/components/ui/ResponsiveModal';

const CATEGORIES = [
  'Tất cả',
  'Công việc & Dự án',
  'Tài chính & Hóa đơn',
  'Hợp đồng & Pháp lý',
  'Học tập & Chứng chỉ',
  'Cá nhân & Y tế',
  'Kỹ thuật & Thiết kế',
];

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileIcon(fileType: string, fileName: string) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (fileType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext || '')) {
    return <ImageIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
  }
  if (fileType === 'application/pdf' || ext === 'pdf') {
    return <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
  }
  if (fileType?.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
  }
  if (fileType?.includes('zip') || ['zip', 'rar', 'tar', 'gz'].includes(ext || '')) {
    return <HardDrive className="w-5 h-5 text-[#F58220] dark:text-amber-400" />;
  }
  return <File className="w-5 h-5 text-[#1E5AA8] dark:text-sky-400" />;
}

function getFileBadgeStyle(fileType: string, fileName: string) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (fileType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext || '')) {
    return 'bg-violet-50/80 dark:bg-violet-950/40 border-violet-200/80 dark:border-violet-900/50 text-violet-700 dark:text-violet-300';
  }
  if (fileType === 'application/pdf' || ext === 'pdf') {
    return 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/50 text-rose-700 dark:text-rose-300';
  }
  if (fileType?.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300';
  }
  if (fileType?.includes('zip') || ['zip', 'rar', 'tar', 'gz'].includes(ext || '')) {
    return 'bg-[#F58220]/15 dark:bg-amber-950/40 border-[#F58220]/30 dark:border-amber-900/50 text-[#F58220] dark:text-amber-300';
  }
  return 'bg-[#1E5AA8]/10 dark:bg-blue-950/40 border-[#1E5AA8]/20 dark:border-blue-900/50 text-[#1E5AA8] dark:text-sky-300';
}

export default function DocumentCenter() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [filterType, setFilterType] = useState<'all' | 'starred' | 'local' | 'external'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Upload & Create Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Công việc & Dự án');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileData, setFileData] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : data.documents || []);
      } else {
        setErrorMessage('Không thể tải danh sách tài liệu. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Lỗi khi tải tài liệu:', err);
      setErrorMessage('Lỗi kết nối khi tải danh sách tài liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Type filter
      if (filterType === 'starred' && !doc.isStarred) return false;
      if (filterType === 'local' && !doc.fileData) return false;
      if (filterType === 'external' && !doc.externalUrl) return false;

      // Category filter
      if (selectedCategory !== 'Tất cả' && doc.category !== selectedCategory) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesFileName = doc.fileName?.toLowerCase().includes(q);
        const matchesDesc = doc.description?.toLowerCase().includes(q);
        const matchesTag = doc.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesFileName && !matchesDesc && !matchesTag) return false;
      }

      return true;
    });
  }, [documents, filterType, selectedCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: documents.length,
      starred: documents.filter((d) => d.isStarred).length,
      local: documents.filter((d) => Boolean(d.fileData)).length,
      external: documents.filter((d) => Boolean(d.externalUrl)).length,
    };
  }, [documents]);

  // File picker handler: converts to base64 for persistent storage in PostgreSQL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage(
        'Tệp lớn hơn 8MB có thể vượt quá giới hạn hàng PostgreSQL. Khuyến khích đính kèm link Drive/S3 đối với tệp dung lượng lớn!'
      );
    }

    setFileName(file.name);
    setFileType(file.type || 'application/octet-stream');
    setFileSize(file.size);

    if (!title) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(baseName);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Open Upload modal
  const handleOpenUpload = (mode: 'file' | 'link' = 'file') => {
    setUploadMode(mode);
    setTitle('');
    setDescription('');
    setCategory('Công việc & Dự án');
    setFileName('');
    setFileType('');
    setFileSize(0);
    setFileData('');
    setExternalUrl('');
    setTags([]);
    setTagInput('');
    setIsStarred(false);
    setIsUploadOpen(true);
  };

  // Save Document
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || uploading) return;

    try {
      setUploading(true);
      setErrorMessage(null);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        fileName: uploadMode === 'file' ? fileName : null,
        fileType: uploadMode === 'file' ? fileType : null,
        fileSize: uploadMode === 'file' ? fileSize : 0,
        fileData: uploadMode === 'file' ? fileData : null,
        externalUrl: uploadMode === 'link' ? externalUrl.trim() : null,
        tags,
        isStarred,
      };

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        setDocuments((prev) => [created, ...prev]);
        setIsUploadOpen(false);
      } else {
        const errData = await res.json().catch(() => null);
        setErrorMessage(
          errData?.error || 'Không thể lưu tài liệu. Vui lòng kiểm tra lại kích thước hoặc liên kết ngoài.'
        );
      }
    } catch (err) {
      console.error('Lỗi khi lưu tài liệu:', err);
      setErrorMessage('Lỗi kết nối khi lưu tài liệu.');
    } finally {
      setUploading(false);
    }
  };

  // Toggle Star
  const handleToggleStar = async (doc: DocumentItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const previousStar = doc.isStarred;
    const updatedStar = !previousStar;

    // Optimistic update
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, isStarred: updatedStar } : d))
    );

    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: updatedStar }),
      });

      if (!res.ok) {
        // Rollback
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, isStarred: previousStar } : d))
        );
        setErrorMessage('Không thể cập nhật đánh dấu sao.');
      }
    } catch (err) {
      console.error('Lỗi cập nhật gắn sao:', err);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, isStarred: previousStar } : d))
      );
      setErrorMessage('Lỗi kết nối khi cập nhật đánh dấu sao.');
    }
  };

  // Delete Document
  const handleDelete = async (docId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này vĩnh viễn?')) return;
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (previewDoc?.id === docId) setPreviewDoc(null);
      } else {
        setErrorMessage('Không thể xóa tài liệu. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi khi xóa tài liệu:', err);
      setErrorMessage('Lỗi kết nối khi xóa tài liệu.');
    }
  };

  // Download / Open file
  const handleDownload = (doc: DocumentItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (doc.externalUrl) {
      window.open(doc.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (doc.fileData) {
      const a = document.createElement('a');
      a.href = doc.fileData;
      a.download = doc.fileName || doc.title || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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

      {/* Top Header: Frosted Glass Panel with 3D Folder */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs uppercase font-mono tracking-widest text-[#F58220] dark:text-amber-400 font-bold bg-[#F58220]/10 dark:bg-[#F58220]/20 border border-[#F58220]/20 dark:border-[#F58220]/40 px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
              Lưu trữ & Quản lý Tệp
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E5AA8] shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
              Base64 PostgreSQL & Cloud Storage
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <img
              src="/icons/3d/folder.png"
              alt="Folder"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md shrink-0"
            />
            <span className="min-w-0 break-words">Kho Tài liệu & Lưu trữ</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Quản lý tài liệu học tập, công việc, hợp đồng, chứng chỉ và đính kèm liên kết đám mây
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={() => handleOpenUpload('file')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-semibold shadow-md shadow-[#F58220]/20 active:scale-95 transition-all text-sm whitespace-nowrap shrink-0"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Tải lên tệp</span>
          </button>
          <button
            onClick={() => handleOpenUpload('link')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFFCF7]/90 dark:bg-[#111F38]/90 hover:bg-[#FAF3E3] dark:hover:bg-[#162746] text-[#1E5AA8] dark:text-slate-100 border border-[#F5E6C8] dark:border-slate-800 font-semibold shadow-sm active:scale-95 transition-all text-sm whitespace-nowrap shrink-0"
          >
            <LinkIcon className="w-4 h-4 text-[#F58220] stroke-[2.5]" />
            <span>Thêm liên kết</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid: Frosted Glass */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterType('all')}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            filterType === 'all'
              ? 'border-[#1E5AA8] dark:border-sky-400 ring-2 ring-[#1E5AA8]/20 shadow-md'
              : 'hover:border-[#1E5AA8]/30 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Tất cả tài liệu</div>
          <div className="text-xl font-bold text-[#1E5AA8] dark:text-sky-300 mt-1 flex items-baseline justify-between">
            {stats.total}
            <FileText className="w-4 h-4 text-[#1E5AA8] dark:text-sky-400" />
          </div>
        </button>

        <button
          onClick={() => setFilterType('starred')}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            filterType === 'starred'
              ? 'border-[#F58220] ring-2 ring-[#F58220]/20 shadow-md'
              : 'hover:border-[#F58220]/30'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Quan trọng (Đã gắn sao)</div>
          <div className="text-xl font-bold text-[#F58220] dark:text-amber-400 mt-1 flex items-baseline justify-between">
            {stats.starred}
            <Star className="w-4 h-4 text-[#F58220] fill-[#F58220]" />
          </div>
        </button>

        <button
          onClick={() => setFilterType('local')}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            filterType === 'local'
              ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
              : 'hover:border-sky-500/30'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Tệp trực tiếp (DB)</div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1 flex items-baseline justify-between">
            {stats.local}
            <HardDrive className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
        </button>

        <button
          onClick={() => setFilterType('external')}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            filterType === 'external'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'hover:border-emerald-500/30'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Liên kết ngoài (Cloud)</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline justify-between">
            {stats.external}
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </button>
      </div>

      {/* Filter, Search & View Switcher Bar */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tài liệu theo tên, mô tả hoặc #thẻ..."
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

        {/* Categories horizontal scroll & view switcher */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
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

          <div className="flex items-center border border-[#F5E6C8] dark:border-slate-700 rounded-xl p-0.5 bg-[#FAF3E3]/40 dark:bg-slate-800/60 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#1E5AA8] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Chế độ lưới (Grid)"
              aria-label="Chế độ lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#1E5AA8] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Chế độ danh sách (List)"
              aria-label="Chế độ danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl h-44 animate-pulse p-5 space-y-3 border border-white/60 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200/70 dark:bg-slate-800 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded w-3/4" />
                </div>
              </div>
              <div className="h-3.5 bg-slate-200/70 dark:bg-slate-800 rounded w-full" />
              <div className="h-3.5 bg-slate-200/70 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 rounded-3xl border border-white/70 dark:border-white/10 text-center max-w-lg mx-auto my-12"
        >
          <img
            src="/icons/3d/folder.png"
            alt="Folder"
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
          />
          <h3 className="text-lg font-bold text-[#1E5AA8] dark:text-slate-100 mb-2">Kho tài liệu còn trống</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Tải lên tài liệu học tập, công việc hoặc đính kèm liên kết Drive/Notion để quản lý tập trung.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => handleOpenUpload('file')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-semibold text-sm transition-all shadow-md shadow-[#F58220]/25 whitespace-nowrap shrink-0"
            >
              Tải lên tệp đầu tiên
            </button>
            <button
              onClick={() => handleOpenUpload('link')}
              className="px-4 py-2.5 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] text-[#1E5AA8] dark:text-sky-300 font-semibold text-sm border border-[#F5E6C8] dark:border-slate-800 hover:bg-[#F5E6C8]/60 whitespace-nowrap shrink-0"
            >
              Thêm liên kết
            </button>
          </div>
        </motion.div>
      )}

      {/* Filtered Empty State */}
      {!loading && documents.length > 0 && filteredDocuments.length === 0 && (
        <div className="glass-card p-10 rounded-3xl border border-white/70 dark:border-white/10 text-center max-w-md mx-auto my-10">
          <p className="text-[#1E5AA8] dark:text-slate-100 font-bold">Không tìm thấy tài liệu phù hợp</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hãy thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc.</p>
          <button
            onClick={() => {
              setFilterType('all');
              setSelectedCategory('Tất cả');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-[#F5E6C8] dark:border-slate-800 hover:bg-[#F5E6C8]/60 whitespace-nowrap shrink-0"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Grid View: Frosted Glass Cards */}
      {!loading && filteredDocuments.length > 0 && viewMode === 'grid' && (
        <div className="max-h-[72vh] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onPreview={() => setPreviewDoc(doc)}
                  onDownload={(e) => handleDownload(doc, e)}
                  onToggleStar={(e) => handleToggleStar(doc, e)}
                  onDelete={(e) => handleDelete(doc.id, e)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* List View: Frosted Glass Table */}
      {!loading && filteredDocuments.length > 0 && viewMode === 'list' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-white/70 dark:border-white/10 shadow-sm max-h-[72vh] overflow-y-auto overscroll-contain custom-scrollbar">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-[#FAF3E3]/80 dark:bg-[#0B1528]/80 text-xs text-slate-500 dark:text-slate-400 border-b border-[#F5E6C8]/60 dark:border-slate-800">
                <tr>
                  <th className="p-4 w-10 text-center whitespace-nowrap shrink-0">Sao</th>
                  <th className="p-4">Tên tài liệu</th>
                  <th className="p-4 hidden sm:table-cell whitespace-nowrap shrink-0">Danh mục</th>
                  <th className="p-4 hidden md:table-cell whitespace-nowrap shrink-0">Dung lượng / Loại</th>
                  <th className="p-4 hidden lg:table-cell whitespace-nowrap shrink-0">Ngày tạo</th>
                  <th className="p-4 text-right whitespace-nowrap shrink-0">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5E6C8]/60 dark:divide-slate-800">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setPreviewDoc(doc)}
                    className="hover:bg-[#FAF3E3]/50 dark:hover:bg-[#162746]/50 cursor-pointer transition-colors"
                  >
                    <td className="p-4 text-center shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleStar(doc, e)}
                        className="text-slate-300 hover:text-[#F58220] transition-colors"
                        title={doc.isStarred ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            doc.isStarred ? 'text-[#F58220] fill-[#F58220]' : ''
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${getFileBadgeStyle(doc.fileType, doc.fileName || doc.title)}`}>
                          {getFileIcon(doc.fileType, doc.fileName || doc.title)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#1E5AA8] dark:text-slate-100 truncate max-w-xs sm:max-w-md min-w-0 break-words">
                            {doc.title}
                          </div>
                          {doc.fileName && (
                            <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs min-w-0 break-words font-mono">
                              {doc.fileName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                        {doc.category}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                      {doc.fileSize > 0 ? formatBytes(doc.fileSize) : doc.externalUrl ? 'Liên kết ngoài' : 'Tài liệu'}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                      {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleDownload(doc, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E5AA8] dark:hover:text-sky-300 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] transition-colors shrink-0"
                          title="Tải xuống hoặc mở liên kết"
                        >
                          {doc.fileData ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={(e) => handleDelete(doc.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                          title="Xóa tài liệu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inline Preview Modal: ResponsiveModal */}
      <ResponsiveModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || 'Xem tài liệu'}
        subtitle={
          previewDoc
            ? `${previewDoc.category} • ${
                previewDoc.fileSize > 0
                  ? formatBytes(previewDoc.fileSize)
                  : previewDoc.externalUrl
                  ? 'Liên kết đám mây'
                  : 'Tài liệu'
              }`
            : undefined
        }
        icon={
          previewDoc ? (
            <div className={`p-1.5 rounded-xl border shrink-0 ${getFileBadgeStyle(previewDoc.fileType, previewDoc.fileName || previewDoc.title)}`}>
              {getFileIcon(previewDoc.fileType, previewDoc.fileName || previewDoc.title)}
            </div>
          ) : undefined
        }
        maxWidth="2xl"
      >
        {previewDoc && (
          <div className="space-y-4">
            {/* Preview Action Header Button */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleDownload(previewDoc)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-[#F58220]/25 whitespace-nowrap shrink-0"
              >
                {previewDoc.fileData ? (
                  <>
                    <Download className="w-4 h-4" /> Tải về máy
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" /> Mở liên kết gốc
                  </>
                )}
              </button>
            </div>

            {/* Preview Content Area */}
            <div className="rounded-2xl p-4 bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 flex items-center justify-center min-h-[320px]">
              {previewDoc.fileData ? (
                previewDoc.fileType?.startsWith('image/') ? (
                  <div className="max-h-[60vh] max-w-full flex items-center justify-center">
                    <img
                      src={previewDoc.fileData}
                      alt={previewDoc.title}
                      className="max-h-[55vh] max-w-full rounded-xl object-contain shadow-lg border border-[#F5E6C8] dark:border-slate-800"
                    />
                  </div>
                ) : previewDoc.fileType === 'application/pdf' ? (
                  <iframe
                    src={previewDoc.fileData}
                    title={previewDoc.title}
                    className="w-full h-[60vh] rounded-xl border border-[#F5E6C8] dark:border-slate-800 bg-white shadow-sm"
                  />
                ) : (
                  <div className="w-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#F5E6C8]/40 dark:bg-blue-950/40 border border-[#F5E6C8] dark:border-blue-900/50 flex items-center justify-center text-[#1E5AA8] dark:text-sky-300">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">{previewDoc.fileName || previewDoc.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                      Tệp nhị phân được lưu trữ an toàn trong DB LifeOS. Nhấn &apos;Tải về máy&apos; để mở trên máy tính của bạn.
                    </p>
                    <button
                      onClick={() => handleDownload(previewDoc)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] text-white font-semibold text-xs flex items-center gap-2 shadow-sm whitespace-nowrap shrink-0"
                    >
                      <Download className="w-4 h-4" /> Tải về máy
                    </button>
                  </div>
                )
              ) : previewDoc.externalUrl ? (
                <div className="w-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Globe className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-[#1E5AA8] dark:text-slate-100">{previewDoc.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md break-all font-mono">
                    {previewDoc.externalUrl}
                  </p>
                  <a
                    href={previewDoc.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm whitespace-nowrap shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" /> Truy cập liên kết ngoài
                  </a>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">Không có dữ liệu tệp hoặc liên kết.</p>
              )}
            </div>

            {/* Description */}
            {previewDoc.description && (
              <div className="p-4 rounded-xl border border-[#F5E6C8] dark:border-slate-800 bg-[#FAF3E3]/40 dark:bg-[#0B1528] text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-800 dark:text-slate-200">Mô tả:</span> {previewDoc.description}
              </div>
            )}
          </div>
        )}
      </ResponsiveModal>

      {/* Upload & Create Document Modal: ResponsiveModal */}
      <ResponsiveModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title={uploadMode === 'file' ? 'Tải lên tài liệu từ máy tính' : 'Đính kèm liên kết ngoài (Cloud Link)'}
        subtitle="Lưu trữ tệp nhị phân an toàn hoặc đính kèm tài liệu đám mây"
        icon={
          <img
            src="/icons/3d/folder.png"
            alt="Folder"
            className="w-7 h-7 object-contain"
          />
        }
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Mode switch tabs */}
          <div className="flex border-b border-[#F5E6C8]/60 dark:border-slate-800 pb-2 gap-4">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`text-xs font-semibold pb-1.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                uploadMode === 'file'
                  ? 'border-[#F58220] text-[#F58220]'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Tải tệp trực tiếp
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('link')}
              className={`text-xs font-semibold pb-1.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                uploadMode === 'link'
                  ? 'border-[#F58220] text-[#F58220]'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Liên kết ngoài (Drive/Notion/S3)
            </button>
          </div>

          <form onSubmit={handleSaveDocument} className="space-y-4">
            {/* File picker area */}
            {uploadMode === 'file' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#F5E6C8] dark:border-slate-700 hover:border-[#F58220] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#FAF3E3]/50 dark:bg-[#0B1528] hover:bg-[#F5E6C8]/30 dark:hover:bg-[#162746]"
                >
                  <img
                    src="/icons/3d/file.png"
                    alt="File"
                    className="w-12 h-12 mx-auto mb-2 hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
                  />
                  {fileName ? (
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm min-w-0 break-words">{fileName}</p>
                      <p className="text-xs text-[#1E5AA8] dark:text-sky-300 mt-1 font-medium whitespace-nowrap">
                        {formatBytes(fileSize)} • {fileType || 'binary'}
                      </p>
                      <span className="inline-block mt-2 text-[11px] text-[#F58220] underline whitespace-nowrap">
                        Nhấp để chọn tệp khác
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Nhấp để chọn tệp từ máy tính
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Hỗ trợ PDF, hình ảnh, tài liệu văn phòng, văn bản (tối đa ~8MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* External link input */}
            {uploadMode === 'link' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Đường dẫn liên kết ngoài (URL) <span className="text-[#F58220]">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/... hoặc https://notion.so/..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15"
                />
              </div>
            )}

            {/* Document Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên hiển thị tài liệu <span className="text-[#F58220]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Báo cáo tài chính Quý 4, Hợp đồng thuê nhà..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15"
              />
            </div>

            {/* Category & Starred */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Thư mục / Danh mục
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15"
                >
                  {CATEGORIES.filter((c) => c !== 'Tất cả').map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-[#0B1528] text-slate-900 dark:text-slate-100">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isStarred}
                    onChange={(e) => setIsStarred(e.target.checked)}
                    className="sr-only"
                  />
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      isStarred ? 'text-[#F58220] fill-[#F58220]' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Đánh dấu sao quan trọng
                  </span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mô tả hoặc ghi chú tóm tắt
              </label>
              <textarea
                rows={3}
                placeholder="Ghi chú về nội dung tài liệu, phiên bản, hạn bảo mật..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15 resize-none"
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
                      if (val && !tags.includes(val)) {
                        setTags([...tags, val]);
                        setTagInput('');
                      }
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = tagInput.trim().replace(/^#/, '');
                    if (val && !tags.includes(val)) {
                      setTags([...tags, val]);
                      setTagInput('');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] hover:bg-[#F5E6C8]/70 dark:hover:bg-[#162746] text-slate-700 dark:text-slate-300 text-xs font-medium border border-[#F5E6C8] dark:border-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Thêm
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1E5AA8]/10 dark:bg-[#1E5AA8]/20 border border-[#1E5AA8]/20 dark:border-[#1E5AA8]/40 text-[#1E5AA8] dark:text-sky-300 text-xs font-medium whitespace-nowrap shrink-0"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                        className="hover:text-rose-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F5E6C8]/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] text-sm font-medium transition-all whitespace-nowrap shrink-0"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={uploading || (!fileData && !externalUrl && uploadMode === 'file')}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-[#F58220]/25 flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {uploading ? 'Đang lưu...' : 'Lưu tài liệu'}
              </button>
            </div>
          </form>
        </div>
      </ResponsiveModal>
    </div>
  );
}

// Subcomponent: Individual Document Card with Frosted Glass & Tilt
interface DocumentCardProps {
  document: DocumentItem;
  onPreview: () => void;
  onDownload: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function DocumentCard({
  document,
  onPreview,
  onDownload,
  onToggleStar,
  onDelete,
}: DocumentCardProps) {
  const badgeStyle = getFileBadgeStyle(document.fileType, document.fileName || document.title);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-full"
    >
      <GlassCard
        onClick={onPreview}
        tilt={true}
        glowColor="sapphire"
        className="h-full flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 border border-white/70 dark:border-white/10"
        padding="p-5"
      >
        <div>
          {/* Top Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl border ${badgeStyle} shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center`}>
                {getFileIcon(document.fileType, document.fileName || document.title)}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate whitespace-nowrap">
                  {document.category}
                </span>
                <h3 className="font-bold text-[#1E5AA8] dark:text-slate-100 text-sm sm:text-base leading-snug truncate group-hover:text-[#F58220] transition-colors">
                  {document.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleStar}
              className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-[#F58220] dark:hover:text-[#F58220] transition-colors shrink-0"
              title={document.isStarred ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao'}
              aria-label={document.isStarred ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao'}
            >
              <Star
                className={`w-4 h-4 ${
                  document.isStarred ? 'text-[#F58220] fill-[#F58220]' : ''
                }`}
              />
            </button>
          </div>

          {/* Description */}
          {document.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed break-words">
              {document.description}
            </p>
          )}

          {/* File / Link badge */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3 flex-wrap">
            {document.fileData ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF3E3] dark:bg-[#0B1528] text-[#1E5AA8] dark:text-sky-300 border border-[#F5E6C8] dark:border-slate-800 text-[11px] font-semibold whitespace-nowrap shrink-0">
                <HardDrive className="w-3 h-3 text-[#1E5AA8] dark:text-sky-400" />
                {document.fileSize > 0 ? formatBytes(document.fileSize) : 'Tệp DB'}
              </span>
            ) : document.externalUrl ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold whitespace-nowrap shrink-0">
                <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Liên kết ngoài
              </span>
            ) : null}

            {document.fileName && (
              <span className="truncate text-[11px] text-slate-400 dark:text-slate-500 max-w-[150px] font-mono">
                {document.fileName}
              </span>
            )}
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {document.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium whitespace-nowrap shrink-0"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-[#F5E6C8]/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span className="whitespace-nowrap">{new Date(document.createdAt).toLocaleDateString('vi-VN')}</span>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onDownload}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-[#1E5AA8] dark:hover:text-white hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] transition-colors shrink-0"
              title="Tải về hoặc mở link"
              aria-label="Tải về hoặc mở link"
            >
              {document.fileData ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
              title="Xóa tài liệu"
              aria-label="Xóa tài liệu"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
