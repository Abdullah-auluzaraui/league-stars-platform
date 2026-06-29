import { redirect } from 'next/navigation';
import { getTokenFromCookies, verifyToken } from '@/core/lib/auth';
import AdminClient from './AdminClient';

export const metadata = {
  title: 'لوحة التحكم | League Stars',
  description: 'لوحة تحكم مشرفي بطولة نجوم الدوري.',
};

export default async function AdminPage() {
  // التحقق من الصلاحيات — إذا لم يكن مسجلاً يُعاد توجيهه لتسجيل الدخول
  const token = await getTokenFromCookies();
  if (!token) redirect('/admin-login');

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') redirect('/admin-login');

  return <AdminClient username={payload.username} />;
}
