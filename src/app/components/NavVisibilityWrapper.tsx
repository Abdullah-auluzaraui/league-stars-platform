'use client';

import { usePathname } from 'next/navigation';

export default function NavVisibilityWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/admin-login');

  if (isAdminPage) return null;

  return <>{children}</>;
}
