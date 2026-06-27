'use client';

import { useState, useEffect } from 'react';

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // محاولة جلب البصمة المخزنة مسبقاً
    let fp = localStorage.getItem('ls_browser_fp');

    if (!fp) {
      // توليد بصمة فريدة تجمع خصائص المتصفح وجزءاً عشوائياً
      const userAgent = navigator.userAgent;
      const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
      const language = navigator.language || 'ar';
      const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // دمج الخصائص وتوليد معرف بسيط فريد بطول مناسب (> 10 محارف)
      const rawFp = `${userAgent}|${screenInfo}|${language}|${randomPart}`;
      
      // ترميز بسيط بسلسلة Base64 لتنظيف المعرّف
      try {
        fp = btoa(unescape(encodeURIComponent(rawFp)))
          .replace(/[^a-zA-Z0-9]/g, '') // إزالة المحارف غير المرغوبة
          .substring(0, 32); // تحديد الطول بـ 32 محرفاً
      } catch {
        fp = `fp_${Date.now()}_${randomPart.substring(0, 16)}`;
      }

      localStorage.setItem('ls_browser_fp', fp);
    }

    setFingerprint(fp);
  }, []);

  return fingerprint;
}
