import Link from 'next/link';
import { prisma } from '@/core/lib/prisma';

// ─── جلب الرعاة من قاعدة البيانات (Server Component) ─────────────────────────
async function getActiveSponsors() {
  try {
    return await prisma.sponsor.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      take: 6,
    });
  } catch {
    return [];
  }
}

export default async function Footer() {
  const sponsors = await getActiveSponsors();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* ── شريط الرعاة ── */}
      {sponsors.length > 0 && (
        <div className="sponsors-bar">
          <p className="sponsors-label">رعاة البطولة</p>
          <div className="sponsors-logos">
            {sponsors.map((sponsor) => (
              sponsor.websiteUrl ? (
                <a
                  key={sponsor.id}
                  href={sponsor.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sponsor-item"
                  title={sponsor.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="sponsor-logo"
                    loading="lazy"
                  />
                </a>
              ) : (
                <span key={sponsor.id} className="sponsor-item" title={sponsor.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="sponsor-logo"
                    loading="lazy"
                  />
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* ── الجزء السفلي ── */}
      <div className="footer-bottom">
        <div className="footer-inner">
          {/* الشعار + الوصف */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              ⚽ نجوم الدوري
            </Link>
            <p className="footer-desc">
              منصة متكاملة لمتابعة نتائج وترتيب وأهداف البطولات الكروية المحلية
            </p>
          </div>

          {/* روابط سريعة */}
          <nav className="footer-links" aria-label="روابط الموقع">
            <h3 className="footer-links-title">الصفحات</h3>
            <Link href="/" className="footer-link">الرئيسية</Link>
            <Link href="/matches" className="footer-link">المباريات والترتيب</Link>
            <Link href="/scorers" className="footer-link">قائمة الهدافين</Link>
            <Link href="/vote" className="footer-link">هدف الجولة</Link>
          </nav>
        </div>

        {/* حقوق النشر */}
        <div className="footer-copyright">
          <p>© {year} نجوم الدوري — جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}
