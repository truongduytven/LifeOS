'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Search,
  Filter,
  Star,
  Trash2,
  Edit3,
  ExternalLink,
  RefreshCw,
  X,
  CreditCard,
  FileCode,
  FileLock,
  Settings,
  Sparkles,
  Info,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import type { VaultItem } from '@/types/lifeos';
import GlassCard from '@/components/ui/GlassCard';
import ResponsiveModal from '@/components/ui/ResponsiveModal';
import Icon3D from '@/components/ui/Icon3D';

type VaultCategory = 'credential' | 'api_key' | 'secure_note' | 'card' | 'document';

interface CategoryConfig {
  label: string;
  icon: any;
  icon3d: string;
  color: string;
  activeBg: string;
}

const CATEGORY_MAP: Record<VaultCategory, CategoryConfig> = {
  credential: {
    label: 'Tài khoản & Mật khẩu',
    icon: Key,
    icon3d: '/icons/3d/key.png',
    color: 'text-[#1E5AA8] dark:text-sky-300 bg-[#1E5AA8]/10 dark:bg-blue-950/40 border-[#1E5AA8]/20 dark:border-blue-900/60',
    activeBg: 'bg-[#F5E6C8]/70 dark:bg-blue-950/70 border-[#1E5AA8] dark:border-blue-500 ring-2 ring-[#1E5AA8]/20 shadow-md',
  },
  api_key: {
    label: 'Khóa API & Tokens',
    icon: FileCode,
    icon3d: '/icons/3d/key.png',
    color: 'text-[#F58220] dark:text-amber-400 bg-[#F58220]/10 dark:bg-amber-950/30 border-[#F58220]/30 dark:border-amber-900/50',
    activeBg: 'bg-[#F58220]/10 dark:bg-amber-950/50 border-[#F58220] ring-2 ring-[#F58220]/20 shadow-md',
  },
  secure_note: {
    label: 'Ghi chú bảo mật',
    icon: FileLock,
    icon3d: '/icons/3d/file-text.png',
    color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
    activeBg: 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md',
  },
  card: {
    label: 'Thẻ thanh toán',
    icon: CreditCard,
    icon3d: '/icons/3d/shield.png',
    color: 'text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/50',
    activeBg: 'bg-violet-50/80 dark:bg-violet-950/60 border-violet-500 ring-2 ring-violet-500/20 shadow-md',
  },
  document: {
    label: 'Tài liệu mật',
    icon: ShieldCheck,
    icon3d: '/icons/3d/file.png',
    color: 'text-[#1E5AA8] dark:text-sky-400 bg-[#F5E6C8]/30 dark:bg-sky-950/30 border-[#F5E6C8] dark:border-sky-900/50',
    activeBg: 'bg-[#F5E6C8]/60 dark:bg-sky-950/60 border-[#1E5AA8] dark:border-sky-500 ring-2 ring-[#1E5AA8]/20 shadow-md',
  },
};

function generateStrongPassword(length = 20): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|}{[]:;?><,.-=';
  let ret = '';
  const cryptoObj = window.crypto || (window as any).msCrypto;
  const values = new Uint32Array(length);
  cryptoObj.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    ret += charset[values[i] % charset.length];
  }
  return ret;
}

export default function PersonalVault() {
  // PIN Lock States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Vault Items States
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Secret Visibility map (id -> boolean)
  const [visibleSecrets, setVisibleSecrets] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Change PIN Modal States
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changePinError, setChangePinError] = useState('');
  const [changePinSuccess, setChangePinSuccess] = useState('');
  const [changingPin, setChangingPin] = useState(false);

  // Create / Edit Item Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<VaultCategory>('credential');
  const [username, setUsername] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Fetch Vault Items once unlocked
  const fetchVaultItems = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch('/api/vault');
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.items || []);
      } else {
        setErrorMessage('Không thể tải các mục trong kho bảo mật.');
      }
    } catch (err) {
      console.error('Lỗi khi tải kho bảo mật:', err);
      setErrorMessage('Lỗi kết nối khi tải kho bảo mật.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchVaultItems();
    }
  }, [isUnlocked]);

  // Handle Verify PIN
  const handleVerifyPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) return;

    try {
      setVerifyingPin(true);
      setPinError('');
      const res = await fetch('/api/vault/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', pin: pinInput }),
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        setIsUnlocked(true);
        setPinInput('');
      } else {
        setPinError(data.error || 'Mã PIN không chính xác. Vui lòng thử lại.');
        setPinInput('');
      }
    } catch {
      setPinError('Không thể kết nối đến máy chủ.');
    } finally {
      setVerifyingPin(false);
    }
  };

  // Keyboard support for PIN entry
  useEffect(() => {
    if (isUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pinInput.length < 6) {
          setPinInput((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPinInput((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter' && pinInput.length >= 4) {
        handleVerifyPin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, pinInput]);

  // Lock Vault
  const handleLockVault = () => {
    setIsUnlocked(false);
    setPinInput('');
    setPinError('');
    setVisibleSecrets({});
  };

  // Toggle Favorite
  const handleToggleFavorite = async (item: VaultItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const previousFav = item.isFavorite;
    const updatedFav = !previousFav;

    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, isFavorite: updatedFav } : it))
    );

    try {
      const res = await fetch(`/api/vault/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: updatedFav }),
      });

      if (!res.ok) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, isFavorite: previousFav } : it))
        );
        setErrorMessage('Không thể cập nhật yêu thích.');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật yêu thích:', err);
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isFavorite: previousFav } : it))
      );
      setErrorMessage('Lỗi kết nối khi cập nhật yêu thích.');
    }
  };

  // Delete Vault Item
  const handleDelete = async (itemId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa mục bảo mật này vĩnh viễn?')) return;

    try {
      setErrorMessage(null);
      const res = await fetch(`/api/vault/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== itemId));
      } else {
        setErrorMessage('Không thể xóa mục bí mật. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi khi xóa mục kho:', err);
      setErrorMessage('Lỗi kết nối khi xóa mục bí mật.');
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string, identifier: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(identifier);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Toggle secret visibility
  const toggleSecretVisibility = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setVisibleSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle('');
    setCategory('credential');
    setUsername('');
    setSecretValue('');
    setUrl('');
    setNotes('');
    setTags([]);
    setTagInput('');
    setIsFavorite(false);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: VaultItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory((item.category as VaultCategory) || 'credential');
    setUsername(item.username || '');
    setSecretValue(item.secretValue || '');
    setUrl(item.url || '');
    setNotes(item.notes || '');
    setTags([...(item.tags || [])]);
    setTagInput('');
    setIsFavorite(Boolean(item.isFavorite));
    setIsEditorOpen(true);
  };

  // Save / Update Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || savingItem) return;

    try {
      setSavingItem(true);
      setErrorMessage(null);
      const payload = {
        title: title.trim(),
        category,
        username: username.trim() || null,
        secretValue: secretValue.trim() || null,
        url: url.trim() || null,
        notes: notes.trim() || null,
        tags,
        isFavorite,
      };

      if (editingItem) {
        const res = await fetch(`/api/vault/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const updated = await res.json();
          setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
          setIsEditorOpen(false);
        } else {
          const errData = await res.json().catch(() => null);
          setErrorMessage(errData?.error || 'Không thể cập nhật mục bí mật.');
        }
      } else {
        const res = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const created = await res.json();
          setItems((prev) => [created, ...prev]);
          setIsEditorOpen(false);
        } else {
          const errData = await res.json().catch(() => null);
          setErrorMessage(errData?.error || 'Không thể thêm mục bí mật.');
        }
      }
    } catch (err) {
      console.error('Lỗi khi lưu mục kho:', err);
      setErrorMessage('Lỗi kết nối khi lưu mục bí mật.');
    } finally {
      setSavingItem(false);
    }
  };

  // Change PIN handler
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError('');
    setChangePinSuccess('');

    if (newPin !== confirmPin) {
      setChangePinError('Mã PIN mới và xác nhận mã PIN không khớp.');
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      setChangePinError('Mã PIN mới phải có độ dài từ 4 đến 6 chữ số.');
      return;
    }

    try {
      setChangingPin(true);
      const res = await fetch('/api/vault/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change',
          oldPin: currentPin,
          newPin: newPin,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChangePinSuccess('Đổi mã PIN cấp 2 thành công!');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setTimeout(() => {
          setIsChangePinOpen(false);
          setChangePinSuccess('');
        }, 1500);
      } else {
        setChangePinError(data.error || 'Đổi mã PIN thất bại. Vui lòng kiểm tra mã PIN hiện tại.');
      }
    } catch {
      setChangePinError('Lỗi kết nối đến máy chủ khi đổi mã PIN.');
    } finally {
      setChangingPin(false);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (showFavoritesOnly && !it.isFavorite) return false;
      if (selectedCategory !== 'all' && it.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = it.title.toLowerCase().includes(q);
        const matchesUser = it.username?.toLowerCase().includes(q);
        const matchesUrl = it.url?.toLowerCase().includes(q);
        const matchesTags = it.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesUser && !matchesUrl && !matchesTags) return false;
      }

      return true;
    });
  }, [items, showFavoritesOnly, selectedCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: items.length,
      credentials: items.filter((i) => i.category === 'credential').length,
      apiKeys: items.filter((i) => i.category === 'api_key').length,
      notes: items.filter((i) => i.category === 'secure_note').length,
      favorites: items.filter((i) => i.isFavorite).length,
    };
  }, [items]);

  // ==========================================
  // VIEW: PIN LOCK SCREEN (FROSTED GLASS 3D VAULT CENTERPIECE)
  // ==========================================
  if (!isUnlocked) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
        <GlassCard
          tilt={false}
          glowColor="sapphire"
          className="w-full max-w-md max-h-[90dvh] sm:max-h-[88vh] overflow-y-auto overscroll-contain custom-scrollbar rounded-3xl border border-white/80 dark:border-white/10 shadow-2xl relative text-center"
          padding="p-6 sm:p-8"
        >
          {/* Soft Glow Accent */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-r from-[#F5E6C8]/60 to-[#FAF3E3]/80 dark:from-[#1E5AA8]/20 dark:to-[#111F38]/40 rounded-full blur-3xl pointer-events-none" />

          {/* 3D Color Lock Icon */}
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Icon3D name="lock" size={44} float={true} priority={true} />
          </div>

          <h2 className="text-2xl font-bold text-[#1E5AA8] dark:text-sky-300 tracking-tight">
            Kho Lưu trữ Cá nhân
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Nhập mã PIN cấp 2 để giải mã và truy cập thông tin bảo mật
          </p>

          {/* PIN Indicators Dots (Sunset Orange on Filled) */}
          <div className="flex items-center justify-center gap-3.5 mb-6">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pinInput.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-[#F58220] scale-125 shadow-md shadow-[#F58220]/40'
                      : 'bg-[#F5E6C8] dark:bg-slate-700 border border-[#F5E6C8] dark:border-slate-600'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message */}
          {pinError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold"
            >
              {pinError}
            </motion.div>
          )}

          {/* Numpad Keypad: Tactile 3D Glass buttons */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => {
                  if (pinInput.length < 6) {
                    setPinInput((prev) => prev + digit);
                  }
                }}
                className="h-14 sm:h-12 rounded-2xl bg-white/70 dark:bg-[#162746]/70 hover:bg-white dark:hover:bg-[#1e345e] backdrop-blur-md border border-white/80 dark:border-white/10 hover:border-[#1E5AA8]/40 dark:hover:border-sky-400/40 text-[#1E5AA8] dark:text-slate-100 font-bold text-lg active:scale-95 active:bg-[#F5E6C8]/60 transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] whitespace-nowrap shrink-0"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPinInput('')}
              className="h-14 sm:h-12 rounded-2xl bg-[#FAF3E3]/60 dark:bg-[#0B1528]/80 hover:bg-[#F5E6C8] dark:hover:bg-[#162746] border border-[#F5E6C8] dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#F58220] dark:hover:text-[#F58220] text-xs font-bold active:scale-95 transition-all flex items-center justify-center shadow-xs whitespace-nowrap shrink-0"
            >
              Xóa hết
            </button>
            <button
              type="button"
              onClick={() => {
                if (pinInput.length < 6) {
                  setPinInput((prev) => prev + '0');
                }
              }}
              className="h-14 sm:h-12 rounded-2xl bg-white/70 dark:bg-[#162746]/70 hover:bg-white dark:hover:bg-[#1e345e] backdrop-blur-md border border-white/80 dark:border-white/10 hover:border-[#1E5AA8]/40 dark:hover:border-sky-400/40 text-[#1E5AA8] dark:text-slate-100 font-bold text-lg active:scale-95 active:bg-[#F5E6C8]/60 transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] whitespace-nowrap shrink-0"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPinInput((prev) => prev.slice(0, -1))}
              className="h-14 sm:h-12 rounded-2xl bg-[#FAF3E3]/60 dark:bg-[#0B1528]/80 hover:bg-[#F5E6C8] dark:hover:bg-[#162746] border border-[#F5E6C8] dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#F58220] dark:hover:text-[#F58220] text-xs font-bold active:scale-95 transition-all flex items-center justify-center shadow-xs whitespace-nowrap shrink-0"
            >
              Xóa ký tự
            </button>
          </div>

          {/* Unlock Submit Button */}
          <button
            onClick={() => handleVerifyPin()}
            disabled={verifyingPin || pinInput.length < 4}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] disabled:opacity-40 text-white font-bold text-sm transition-all shadow-md shadow-[#F58220]/25 flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            {verifyingPin ? (
              <span>Đang xác thực...</span>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Mở khóa Kho bảo mật</span>
              </>
            )}
          </button>

          {/* Security Notice (Zero Leaks) */}
          <div className="mt-5 pt-4 border-t border-[#F5E6C8]/60 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1E5AA8] dark:text-sky-400" />
            <span>Mã hóa bảo mật cấp cao với xác thực hai lớp</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ==========================================
  // VIEW: UNLOCKED VAULT DASHBOARD
  // ==========================================
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

      {/* Top Header: Frosted Glass Panel */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs uppercase font-mono tracking-widest text-[#F58220] dark:text-amber-400 font-bold bg-[#F58220]/10 dark:bg-[#F58220]/20 border border-[#F58220]/20 dark:border-[#F58220]/40 px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
              Bảo mật 2 Lớp (PIN)
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E5AA8] shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
              AES-GCM Key Vault & Credentials
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <img
              src="/icons/3d/shield.png"
              alt="Shield"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md shrink-0"
            />
            <span className="min-w-0 break-words">Kho Lưu trữ Cá nhân</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Lưu trữ mật khẩu, khóa bí mật API, ghi chú nhạy cảm và thẻ ngân hàng với mã PIN bảo vệ 2 lớp
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-semibold shadow-md shadow-[#F58220]/20 active:scale-95 transition-all text-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm mục mới</span>
          </button>

          <button
            onClick={() => setIsChangePinOpen(true)}
            className="p-2.5 rounded-xl bg-[#FFFCF7]/90 dark:bg-[#111F38]/90 hover:bg-[#FAF3E3] dark:hover:bg-[#162746] text-[#1E5AA8] dark:text-slate-200 border border-[#F5E6C8] dark:border-slate-800 shadow-sm transition-colors whitespace-nowrap shrink-0"
            title="Đổi mã PIN cấp 2"
            aria-label="Đổi mã PIN bảo vệ"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleLockVault}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FAF3E3]/80 dark:bg-[#111F38]/90 hover:bg-[#F5E6C8] dark:hover:bg-[#162746] text-[#1E5AA8] dark:text-slate-200 border border-[#F5E6C8] dark:border-slate-800 shadow-sm text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            title="Khóa ngay lập tức"
            aria-label="Khóa kho bảo mật"
          >
            <Lock className="w-4 h-4" />
            <span>Khóa lại</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid: Frosted Glass Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <button
          onClick={() => {
            setSelectedCategory('all');
            setShowFavoritesOnly(false);
          }}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            selectedCategory === 'all' && !showFavoritesOnly
              ? 'border-[#1E5AA8] dark:border-sky-400 ring-2 ring-[#1E5AA8]/20 shadow-md'
              : 'hover:border-[#1E5AA8]/30 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Tất cả mục</div>
          <div className="text-xl font-bold text-[#1E5AA8] dark:text-sky-300 mt-1 flex items-baseline justify-between">
            {stats.total}
            <Key className="w-4 h-4 text-[#1E5AA8] dark:text-sky-400" />
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedCategory('credential');
            setShowFavoritesOnly(false);
          }}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            selectedCategory === 'credential'
              ? 'border-[#1E5AA8] dark:border-sky-400 ring-2 ring-[#1E5AA8]/20 shadow-md'
              : 'hover:border-[#1E5AA8]/30 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Mật khẩu</div>
          <div className="text-xl font-bold text-[#1E5AA8] dark:text-sky-300 mt-1 flex items-baseline justify-between">
            {stats.credentials}
            <Key className="w-4 h-4 text-[#1E5AA8] dark:text-sky-400" />
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedCategory('api_key');
            setShowFavoritesOnly(false);
          }}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            selectedCategory === 'api_key'
              ? 'border-[#F58220] ring-2 ring-[#F58220]/20 shadow-md'
              : 'hover:border-[#F58220]/30 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">API Keys</div>
          <div className="text-xl font-bold text-[#F58220] dark:text-amber-400 mt-1 flex items-baseline justify-between">
            {stats.apiKeys}
            <FileCode className="w-4 h-4 text-[#F58220]" />
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedCategory('secure_note');
            setShowFavoritesOnly(false);
          }}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            selectedCategory === 'secure_note'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'hover:border-emerald-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Ghi chú mật</div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-baseline justify-between">
            {stats.notes}
            <FileLock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </button>

        <button
          onClick={() => {
            setShowFavoritesOnly(true);
            setSelectedCategory('all');
          }}
          className={`glass-card p-4 rounded-2xl text-left transition-all ${
            showFavoritesOnly
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md'
              : 'hover:border-rose-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Yêu thích</div>
          <div className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1 flex items-baseline justify-between">
            {stats.favorites}
            <Star className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
        </button>
      </div>

      {/* Filter and Search Bar: Frosted Glass */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, tên tài khoản hoặc #thẻ..."
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
          <button
            onClick={() => {
              setSelectedCategory('all');
              setShowFavoritesOnly(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
              selectedCategory === 'all' && !showFavoritesOnly
                ? 'bg-[#1E5AA8] text-white shadow-sm shadow-[#1E5AA8]/25'
                : 'bg-[#FAF3E3]/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 border border-[#F5E6C8] dark:border-slate-700'
            }`}
          >
            Tất cả
          </button>
          {(Object.keys(CATEGORY_MAP) as VaultCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setShowFavoritesOnly(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                selectedCategory === cat && !showFavoritesOnly
                  ? 'bg-[#1E5AA8] text-white shadow-sm shadow-[#1E5AA8]/25 font-semibold'
                  : 'bg-[#FAF3E3]/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-[#F5E6C8] dark:hover:bg-slate-700 border border-[#F5E6C8] dark:border-slate-700'
              }`}
            >
              {CATEGORY_MAP[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl h-44 border border-white/60 dark:border-white/10 p-5 space-y-3 animate-pulse shadow-sm"
            >
              <div className="h-6 bg-slate-200/70 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 rounded-3xl border border-white/70 dark:border-white/10 text-center max-w-lg mx-auto my-12"
        >
          <img
            src="/icons/3d/lock.png"
            alt="Lock"
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
          />
          <h3 className="text-lg font-bold text-[#1E5AA8] dark:text-slate-100 mb-2">Kho bảo mật đang trống</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Lưu trữ mật khẩu dịch vụ, OpenAI/Anthropic API keys, tài khoản ngân hàng hoặc ghi chú bí mật tại đây.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] text-white font-semibold text-sm transition-all shadow-md shadow-[#F58220]/25 whitespace-nowrap shrink-0"
          >
            Thêm mục bí mật đầu tiên
          </button>
        </motion.div>
      )}

      {/* Filtered Empty State */}
      {!loading && items.length > 0 && filteredItems.length === 0 && (
        <div className="glass-card p-8 rounded-3xl border border-white/70 dark:border-white/10 text-center max-w-md mx-auto my-8">
          <p className="text-[#1E5AA8] dark:text-slate-100 font-bold">Không tìm thấy mục bảo mật nào</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hãy điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setShowFavoritesOnly(false);
              setSearchQuery('');
            }}
            className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-[#F5E6C8] dark:border-slate-800 hover:bg-[#F5E6C8]/60 whitespace-nowrap shrink-0"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Items Grid: Frosted Glass Cards */}
      {!loading && filteredItems.length > 0 && (
        <div className="max-h-[72vh] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <VaultItemCard
                  key={item.id}
                  item={item}
                  isVisible={Boolean(visibleSecrets[item.id])}
                  onToggleVisibility={(e) => toggleSecretVisibility(item.id, e)}
                  onCopy={(text, identifier, e) => handleCopy(text, identifier, e)}
                  isCopiedUsername={copiedId === `user-${item.id}`}
                  isCopiedSecret={copiedId === `secret-${item.id}`}
                  onEdit={() => handleOpenEdit(item)}
                  onDelete={(e) => handleDelete(item.id, e)}
                  onToggleFavorite={(e) => handleToggleFavorite(item, e)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Create / Edit Secret Item Modal: ResponsiveModal */}
      <ResponsiveModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingItem ? 'Chỉnh sửa mục bảo mật' : 'Thêm mục bí mật mới'}
        subtitle="Lưu trữ tài khoản, mật khẩu, API keys hoặc ghi chú mật"
        icon={
          <img
            src="/icons/3d/key.png"
            alt="Key"
            className="w-7 h-7 object-contain"
          />
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {/* Category & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phân loại bảo mật
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VaultCategory)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15"
              >
                {(Object.keys(CATEGORY_MAP) as VaultCategory[]).map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-[#0B1528] text-slate-900 dark:text-slate-100">
                    {CATEGORY_MAP[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tiêu đề <span className="text-[#F58220]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Google Account, OpenAI API Key..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15"
              />
            </div>
          </div>

          {/* Username / Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên đăng nhập / Email / Client ID
            </label>
            <input
              type="text"
              placeholder="email@example.com hoặc username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15"
            />
          </div>

          {/* Secret Value & Password Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mật khẩu / Khóa bí mật (Secret Value)
              </label>
              <button
                type="button"
                onClick={() => setSecretValue(generateStrongPassword(20))}
                className="text-xs text-[#1E5AA8] dark:text-sky-300 hover:text-[#F58220] dark:hover:text-[#F58220] flex items-center gap-1 font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Tạo mật khẩu mạnh
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="••••••••••••••••••••"
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15 pr-10"
              />
            </div>
          </div>

          {/* URL / Website */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trang web / Dịch vụ (URL)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi chú bảo mật bổ sung
            </label>
            <textarea
              rows={3}
              placeholder="Mã dự phòng (Backup codes), câu hỏi bảo mật, thông tin chi tiết..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15 resize-none"
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
                className="px-3.5 py-1.5 rounded-xl bg-[#FAF3E3] dark:bg-[#0B1528] hover:bg-[#F5E6C8]/70 dark:hover:bg-[#162746] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-[#F5E6C8] dark:border-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                Thêm
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1E5AA8]/10 dark:bg-[#1E5AA8]/20 border border-[#1E5AA8]/20 dark:border-[#1E5AA8]/40 text-[#1E5AA8] dark:text-sky-300 text-xs font-semibold whitespace-nowrap shrink-0"
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

          {/* Favorite Toggle */}
          <div className="pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="sr-only"
              />
              <Star
                className={`w-5 h-5 transition-colors ${
                  isFavorite ? 'text-[#F58220] fill-[#F58220]' : 'text-slate-300'
                }`}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Đánh dấu mục yêu thích (Thường xuyên sử dụng)
              </span>
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
              disabled={savingItem}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-[#F58220]/25 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {savingItem ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Lưu bí mật'}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Change PIN Modal: ResponsiveModal */}
      <ResponsiveModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        title="Đổi mã PIN bảo vệ Kho"
        subtitle="Mã PIN cấp 2 dùng để mở khóa các mục bảo mật"
        icon={
          <img
            src="/icons/3d/key.png"
            alt="Key"
            className="w-7 h-7 object-contain"
          />
        }
        maxWidth="md"
      >
        <form onSubmit={handleChangePin} className="space-y-4">
          {changePinError && (
            <div className="p-3 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {changePinError}
            </div>
          )}
          {changePinSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              {changePinSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã PIN hiện tại <span className="text-[#F58220]">*</span>
            </label>
            <input
              type="password"
              maxLength={6}
              required
              placeholder="Nhập mã PIN hiện tại..."
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-mono tracking-widest focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã PIN mới (4 - 6 số) <span className="text-[#F58220]">*</span>
            </label>
            <input
              type="password"
              maxLength={6}
              required
              placeholder="Nhập mã PIN mới..."
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-mono tracking-widest focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Xác nhận mã PIN mới <span className="text-[#F58220]">*</span>
            </label>
            <input
              type="password"
              maxLength={6}
              required
              placeholder="Nhập lại mã PIN mới..."
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-mono tracking-widest focus:bg-white dark:focus:bg-[#0B1528] focus:outline-none focus:border-[#1E5AA8] dark:focus:border-sky-400 focus:ring-2 focus:ring-[#1E5AA8]/15"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F5E6C8]/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsChangePinOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] text-xs font-medium whitespace-nowrap shrink-0"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={changingPin || !currentPin || !newPin || !confirmPin}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#E06D10] hover:from-[#E06D10] hover:to-[#C95B07] disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-[#F58220]/25 whitespace-nowrap shrink-0"
            >
              {changingPin ? 'Đang cập nhật...' : 'Cập nhật mã PIN'}
            </button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}

// Subcomponent: Individual Vault Item Card with Frosted Glass & Tilt
interface VaultItemCardProps {
  item: VaultItem;
  isVisible: boolean;
  onToggleVisibility: (e: React.MouseEvent) => void;
  onCopy: (text: string, identifier: string, e: React.MouseEvent) => void;
  isCopiedUsername: boolean;
  isCopiedSecret: boolean;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

function VaultItemCard({
  item,
  isVisible,
  onToggleVisibility,
  onCopy,
  isCopiedUsername,
  isCopiedSecret,
  onEdit,
  onDelete,
  onToggleFavorite,
}: VaultItemCardProps) {
  const catConfig = CATEGORY_MAP[item.category] || CATEGORY_MAP.credential;

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
        glowColor="sapphire"
        className="h-full flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 border border-white/70 dark:border-white/10"
        padding="p-5"
      >
        <div>
          {/* Top Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl border ${catConfig.color} group-hover:scale-105 transition-transform flex items-center justify-center shrink-0`}>
                <img
                  src={catConfig.icon3d}
                  alt={catConfig.label}
                  className="w-5 h-5 object-contain hover:scale-110 hover:-rotate-3 transition-transform duration-300 drop-shadow-sm"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate whitespace-nowrap">
                  {catConfig.label}
                </span>
                <h3 className="font-bold text-[#1E5AA8] dark:text-slate-100 text-sm sm:text-base leading-snug truncate group-hover:text-[#F58220] transition-colors min-w-0 break-words">
                  {item.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleFavorite}
              className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-[#F58220] transition-colors shrink-0"
              title={item.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
              aria-label={item.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            >
              <Star
                className={`w-4 h-4 ${
                  item.isFavorite ? 'text-[#F58220] fill-[#F58220]' : ''
                }`}
              />
            </button>
          </div>

          {/* Username / Account */}
          {item.username && (
            <div className="flex items-center justify-between text-xs bg-[#FAF3E3]/60 dark:bg-[#0B1528] rounded-xl px-3 py-2 mb-2 border border-[#F5E6C8] dark:border-slate-800">
              <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px] font-medium">{item.username}</span>
              <button
                type="button"
                onClick={(e) => onCopy(item.username, `user-${item.id}`, e)}
                className="text-slate-400 hover:text-[#1E5AA8] dark:hover:text-sky-300 transition-colors ml-2 shrink-0 p-1"
                title="Sao chép tên đăng nhập"
                aria-label="Sao chép tên đăng nhập"
              >
                {isCopiedUsername ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {/* Secret Value field: Masked by Default */}
          {item.secretValue && (
            <div className="flex items-center justify-between text-xs bg-[#FAF3E3]/60 dark:bg-[#0B1528] rounded-xl px-3 py-2 mb-2 border border-[#F5E6C8] dark:border-slate-800 font-mono">
              <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[190px]">
                {isVisible ? item.secretValue : '••••••••••••••••'}
              </span>
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <button
                  type="button"
                  onClick={onToggleVisibility}
                  className="text-slate-400 hover:text-[#1E5AA8] dark:hover:text-sky-300 transition-colors p-1"
                  title={isVisible ? 'Ẩn bí mật' : 'Hiển thị bí mật'}
                  aria-label={isVisible ? 'Ẩn bí mật' : 'Hiển thị bí mật'}
                >
                  {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => onCopy(item.secretValue, `secret-${item.id}`, e)}
                  className="text-slate-400 hover:text-[#1E5AA8] dark:hover:text-sky-300 transition-colors p-1"
                  title="Sao chép mật khẩu / bí mật"
                  aria-label="Sao chép bí mật"
                >
                  {isCopiedSecret ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Notes preview if no credentials */}
          {!item.username && !item.secretValue && item.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-2 font-mono bg-[#FAF3E3]/60 dark:bg-[#0B1528] border border-[#F5E6C8]/60 dark:border-slate-800 p-2.5 rounded-xl min-w-0 break-words">
              {item.notes}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2 pt-1">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-[#FAF3E3] dark:bg-[#0B1528] border border-[#F5E6C8] dark:border-slate-800 text-[#1E5AA8] dark:text-sky-300 text-[10px] font-semibold whitespace-nowrap shrink-0"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-[#F5E6C8]/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5 truncate max-w-[180px] min-w-0">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#1E5AA8] dark:text-sky-300 hover:text-[#F58220] hover:underline flex items-center gap-1 text-[11px] truncate font-medium"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{item.url.replace(/^https?:\/\//, '')}</span>
              </a>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E5AA8] dark:hover:text-sky-300 hover:bg-[#FAF3E3] dark:hover:bg-[#0B1528] transition-colors"
              title="Chỉnh sửa"
              aria-label="Chỉnh sửa mục bí mật"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Xóa mục bí mật"
              aria-label="Xóa mục bí mật"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
