'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function useAdminPreview() {
  const [isPreview, setIsPreview] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  const evaluateState = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 1. فحص معيار الرابط ?preview=true
    const params = new URLSearchParams(window.location.search);
    const hasUrlPreview = params.get('preview') === 'true';

    // 2. فحص الكوكيز (كوكيز المعاينة وكوكيز المشرف)
    const cookies = document.cookie || '';
    const hasPreviewCookie = cookies.split('; ').some((c) => c.startsWith('admin_preview=true'));
    const hasAdminToken = cookies.split('; ').some((c) => c.startsWith('adminToken='));

    // 3. فحص sessionStorage
    let hasSessionPreview = false;
    try {
      hasSessionPreview = sessionStorage.getItem('admin_preview') === 'true';
    } catch {
      // تجاهل أخطاء التخزين في الأوضاع الصارمة
    }

    const inPreview = hasUrlPreview || hasPreviewCookie || hasSessionPreview;

    if (hasUrlPreview) {
      // تثبيت الكوكيز وتخزين الجلسة فوراً
      try {
        sessionStorage.setItem('admin_preview', 'true');
      } catch {}
      document.cookie = 'admin_preview=true; path=/; max-age=86400; SameSite=Lax';

      // تنظيف الرابط للحفاظ على شريط العنوان أنيقاً وبدون إعادة تحميل الصفحة
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }

    setIsPreview(inPreview);
    setIsAdminAuth(hasAdminToken);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    evaluateState();

    const handleCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent<{ isPreview?: boolean }>;
      if (typeof customEvt.detail?.isPreview === 'boolean') {
        setIsPreview(customEvt.detail.isPreview);
      } else {
        evaluateState();
      }
    };

    window.addEventListener('admin_preview_change', handleCustomEvent);
    window.addEventListener('storage', evaluateState);

    return () => {
      window.removeEventListener('admin_preview_change', handleCustomEvent);
      window.removeEventListener('storage', evaluateState);
    };
  }, [evaluateState, pathname]);

  const enterPreview = useCallback(() => {
    try {
      sessionStorage.setItem('admin_preview', 'true');
    } catch {}
    document.cookie = 'admin_preview=true; path=/; max-age=86400; SameSite=Lax';
    setIsPreview(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('admin_preview_change', { detail: { isPreview: true } })
      );
    }
  }, []);

  const exitPreview = useCallback(() => {
    try {
      sessionStorage.removeItem('admin_preview');
    } catch {}
    document.cookie = 'admin_preview=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    setIsPreview(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('admin_preview_change', { detail: { isPreview: false } })
      );
    }
  }, []);

  return {
    isPreview,
    isAdminAuth,
    isMounted,
    enterPreview,
    exitPreview,
  };
}
