import type { Metadata } from 'next';
import './globals.css';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        {children}
      </body>
    </html>
  );
}
