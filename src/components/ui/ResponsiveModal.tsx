'use client';

import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const MAX_WIDTH_MAP = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
};

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'lg',
  className = '',
}: ResponsiveModalProps) {
  const titleId = useId();
  const subtitleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
    >
      {/* Frosted Glass Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Surface: Bottom sheet on mobile (<640px), centered dialog on desktop (>=640px) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full ${MAX_WIDTH_MAP[maxWidth]} max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FFFCF7]/90 dark:bg-[#111F38]/90 backdrop-blur-xl saturate-160 border border-white/75 dark:border-white/10 shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden ${className}`}
      >
        {/* Mobile Drag-Pill Indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <span className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#1E5AA8]/12 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            {icon && <div className="shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h2
                id={titleId}
                className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate"
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  id={subtitleId}
                  className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5"
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-[#F5E6C8]/40 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Custom Scrollbar & Safe-Area Padding */}
        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
