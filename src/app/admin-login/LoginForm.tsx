'use client';

import { useActionState, useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { login } from './actions';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(login, null);

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

        {/* عرض أخطاء التحقق وسيرفر أكشن */}
        {state?.error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-xs sm:text-sm flex items-start gap-3 animate-pulse">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <span className="leading-relaxed">{state.error}</span>
          </div>
        )}

        {/* نموذج تسجيل الدخول */}
        <form action={formAction} className="space-y-5">
          {/* حقل اسم المستخدم */}
          <div className="space-y-2">
            <label 
              htmlFor="username" 
              className="block text-xs sm:text-sm font-semibold text-white/80 pr-1"
            >
              اسم المستخدم
            </label>
            <div className="relative group">
              <input
                id="username"
                name="username"
                type="text"
                required
                disabled={isPending}
                placeholder="أدخل اسم المستخدم الخاص بك"
                className="w-full px-4 py-3.5 pr-11 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/20 focus:outline-none focus:border-[#C9971A] focus:ring-2 focus:ring-[#C9971A]/10 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none text-right text-sm"
                dir="rtl"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-[#F0C040] transition-colors duration-300">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* حقل كلمة المرور */}
          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className="block text-xs sm:text-sm font-semibold text-white/80 pr-1"
            >
              كلمة المرور
            </label>
            <div className="relative group">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isPending}
                placeholder="أدخل كلمة المرور السرية"
                className="w-full px-4 py-3.5 pr-11 pl-12 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/20 focus:outline-none focus:border-[#C9971A] focus:ring-2 focus:ring-[#C9971A]/10 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none text-right text-sm"
                dir="rtl"
              />
              {/* أيقونة القفل اليمنى */}
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-[#F0C040] transition-colors duration-300">
                <Lock className="w-5 h-5" />
              </div>
              {/* زر كشف كلمة المرور الأيسر */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
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
            disabled={isPending}
            className="w-full mt-2 py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-[#C9971A] to-[#F0C040] hover:from-[#F0C040] hover:to-[#C9971A] focus:outline-none focus:ring-2 focus:ring-[#F0C040]/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C9971A]/10 hover:shadow-[#C9971A]/20 text-sm sm:text-base"
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z"
                  />
                </svg>
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

        {/* إرشادات الأمان والخصوصية أسفل النموذج */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/50 leading-normal font-sans">
            هذه المنطقة مخصصة لمشرفي النظام فقط. يتم تسجيل جميع محاولات الدخول وعناوين الـ IP لأغراض الحماية والأمان.
          </p>
        </div>
      </div>
    </div>
  );
}
