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
} from 'lucide-react';
import type { DocumentItem } from '@/types/lifeos';

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
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (fileType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext || '')) {
    return <ImageIcon className="w-5 h-5 text-violet-600" />;
  }
  if (fileType === 'application/pdf' || ext === 'pdf') {
    return <FileText className="w-5 h-5 text-rose-600" />;
  }
  if (fileType?.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileText className="w-5 h-5 text-emerald-600" />;
  }
  if (fileType?.includes('zip') || ['zip', 'rar', 'tar', 'gz'].includes(ext || '')) {
    return <HardDrive className="w-5 h-5 text-[#F58220]" />;
  }
  return <File className="w-5 h-5 text-[#1E5AA8]" />;
}

function getFileBadgeStyle(fileType: string, fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (fileType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext || '')) {
    return 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/50 text-violet-700 dark:text-violet-400';
  }
  if (fileType === 'application/pdf' || ext === 'pdf') {
    return 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400';
  }
  if (fileType?.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400';
  }
  if (fileType?.includes('zip') || ['zip', 'rar', 'tar', 'gz'].includes(ext || '')) {
    return 'bg-[#F58220]/10 dark:bg-amber-950/30 border-[#F58220]/30 dark:border-amber-900/50 text-[#F58220] dark:text-amber-400';
  }
  return 'bg-[#F5E6C8]/40 dark:bg-blue-950/40 border-[#F5E6C8] dark:border-blue-900/50 text-[#1E5AA8] dark:text-blue-400';
}

export default function DocumentCenter() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
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
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : data.documents || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải tài liệu:', err);
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
      alert('Tệp lớn hơn 8MB có thể vượt quá giới hạn hàng PostgreSQL. Khuyến khích đính kèm link Drive/S3 đối với tệp dung lượng lớn!');
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
    if (!title.trim()) return;

    try {
      setUploading(true);
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
      }
    } catch (err) {
      console.error('Lỗi khi lưu tài liệu:', err);
    } finally {
      setUploading(false);
    }
  };

  // Toggle Star
  const handleToggleStar = async (doc: DocumentItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updatedStar = !doc.isStarred;
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: updatedStar }),
      });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, isStarred: updatedStar } : d))
        );
      }
    } catch (err) {
      console.error('Lỗi cập nhật gắn sao:', err);
    }
  };

  // Delete Document
  const handleDelete = async (docId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này vĩnh viễn?')) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (previewDoc?.id === docId) setPreviewDoc(null);
      }
    } catch (err) {
      console.error('Lỗi khi xóa tài liệu:', err);
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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E5AA8] dark:text-slate-100 flex items-center gap-3">
            <img
              src="/icons/3d/folder.png"
              alt="Folder"
              className="w-9 h-9 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
            />
            Kho Tài liệu & Lưu trữ (Document Center)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Quản lý tài liệu học tập, công việc, hợp đồng, chứng chỉ và đính kèm liên kết đám mây
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => handleOpenUpload('file')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-medium shadow-md shadow-[#F58220]/20 active:scale-95 transition-all text-sm whitespace-nowrap shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Tải lên tệp</span>
          </button>
          <button
            onClick={() => handleOpenUpload('link')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFFCF7] dark:bg-[#111F38] hover:bg-[#FAF3E3] dark:hover:bg-[#162746] text-[#1E5AA8] dark:text-slate-100 border border-[#F5E6C8] dark:border-slate-800 font-medium shadow-sm active:scale-95 transition-all text-sm whitespace-nowrap shrink-0"
          >
            <LinkIcon className="w-4 h-4 text-[#F58220]" />
            <span>Thêm liên kết</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterType('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterType === 'all'
              ? 'bg-[#F5E6C8]/60 dark:bg-[#1E5AA8]/30 border-[#1E5AA8] ring-2 ring-[#1E5AA8]/20 shadow-md'
              : 'bg-[#FFFCF7] dark:bg-[#111F38] border-[#F5E6C8] dark:border-slate-800 hover:border-[#1E5AA8]/30 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Tất cả tài liệu</div>
          <div className="text-xl font-bold text-[#1E5AA8] dark:text-slate-100 mt-1 flex items-baseline justify-between">
            {stats.total}
            <FileText className="w-4 h-4 text-[#1E5AA8] dark:text-blue-400" />
          </div>
        </button>

        <button
          onClick={() => setFilterType('starred')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterType === 'starred'
              ? 'bg-[#F5E6C8]/60 dark:bg-[#F58220]/25 border-[#F58220] ring-2 ring-[#F58220]/20 shadow-md'
              : 'bg-[#FFFCF7] dark:bg-[#111F38] border-[#F5E6C8] dark:border-slate-800 hover:border-[#F58220]/40 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Đã gắn sao</div>
          <div className="text-xl font-bold text-[#F58220] dark:text-[#F58220] mt-1 flex items-baseline justify-between">
            {stats.starred}
            <Star className="w-4 h-4 text-[#F58220] fill-[#F58220]" />
          </div>
        </button>

        <button
          onClick={() => setFilterType('local')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterType === 'local'
              ? 'bg-[#F5E6C8]/60 dark:bg-[#1E5AA8]/30 border-[#1E5AA8] ring-2 ring-[#1E5AA8]/20 shadow-md'
              : 'bg-[#FFFCF7] dark:bg-[#111F38] border-[#F5E6C8] dark:border-slate-800 hover:border-[#1E5AA8]/30 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Tệp lưu nội bộ (DB)</div>
          <div className="text-xl font-bold text-[#1E5AA8] dark:text-slate-100 mt-1 flex items-baseline justify-between">
            {stats.local}
            <HardDrive className="w-4 h-4 text-[#1E5AA8] dark:text-blue-400" />
          </div>
        </button>

        <button
          onClick={() => setFilterType('external')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterType === 'external'
              ? 'bg-[#F5E6C8]/60 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-[#FFFCF7] dark:bg-[#111F38] border-[#F5E6C8] dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Liên kết ngoài (Cloud)</div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-baseline justify-between">
            {stats.external}
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFCF7] dark:bg-[#111F38] p-3.5 rounded-2xl border border-[#F5E6C8] dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên tệp, tiêu đề, mô tả hoặc #tag..."
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

        {/* Categories selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 pl-1 font-medium whitespace-nowrap shrink-0">
            <Filter className="w-3.5 h-3.5" /> Thư mục:
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

          {/* View mode toggle */}
          <div className="flex items-center border border-[#F5E6C8] dark:border-slate-800 bg-[#FAF3E3] dark:bg-[#0B1528] rounded-xl p-0.5 ml-2 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-[#FFFCF7] dark:bg-[#111F38] text-[#1E5AA8] dark:text-slate-100 shadow-sm font-semibold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-[#FFFCF7] dark:bg-[#111F38] text-[#1E5AA8] dark:text-slate-100 shadow-sm font-semibold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Dạng danh sách"
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
            <div key={idx} className="bg-[#FFFCF7] dark:bg-[#111F38] rounded-2xl border border-[#F5E6C8] dark:border-slate-800 h-48 animate-pulse p-5 space-y-3 shadow-sm">
              <div className="h-6 bg-[#FAF3E3] dark:bg-[#0B1528] rounded w-2/3" />
              <div className="h-4 bg-[#FAF3E3] dark:bg-[#0B1528] rounded w-full" />
              <div className="h-4 bg-[#FAF3E3] dark:bg-[#0B1528] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FFFCF7] dark:bg-[#111F38] p-12 rounded-3xl border border-[#F5E6C8] dark:border-slate-800 shadow-sm text-center max-w-lg mx-auto my-12"
        >
          <img
            src="/icons/3d/folder.png"
            alt="Folder"
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
          />
          <h3 className="text-lg font-semibold text-[#1E5AA8] dark:text-slate-100 mb-2">Chưa có tài liệu nào</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Bắt đầu tải lên tệp từ máy tính hoặc đính kèm liên kết từ Google Drive, Notion, GitHub để quản lý tập trung.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleOpenUpload('file')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-medium text-sm transition-all shadow-md shadow-[#F58220]/25 whitespace-nowrap shrink-0"
            >
              Tải lên tệp đầu tiên
            </button>
          </div>
        </motion.div>
      )}

      {/* Filtered Empty State */}
      {!loading && documents.length > 0 && filteredDocuments.length === 0 && (
        <div className="bg-[#FFFCF7] dark:bg-[#111F38] p-8 rounded-2xl border border-[#F5E6C8] dark:border-slate-800 shadow-sm text-center max-w-md mx-auto my-8">
          <p className="text-[#1E5AA8] dark:text-slate-100 font-medium">Không tìm thấy tài liệu nào phù hợp</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hãy điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          <button
            onClick={() => {
              setFilterType('all');
              setSelectedCategory('Tất cả');
              setSearchQuery('');
            }}
            className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] text-slate-700 dark:text-slate-300 text-xs font-medium border border-[#F5E6C8] dark:border-slate-800 hover:bg-[#F5E6C8]/60 dark:hover:bg-[#162746] whitespace-nowrap shrink-0"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Documents Grid View */}
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

      {/* Documents List View */}
      {!loading && filteredDocuments.length > 0 && viewMode === 'list' && (
        <div className="bg-[#FFFCF7] dark:bg-[#111F38] rounded-2xl overflow-hidden border border-[#F5E6C8] dark:border-slate-800 shadow-sm max-h-[72vh] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="text-xs uppercase bg-[#FAF3E3] dark:bg-[#0B1528] text-[#1E5AA8] dark:text-slate-100 border-b border-[#F5E6C8] dark:border-slate-800 font-semibold">
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
                        className="text-slate-300 hover:text-[#F58220]"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            doc.isStarred ? 'text-[#F58220] fill-[#F58220]' : ''
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border shrink-0 ${getFileBadgeStyle(doc.fileType, doc.fileName || doc.title)}`}>
                          {getFileIcon(doc.fileType, doc.fileName || doc.title)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#1E5AA8] dark:text-slate-100 truncate max-w-xs sm:max-w-md min-w-0 break-words">
                            {doc.title}
                          </div>
                          {doc.fileName && (
                            <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs min-w-0 break-words">
                              {doc.fileName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E5AA8] dark:hover:text-blue-400 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] transition-colors shrink-0"
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

      {/* Inline Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#FFFCF7] dark:bg-[#111F38] w-full max-w-4xl rounded-2xl shadow-2xl relative border border-[#F5E6C8] dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] overflow-y-auto overscroll-contain custom-scrollbar"
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between p-4 px-6 border-b border-[#F5E6C8] dark:border-slate-800 bg-[#FFFCF7] dark:bg-[#111F38]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl border shrink-0 ${getFileBadgeStyle(previewDoc.fileType, previewDoc.fileName || previewDoc.title)}`}>
                    {getFileIcon(previewDoc.fileType, previewDoc.fileName || previewDoc.title)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#1E5AA8] dark:text-slate-100 text-base truncate">{previewDoc.title}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{previewDoc.category}</span>
                      {previewDoc.fileSize > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatBytes(previewDoc.fileSize)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap shrink-0"
                  >
                    {previewDoc.fileData ? (
                      <>
                        <Download className="w-3.5 h-3.5" /> Tải về
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" /> Mở liên kết gốc
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preview Content Area */}
              <div className="flex-1 overflow-auto p-6 bg-[#FAF3E3]/70 dark:bg-[#0B1528] flex items-center justify-center min-h-[350px]">
                {previewDoc.fileData ? (
                  previewDoc.fileType?.startsWith('image/') ? (
                    <div className="max-h-[60vh] max-w-full flex items-center justify-center">
                      <img
                        src={previewDoc.fileData}
                        alt={previewDoc.title}
                        className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg border border-[#F5E6C8] dark:border-slate-800"
                      />
                    </div>
                  ) : previewDoc.fileType === 'application/pdf' ? (
                    <iframe
                      src={previewDoc.fileData}
                      title={previewDoc.title}
                      className="w-full h-[65vh] rounded-xl border border-[#F5E6C8] dark:border-slate-800 bg-white shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#F5E6C8]/40 dark:bg-blue-950/40 border border-[#F5E6C8] dark:border-blue-900/50 flex items-center justify-center text-[#1E5AA8] dark:text-blue-400">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-semibold">{previewDoc.fileName || previewDoc.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                        Tệp nhị phân được lưu trữ an toàn trong DB LifeOS. Nhấn &apos;Tải về&apos; để mở trên máy tính của bạn.
                      </p>
                      <button
                        onClick={() => handleDownload(previewDoc)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] text-white font-medium text-xs flex items-center gap-2 shadow-sm whitespace-nowrap shrink-0"
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
                    <h4 className="text-base font-semibold text-[#1E5AA8] dark:text-slate-100">{previewDoc.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md break-all font-mono">
                      {previewDoc.externalUrl}
                    </p>
                    <a
                      href={previewDoc.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs flex items-center gap-2 shadow-sm whitespace-nowrap shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" /> Truy cập liên kết ngoài
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Không có dữ liệu tệp hoặc liên kết.</p>
                )}
              </div>

              {/* Preview Footer / Description */}
              {previewDoc.description && (
                <div className="p-4 px-6 border-t border-[#F5E6C8] dark:border-slate-800 bg-[#FFFCF7] dark:bg-[#111F38] text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Mô tả:</span> {previewDoc.description}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload & Create Document Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#FFFCF7] dark:bg-[#111F38] w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative border border-[#F5E6C8] dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] overflow-y-auto overscroll-contain custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#F5E6C8]/60 dark:border-slate-800">
                <h2 className="text-lg font-bold text-[#1E5AA8] dark:text-slate-100 flex items-center gap-2">
                  <img
                    src="/icons/3d/folder.png"
                    alt="Folder"
                    className="w-6 h-6 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-sm"
                  />
                  {uploadMode === 'file' ? 'Tải lên tài liệu từ máy tính' : 'Đính kèm liên kết ngoài (Cloud Link)'}
                </h2>
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode switch tabs */}
              <div className="flex border-b border-[#F5E6C8]/60 dark:border-slate-800 pt-3 pb-1 gap-4">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`text-xs font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
                  className={`text-xs font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    uploadMode === 'link'
                      ? 'border-[#F58220] text-[#F58220]'
                      : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Liên kết ngoài (Drive/Notion/S3)
                </button>
              </div>

              <form onSubmit={handleSaveDocument} className="flex-1 overflow-y-auto py-4 space-y-4">
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
                          <p className="text-xs text-[#1E5AA8] dark:text-blue-400 mt-1 font-medium whitespace-nowrap">
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
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15"
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
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15"
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
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15"
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
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
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
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/15 resize-none"
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
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8]"
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
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-[#1E5AA8] dark:text-blue-400 text-xs font-medium whitespace-nowrap shrink-0"
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
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md shadow-[#F58220]/25 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    {uploading ? 'Đang lưu...' : 'Lưu tài liệu'}
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

// Subcomponent: Individual Document Card
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
      onClick={onPreview}
      className="bg-[#FFFCF7] dark:bg-[#111F38] rounded-2xl p-5 border border-[#F5E6C8] dark:border-slate-800 hover:border-[#1E5AA8]/40 dark:hover:border-slate-700 cursor-pointer flex flex-col justify-between group transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-xl border ${badgeStyle} shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center`}>
              {getFileIcon(document.fileType, document.fileName || document.title)}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate whitespace-nowrap">
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
            className="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-[#F58220] dark:hover:text-[#F58220] transition-colors shrink-0"
            title={document.isStarred ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao'}
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
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF3E3] dark:bg-[#0B1528] text-[#1E5AA8] dark:text-blue-400 border border-[#F5E6C8] dark:border-slate-800 text-[11px] font-medium whitespace-nowrap shrink-0">
              <HardDrive className="w-3 h-3 text-[#1E5AA8] dark:text-blue-400" />
              {document.fileSize > 0 ? formatBytes(document.fileSize) : 'Tệp DB'}
            </span>
          ) : document.externalUrl ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium whitespace-nowrap shrink-0">
              <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Liên kết ngoài
            </span>
          ) : null}

          {document.fileName && (
            <span className="truncate text-[11px] text-slate-400 dark:text-slate-500 max-w-[150px]">
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
          >
            {document.fileData ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
            title="Xóa tài liệu"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
