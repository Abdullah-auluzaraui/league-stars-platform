'use client';

import { useState, useEffect, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, ShieldCheck, X, Loader2 } from 'lucide-react';
import { demoLogin } from '@/app/admin-login/actions';
import { useAdminPreview } from './useAdminPreview';

export default function DemoBanner() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { isPreview, isAdminAuth, isMounted } = useAdminPreview();

  useEffect(() => {
    // التحقق مما إذا تم تصغير الشريط في هذه الجلسة
    const wasCollapsed = sessionStorage.getItem('demo_banner_collapsed') === 'true';
    if (wasCollapsed) {
      setCollapsed(true);
    }
  }, []);

  // إخفاء تام في مسارات المشرف، أو في وضع معاينة المشرف، أو إذا كان مسجلاً كمسؤول بالفعل
  if (
    !isMounted ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/admin-login') ||
    isPreview ||
    isAdminAuth ||
    process.env.NEXT_PUBLIC_DEMO_MODE !== 'true'
  ) {
    return null;
  }

  const handleCollapse = () => {
    sessionStorage.setItem('demo_banner_collapsed', 'true');
    setCollapsed(true);
  };

  const handleExpand = () => {
    sessionStorage.removeItem('demo_banner_collapsed');
    setCollapsed(false);
  };

  const handleDemoLogin = () => {
    startTransition(async () => {
      await demoLogin();
    });
  };

  // الحالة المصغرة (شارة أنيقة غير متداخلة إطلاقاً)
  if (collapsed) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-3 md:left-6 z-40 animate-fade-in">
        <button
          onClick={handleExpand}
          className="glass-card flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer text-[11px] font-bold text-[#F0C040]"
          style={{
            background: 'rgba(18, 14, 8, 0.92)',
            borderColor: 'rgba(201, 151, 26, 0.45)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(201,151,26,0.2)',
          }}
          title="عرض خيارات نسخة العرض (Demo)"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F0C040] animate-pulse" />
          <span>نسخة العرض (Demo)</span>
        </button>
      </div>
    );
  }

  // الحالة العادية (كرت فخم ومضغوط)
  return (
    <aside
      aria-label="إشعار نسخة العرض التجريبية"
      className="fixed bottom-20 md:bottom-6 left-3 md:left-6 right-3 md:right-auto z-40 md:max-w-md animate-fade-in-up"
    >
      <div
        className="glass-card flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(18, 14, 8, 0.94)',
          borderColor: 'rgba(201, 151, 26, 0.45)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65), 0 0 24px rgba(201, 151, 26, 0.15)',
        }}
        dir="rtl"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-[#C9971A]/20 border border-[#C9971A]/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#F0C040] animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">نسخة عرض تجريبية</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/30">
                Portfolio Demo
              </span>
            </div>
            <p className="text-[10.5px] text-white/60 truncate mt-0.5">
              نظام إدارة بطولات تفاعلي متكامل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleDemoLogin}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#C9971A] to-[#F0C040] hover:brightness-110 text-black font-black text-[11px] rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>لوحة التحكم</span>
          </button>

          <button
            onClick={handleCollapse}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="تصغير الشريط"
            aria-label="تصغير الشريط"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// مكون زر الديمو في الهيدر (اختياري للوصول السريع بدون حجب الواجهة)
export function HeaderDemoButton() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { isPreview, isAdminAuth, isMounted } = useAdminPreview();

  // إخفاء تام في مسارات المشرف، أو في وضع معاينة المشرف، أو إذا كان مسجلاً كمسؤول بالفعل
  if (
    !isMounted ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/admin-login') ||
    isPreview ||
    isAdminAuth ||
    process.env.NEXT_PUBLIC_DEMO_MODE !== 'true'
  ) {
    return null;
  }

  const handleDemoLogin = () => {
    startTransition(async () => {
      await demoLogin();
    });
  };

  return (
    <button
      onClick={handleDemoLogin}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
      style={{
        background: 'rgba(201, 151, 26, 0.12)',
        borderColor: 'rgba(201, 151, 26, 0.35)',
        color: '#F0C040',
      }}
      title="تجربة الدخول كمسؤول بنقرة واحدة"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3 text-[#F0C040]" />
      )}
      <span className="hidden sm:inline">دخول المشرف (Demo)</span>
      <span className="sm:hidden">Demo</span>
    </button>
  );
}
