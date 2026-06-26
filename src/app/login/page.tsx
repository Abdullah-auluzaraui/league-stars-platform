import LoginForm from '@/features/auth/components/LoginForm';

export const metadata = {
  title: 'تسجيل الدخول — نجوم الدوري',
  description: 'لوحة تحكم المشرف لموقع نجوم الدوري الكروي.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black relative overflow-hidden px-4 py-12">
      {/* شبكة خلفية رياضية خفيفة */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* تأثيرات الإضاءة البصرية الفخمة خلف الصفحة */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[140px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* نموذج تسجيل الدخول */}
      <LoginForm />
    </div>
  );
}
