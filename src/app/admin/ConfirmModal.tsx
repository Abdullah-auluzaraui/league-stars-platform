'use client';

import { X, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'warning',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bg: 'bg-red-500/10 border-red-500/20 text-red-400',
      btn: 'bg-gradient-to-l from-red-600 to-red-800 hover:shadow-red-950/20',
      iconColor: 'text-red-400',
    },
    warning: {
      bg: 'bg-[#C9971A]/10 border-[#C9971A]/20 text-[#F0C040]',
      btn: 'bg-gradient-to-l from-[#C9971A] to-[#A07510] hover:shadow-[#C9971A]/10',
      iconColor: 'text-[#F0C040]',
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      btn: 'bg-gradient-to-l from-emerald-600 to-emerald-800 hover:shadow-emerald-950/20',
      iconColor: 'text-emerald-400',
    },
  }[variant];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      {/* نافذة التأكيد */}
      <div
        className="w-full max-w-sm bg-[#0e0e12] border border-white/8 rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        dir="rtl"
      >
        {/* الترويسة */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#121018]">
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-4.5 h-4.5 ${variantStyles.iconColor}`} />
            <span className="text-xs font-black text-white">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* جسم التأكيد */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-white/70 font-semibold leading-relaxed">
            {message}
          </p>

          {/* أزرار التحكم */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white bg-white/3 border border-white/6 rounded-xl hover:bg-white/6 active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md active:scale-95 transition-all cursor-pointer ${variantStyles.btn}`}
              type="button"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
