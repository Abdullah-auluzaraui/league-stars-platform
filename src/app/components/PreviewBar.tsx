'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Eye, ArrowLeft, X } from 'lucide-react';

export default function PreviewBar() {
  const [isPreview, setIsPreview] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check search params first
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === 'true') {
      sessionStorage.setItem('admin_preview', 'true');
      setIsPreview(true);
      // Remove query parameter from URL cleanly to keep address bar neat
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
      return;
    }

    // Otherwise check sessionStorage
    if (sessionStorage.getItem('admin_preview') === 'true') {
      setIsPreview(true);
    }
  }, []);

  const handleExitPreview = () => {
    sessionStorage.removeItem('admin_preview');
    setIsPreview(false);
  };

  const handleReturnToAdmin = () => {
    window.location.href = '/admin';
  };

  if (pathname.startsWith('/admin') || pathname.startsWith('/admin-login')) {
    return null;
  }

  if (!isPreview) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 z-[9999] w-[calc(100%-2rem)] sm:w-auto max-w-md animate-fade-in-up">
      <div 
        className="glass-card flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border shadow-2xl"
        style={{
          background: 'rgba(201,151,26,0.12)',
          borderColor: 'rgba(201,151,26,0.35)',
          backdropFilter: 'blur(16px)',
        }}
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#C9971A]/20 flex items-center justify-center">
            <Eye className="w-3.5 h-3.5 text-[#F0C040] animate-pulse" />
          </div>
          <span className="text-xs font-black text-white">وضع معاينة المشرف</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReturnToAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9971A] hover:bg-[#F0C040] text-black font-black text-[10px] sm:text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <span>لوحة التحكم</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handleExitPreview}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="إنهاء المعاينة"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
