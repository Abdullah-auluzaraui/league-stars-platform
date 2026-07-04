import { El_Messiri, Outfit } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { prisma } from '@/core/lib/prisma';

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.54a29 29 0 0 0 .46 5.12 2.78 2.78 0 0 0 1.95 1.96C5.12 19 12 19 12 19s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 11.54a29 29 0 0 0-.46-5.12z" />
    <polygon points="9.75 15.02 15.5 11.54 9.75 8.05 9.75 15.02" />
  </svg>
);

const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);
import './globals.css';
import { DesktopNav, MobileNav } from './components/Navigation';
import NavVisibilityWrapper from './components/NavVisibilityWrapper';
import PreviewBar from './components/PreviewBar';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let twitterUrl = '';
  let instagramUrl = '';
  let youtubeUrl = '';
  let tiktokUrl = '';

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['social_twitter', 'social_instagram', 'social_youtube', 'social_tiktok'],
        },
      },
    });

    settings.forEach((s) => {
      if (s.key === 'social_twitter') twitterUrl = s.value;
      if (s.key === 'social_instagram') instagramUrl = s.value;
      if (s.key === 'social_youtube') youtubeUrl = s.value;
      if (s.key === 'social_tiktok') tiktokUrl = s.value;
    });
  } catch (err) {
    console.error('Error fetching social links in layout:', err);
  }

  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${elMessiri.variable} ${outfit.variable} scroll-smooth`}
    >
      <body className="bg-[#0e0e12] text-[#F3EED9] min-h-screen antialiased selection:bg-[#C9971A]/30 selection:text-[#F3EED9] overflow-x-hidden">
        
        {/* شريط معاينة المشرف */}
        <PreviewBar />

        {/* الحاوية الرئيسية */}
        <div className="relative min-h-screen w-full flex flex-col">
          
          {/* الهيدر — كبسولة عائمة فخمة ثابتة */}
          <NavVisibilityWrapper>
            <header
              className="fixed top-0 md:top-4 left-0 right-0 z-50 w-full md:max-w-5xl md:mx-auto transition-all duration-300 md:rounded-2xl"
              style={{
                background: 'rgba(12, 12, 18, 0.85)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(201, 151, 26, 0.12)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between">
                
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
          <main className="flex-grow relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-8 md:pb-10 box-border">
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
              <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
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
                <div className="flex items-center justify-center gap-4 text-[11px] text-white/40 font-semibold mb-3">
                  <Link href="/" className="hover:text-white/70 transition-colors">الرئيسية</Link>
                  <span className="text-white/25">·</span>
                  <Link href="/matches" className="hover:text-white/70 transition-colors">المباريات</Link>
                  <span className="text-white/25">·</span>
                  <Link href="/standings" className="hover:text-white/70 transition-colors">المنافسات</Link>
                  <span className="text-white/25">·</span>
                  <Link href="/votes" className="hover:text-white/70 transition-colors">هدف الجولة</Link>
                </div>
                {(twitterUrl || instagramUrl || youtubeUrl || tiktokUrl) && (
                  <div className="flex items-center justify-center gap-4 mb-4 mt-1">
                    {twitterUrl && (
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-white transition-colors"
                        title="تويتر / X"
                      >
                        <TwitterIcon className="w-4.5 h-4.5" />
                      </a>
                    )}
                    {instagramUrl && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-pink-400 transition-colors"
                        title="انستقرام"
                      >
                        <InstagramIcon className="w-4.5 h-4.5" />
                      </a>
                    )}
                    {youtubeUrl && (
                      <a
                        href={youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-red-500 transition-colors"
                        title="يوتيوب"
                      >
                        <YoutubeIcon className="w-4.5 h-4.5" />
                      </a>
                    )}
                    {tiktokUrl && (
                      <a
                        href={tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-cyan-400 transition-colors"
                        title="تيك توك"
                      >
                        <TiktokIcon className="w-4.5 h-4.5" />
                      </a>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-white/25 font-semibold">
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
