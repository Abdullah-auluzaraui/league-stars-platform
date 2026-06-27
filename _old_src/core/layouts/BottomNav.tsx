'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav-container" aria-label="التنقل السفلي للجوال">
      <Link href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
        <span className="bottom-nav-icon">🏠</span>
        <span>الرئيسية</span>
      </Link>
      <Link href="/matches" className={`bottom-nav-item ${pathname === '/matches' ? 'active' : ''}`}>
        <span className="bottom-nav-icon">📅</span>
        <span>المباريات</span>
      </Link>
      <Link href="/scorers" className={`bottom-nav-item ${pathname === '/scorers' ? 'active' : ''}`}>
        <span className="bottom-nav-icon">📊</span>
        <span>الترتيب</span>
      </Link>
      <Link href="/vote" className={`bottom-nav-item ${pathname === '/vote' ? 'active' : ''}`}>
        <span className="bottom-nav-icon">🗳️</span>
        <span>التصويت</span>
      </Link>
    </nav>
  );
}
