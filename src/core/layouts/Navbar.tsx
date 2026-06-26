'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/core/providers/auth-provider';
import { useEditMode } from '@/core/providers/edit-mode-provider';
import { logout } from '@/features/auth/actions';

export default function Navbar() {
  const { isAdmin, user, isLoading } = useAuth();
  const { isEditMode, toggleEditMode } = useEditMode();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* ── الشعار ── */}
        <Link href="/" className="navbar-logo">
          <span className="logo-icon">⚽</span>
          <span className="logo-text">نجوم الدوري</span>
        </Link>

        {/* ── الروابط — شاشات كبيرة ── */}
        <nav className="navbar-links" aria-label="التنقل الرئيسي">
          <Link href="/" className="nav-link">الرئيسية</Link>
          <Link href="/matches" className="nav-link">المباريات</Link>
          <Link href="/scorers" className="nav-link">الهدافون</Link>
          <Link href="/vote" className="nav-link">هدف الجولة</Link>
        </nav>

        {/* ── أدوات المشرف ── */}
        <div className="navbar-actions">
          {!isLoading && isAdmin && (
            <>
              {/* مفتاح وضع التعديل */}
              <button
                id="edit-mode-toggle"
                onClick={toggleEditMode}
                className={`edit-toggle-btn ${isEditMode ? 'active' : ''}`}
                title={isEditMode ? 'إيقاف وضع التعديل' : 'تفعيل وضع التعديل'}
                aria-pressed={isEditMode}
              >
                <span className="edit-icon">{isEditMode ? '✏️' : '🔒'}</span>
                <span className="edit-label">
                  {isEditMode ? 'وضع التعديل' : 'تعديل'}
                </span>
              </button>

              {/* تسجيل الخروج */}
              <form action={logout}>
                <button
                  id="logout-btn"
                  type="submit"
                  className="logout-btn"
                  title={`تسجيل خروج: ${user?.username}`}
                >
                  خروج
                </button>
              </form>
            </>
          )}

          {/* زر القائمة — جوال */}
          <button
            id="mobile-menu-btn"
            className="mobile-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="القائمة"
          >
            <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── قائمة الجوال ── */}
      {menuOpen && (
        <nav className="mobile-nav" aria-label="التنقل الجوال">
          <Link href="/" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>الرئيسية</Link>
          <Link href="/matches" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>المباريات</Link>
          <Link href="/scorers" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>الهدافون</Link>
          <Link href="/vote" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>هدف الجولة</Link>
        </nav>
      )}
    </header>
  );
}
