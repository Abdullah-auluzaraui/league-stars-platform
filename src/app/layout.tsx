import { El_Messiri, Outfit } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import './globals.css';
import { DesktopNav, MobileNav } from './components/Navigation';
import NavVisibilityWrapper from './components/NavVisibilityWrapper';

const elMessiri = El_Messiri({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-el-messiri',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  title: 'League Stars | منصة البطولات التفاعلية',
  description: 'تابع مباريات، ترتيب، وإحصائيات بطولة نجوم الدوري لكرة القدم بالوقت الفعلي.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${elMessiri.variable} ${outfit.variable} scroll-smooth`}
    >
      <body className="bg-[#0e0e12] text-[#F3EED9] min-h-screen antialiased selection:bg-[#C9971A]/30 selection:text-[#F3EED9] overflow-x-hidden">
        
        {/* الحاوية الرئيسية */}
        <div className="relative min-h-screen w-full flex flex-col">
          
          {/* تأثير التوهج العلوي */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-glow-radial pointer-events-none z-0" />

          {/* الهيدر — كبسولة عائمة فخمة ثابتة */}
          <NavVisibilityWrapper>
            <header
              className="fixed top-0 md:top-4 left-0 right-0 z-50 w-full md:max-w-2xl md:mx-auto transition-all duration-300 md:rounded-2xl"
              style={{
                background: 'rgba(12, 12, 18, 0.85)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(201, 151, 26, 0.12)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="max-w-2xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
                
                {/* الشعار */}
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 overflow-hidden rounded-lg flex-shrink-0 transition-all duration-500 group-hover:scale-110">
                    <Image
                      src="/شعار البطولة.png"
                      alt="شعار البطولة"
                      fill
                      sizes="36px"
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-black tracking-tight text-white group-hover:text-[#F0C040] transition-colors duration-300 leading-tight"
                      style={{ textShadow: '0 0 20px rgba(201,151,26,0.15)' }}>
                      League Stars
                    </span>
                    <span className="text-[9px] font-bold tracking-[0.12em] font-outfit hidden sm:block"
                      style={{ color: 'rgba(201,151,26,0.55)' }}>
                      بطولة نجوم الدوري
                    </span>
                  </div>
                </Link>

                {/* ناف desktop */}
                <DesktopNav />

              </div>
            </header>
          </NavVisibilityWrapper>

          {/* محتوى الصفحة مع إزاحة علوية لمنع التداخل مع الهيدر الثابت */}
          <main className="flex-grow relative z-10 w-full mx-auto px-4 sm:px-6 pt-20 md:pt-28 pb-8 md:pb-10 box-border">
            {children}
          </main>

          <NavVisibilityWrapper>
            {/* شريط التنقل السفلي — Mobile only */}
            <MobileNav />

            {/* الفوتر */}
            <footer
              className="w-full pt-8 pb-24 md:pb-8 mt-auto relative z-10"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.04)',
                background: 'rgba(10,10,14,0.7)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="max-w-2xl mx-auto px-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="relative w-7 h-7">
                    <Image
                      src="/شعار البطولة.png"
                      alt="League Stars"
                      fill
                      sizes="28px"
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm font-black text-white">League Stars</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-[11px] text-white/20 font-semibold mb-3">
                  <Link href="/" className="hover:text-white/50 transition-colors">الرئيسية</Link>
                  <span className="text-white/10">·</span>
                  <Link href="/matches" className="hover:text-white/50 transition-colors">المباريات</Link>
                  <span className="text-white/10">·</span>
                  <Link href="/standings" className="hover:text-white/50 transition-colors">المنافسات</Link>
                  <span className="text-white/10">·</span>
                  <Link href="/votes" className="hover:text-white/50 transition-colors">هدف الجولة</Link>
                </div>
                <p className="text-[10px] text-white/12 font-semibold">
                  © {new Date().getFullYear()} League Stars — المملكة العربية السعودية
                </p>
              </div>
            </footer>
          </NavVisibilityWrapper>
          
        </div>
      </body>
    </html>
  );
}
