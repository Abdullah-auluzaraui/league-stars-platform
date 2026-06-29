import { redirect } from 'next/navigation';
import { getTokenFromCookies, verifyToken } from '@/core/lib/auth';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'تسجيل الدخول للمشرف | League Stars',
  description: 'تسجيل الدخول الآمن للوحة تحكم مشرفي بطولة نجوم الدوري.',
};

export default async function AdminLoginPage() {
  // التحقق مما إذا كان المستخدم مسجلاً دخوله بالفعل كمشرف
  const token = await getTokenFromCookies();
  if (token) {
    const payload = await verifyToken(token);
    if (payload && payload.role === 'admin') {
      redirect('/admin');
    }
  }

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-4 py-8 sm:py-12 md:py-16">
      <LoginForm />
    </div>
  );
}
