'use client';

import { usePathname } from 'next/navigation';
import { Eye, ArrowLeft, X } from 'lucide-react';
import { useAdminPreview } from './useAdminPreview';

export default function PreviewBar() {
  const pathname = usePathname();
  const { isPreview, isMounted, exitPreview } = useAdminPreview();

  if (!isMounted) return null;

  // إخفاء الشريط في صفحات المشرف
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/admin-login')) {
    return null;
  }

  // إذا لم يكن في وضع المعاينة لا يظهر شيئاً
  if (!isPreview) return null;

  const handleReturnToAdmin = () => {
    window.location.href = '/admin';
  };

  return (
    <aside
      aria-label="شريط معاينة المشرف"
      className="fixed bottom-24 sm:bottom-26 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 md:left-auto md:right-6 z-[9999] max-w-md mx-auto sm:mx-0 animate-fade-in-up"
    >
      <div 
        className="glass-card flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border shadow-2xl backdrop-blur-2xl"
        style={{
          background: 'rgba(16, 12, 6, 0.96)',
          borderColor: 'rgba(201, 151, 26, 0.55)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(201, 151, 26, 0.25)',
        }}
        dir="rtl"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#C9971A]/20 border border-[#C9971A]/40 flex items-center justify-center shrink-0">
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F0C040] animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-black text-white block truncate leading-tight">
              وضع معاينة المشرف
            </span>
            <span className="text-[9.5px] sm:text-[10.5px] text-[#F0C040]/80 font-bold block truncate leading-tight mt-0.5">
              تصفح حي للواجهة العامة
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleReturnToAdmin}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#C9971A] to-[#F0C040] hover:brightness-110 text-black font-black text-[10px] sm:text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <span>لوحة التحكم</span>
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          
          <button
            onClick={exitPreview}
            className="p-1 sm:p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="إنهاء وضع المعاينة"
            aria-label="إنهاء وضع المعاينة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
