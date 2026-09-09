'use client';

import { useActionState, useState, useTransition } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { login, demoLogin } from './actions';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isDemoPending, startDemoTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(login, null);

  const handleDemoLogin = () => {
    setDemoError(null);
    startDemoTransition(async () => {
      const res = await demoLogin();
      if (res?.error) {
        setDemoError(res.error);
      }
    });
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* تأثير التوهج الخلفي الفخم (Burgundy & Gold Glow) */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#5C131F]/20 rounded-full blur-3xl pointer-events-none -z-10 animate-glow-soft" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#C9971A]/10 rounded-full blur-3xl pointer-events-none -z-10 animate-glow-soft" />

      {/* حاوية الكرت الزجاجي الفخم */}
      <div 
        className="w-full px-6 py-8 sm:px-8 sm:py-10 rounded-3xl border border-[#C9971A]/15 bg-gradient-to-b from-[#14141c]/90 to-[#0e0e12]/95 backdrop-blur-xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)] animate-scale-in"
        style={{
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* رأس النموذج والترويسة */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5C131F] to-[#3D0C15] border border-[#C9971A]/20 mb-4 shadow-lg shadow-black/40">
            <span className="text-[#F0C040] font-black text-xl tracking-wider">LS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight">
            بوابة المشرفين
          </h2>
          <p className="text-xs sm:text-sm text-white/50 font-medium">
            سجل الدخول لإدارة بطولة نجوم الدوري
          </p>
        </div>

        {/* تنبيه الخطأ العام */}
        {(state?.error || demoError) && (
          <div 
            className="mb-6 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-center gap-2.5 animate-fade-in"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">{state?.error || demoError}</span>
          </div>
        )}

        {/* نموذج تسجيل الدخول */}
        <form action={formAction} className="space-y-4">
          {/* حقل اسم المستخدم */}
          <div className="space-y-1.5">
            <label 
              htmlFor="username" 
              className="block text-xs font-bold text-white/70 mr-1"
            >
              اسم المستخدم
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/30">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                disabled={isPending || isDemoPending}
                placeholder="أدخل اسم المستخدم"
                autoComplete="username"
                className="w-full pr-11 pl-4 py-3 bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-[#F0C040]/50 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-[#F0C040]/30 transition-all duration-300 disabled:opacity-50"
              />
            </div>
          </div>

          {/* حقل كلمة المرور */}
          <div className="space-y-1.5">
            <label 
              htmlFor="password" 
              className="block text-xs font-bold text-white/70 mr-1"
            >
              كلمة المرور
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/30">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isPending || isDemoPending}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pr-11 pl-11 py-3 bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-[#F0C040]/50 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-[#F0C040]/30 transition-all duration-300 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending || isDemoPending}
                className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/50 hover:text-[#F0C040] transition-colors duration-300 disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* زر تسجيل الدخول */}
          <button
            type="submit"
            disabled={isPending || isDemoPending}
            className="w-full mt-2 py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-[#C9971A] to-[#F0C040] hover:from-[#F0C040] hover:to-[#C9971A] focus:outline-none focus:ring-2 focus:ring-[#F0C040]/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C9971A]/10 hover:shadow-[#C9971A]/20 text-sm sm:text-base"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 text-black animate-spin" />
                <span>جاري التحقق والأمان...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>دخول لوحة التحكم</span>
              </>
            )}
          </button>
        </form>

        {/* زر الدخول السريع في وضع الديمو */}
        {process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' && (
          <div className="mt-5 pt-5 border-t border-white/10">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isPending || isDemoPending}
              className="w-full py-3 rounded-xl font-bold text-[#F0C040] bg-[#C9971A]/10 hover:bg-[#C9971A]/20 border border-[#C9971A]/35 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md"
            >
              {isDemoPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#F0C040]" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#F0C040]" />
              )}
              <span>دخول تجريبي فوري بنقرة واحدة (Demo Admin)</span>
            </button>
            <p className="text-[11px] text-white/50 text-center mt-2.5">
              بيانات الدخول: المستخدم <code className="text-[#F0C040] font-mono bg-white/5 px-1.5 py-0.5 rounded">admin</code> | كلمة المرور <code className="text-[#F0C040] font-mono bg-white/5 px-1.5 py-0.5 rounded">Admin@2026</code>
            </p>
          </div>
        )}

        {/* إرشادات الأمان والخصوصية أسفل النموذج */}
        <div className="mt-5 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/40 leading-normal font-sans">
            هذه المنطقة مخصصة لمشرفي النظام. يتم التحقق عبر جلسات آمنة مشفرة (JWT).
          </p>
        </div>
      </div>
    </div>
  );
}
