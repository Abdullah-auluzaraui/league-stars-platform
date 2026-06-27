import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/core/providers/auth-provider';
import { EditModeProvider } from '@/core/providers/edit-mode-provider';
import { ThemeProvider } from '@/core/providers/theme-provider';
import Navbar from '@/core/layouts/Navbar';
import BottomNav from '@/core/layouts/BottomNav';
import Footer from '@/core/layouts/Footer';
import { prisma } from '@/core/lib/prisma';

export const metadata: Metadata = {
  title: 'نجوم الدوري — تابع مباريات بطولتك المفضلة',
  description:
    'موقع متكامل لمتابعة نتائج وترتيب وأهداف البطولات الكروية المحلية بالوقت الفعلي. صوّت لأفضل هدف وتابع قائمة الهدافين.',
  keywords: ['كرة القدم', 'بطولة', 'نتائج', 'ترتيب', 'هدافين', 'دوري'],
  openGraph: {
    title: 'نجوم الدوري',
    description: 'تابع مباريات بطولتك المفضلة',
    locale: 'ar_SA',
    type: 'website',
  },
};

// ─── جلب الألوان من قاعدة البيانات (Server Component) ────────────────────────
async function getThemeColors() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['color_primary', 'color_accent', 'color_background'] } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return {
      primary: map['color_primary'] || '#750722',
      accent: map['color_accent'] || '#C92142',
      background: map['color_background'] || '#f8f9fa',
    };
  } catch {
    // في حالة تعذّر الاتصال بقاعدة البيانات تُستخدم الألوان الافتراضية
    return {
      primary: '#750722',
      accent: '#C92142',
      background: '#f8f9fa',
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeColors = await getThemeColors();

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider initialColors={themeColors}>
          <AuthProvider>
            <EditModeProvider>
              <div className="page-wrapper">
                <Navbar />
                <main className="page-content">
                  {children}
                </main>
                <BottomNav />
                <Footer />
              </div>
            </EditModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
