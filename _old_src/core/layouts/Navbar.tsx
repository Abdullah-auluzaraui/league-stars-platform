'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/core/providers/auth-provider';
import { useEditMode } from '@/core/providers/edit-mode-provider';
import { logout } from '@/features/auth/actions';

export default function Navbar() {
  const { isAdmin, user, isLoading } = useAuth();
  const { isEditMode, toggleEditMode } = useEditMode();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

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
              {/* أدوات المشرف للشاشات الكبيرة */}
              <div className="admin-desktop-actions">
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
                <form action={logout} style={{ display: 'inline' }}>
                  <button
                    id="logout-btn"
                    type="submit"
                    className="logout-btn"
                    title={`تسجيل خروج: ${user?.username}`}
                  >
                    خروج
                  </button>
                </form>
              </div>

              {/* أدوات المشرف للجوال — قائمة منسدلة مصغرة */}
              <div className="admin-mobile-menu">
                <button
                  id="admin-menu-toggle"
                  className="admin-menu-toggle-btn"
                  onClick={() => setAdminMenuOpen((v) => !v)}
                  aria-expanded={adminMenuOpen}
                  aria-label="خيارات المشرف"
                >
                  ⚙️
                </button>

                {adminMenuOpen && (
                  <div className="admin-dropdown-menu">
                    <div className="admin-dropdown-user">
                      👤 {user?.username}
                    </div>
                    <button
                      onClick={() => {
                        toggleEditMode();
                        setAdminMenuOpen(false);
                      }}
                      className={`admin-dropdown-item ${isEditMode ? 'active' : ''}`}
                    >
                      <span>{isEditMode ? '✏️ إيقاف التعديل' : '🔒 تفعيل التعديل'}</span>
                    </button>
                    <form action={logout} onSubmit={() => setAdminMenuOpen(false)}>
                      <button type="submit" className="admin-dropdown-item logout">
                        🚪 تسجيل الخروج
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
