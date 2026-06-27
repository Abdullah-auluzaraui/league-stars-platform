import { El_Messiri, Outfit } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { Home, Calendar, Trophy } from 'lucide-react';
import './globals.css';

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
  title: 'نجوم الدوري | منصة البطولات التفاعلية',
  description: 'تابع مباريات، ترتيب، وإحصائيات بطولة نجوم الدوري لكرة القدم.',
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
      <body className="bg-[#1b1b1f] text-[#f4f4f5] min-h-screen antialiased selection:bg-gold/40 selection:text-cream overflow-x-hidden">
        {/* Wrapper to contain all elements and absolutely prevent any horizontal overflow */}
        <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
          
          {/* Glow Effects (Contained inside the overflow-hidden wrapper) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-glow-radial pointer-events-none z-0" />
          <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-glow-emerald pointer-events-none z-0" />

          {/* Header / Navbar (Sleek, compact, and elegant) */}
          <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
              {/* Logo and Brand (Compact again) */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 overflow-hidden rounded-xl bg-white/5 p-1 border border-white/10 transition-all duration-500 group-hover:border-cream/40 group-hover:shadow-[0_0_20px_rgba(255, 255, 255, 0.15)]">
                  <Image
                    src="/شعار البطولة.png"
                    alt="شعار البطولة"
                    fill
                    sizes="(max-width: 768px) 40px, 48px"
                    className="object-contain p-1 transition-transform duration-500 group-hover:scale-110"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wide text-white group-hover:text-cream transition-colors duration-300">
                    نجوم الدوري
                  </span>
                  <span className="text-[9px] sm:text-xs text-cream/70 font-semibold tracking-wider font-outfit">
                    TOURNAMENT STARS
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation (Sleek and clean text sizes) */}
              <nav className="hidden md:flex items-center gap-3 lg:gap-6">
                <Link
                  href="/"
                  className="px-4 py-2 text-sm sm:text-base font-semibold text-cream hover:text-white rounded-full bg-white/5 border border-cream/15 transition-all duration-300"
                >
                  الرئيسية
                </Link>
                <Link
                  href="/matches"
                  className="px-4 py-2 text-sm sm:text-base font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300"
                >
                  المباريات
                </Link>
                <Link
                  href="/standings"
                  className="px-4 py-2 text-sm sm:text-base font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300"
                >
                  الترتيب والفرق
                </Link>
              </nav>

              {/* Action Button (Desktop - Compact & Premium) */}
              <div className="hidden md:block">
                <Link
                  href="/matches"
                  className="btn-gold px-6 py-2.5 text-sm sm:text-base flex items-center gap-2 font-bold"
                >
                  <Calendar className="w-4.5 h-4.5" />
                  جدول المباريات
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content Container (More padding for breathing room) */}
          <main className="flex-grow relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-16 pb-36 md:pb-16 box-border">
            {children}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <div className="md:hidden fixed bottom-6 left-8 right-8 z-50 rounded-2xl glass-panel border border-white/8 shadow-2xl backdrop-blur-xl px-4 py-2.5">
            <nav className="flex justify-around items-center">
              <Link
                href="/"
                className="flex flex-col items-center justify-center gap-1 py-1 px-4 text-cream transition-all duration-300"
              >
                <Home className="w-5.5 h-5.5" />
                <span className="text-[11px] font-bold">الرئيسية</span>
              </Link>
              <Link
                href="/matches"
                className="flex flex-col items-center justify-center gap-1 py-1 px-4 text-gray-400 hover:text-white transition-all duration-300"
              >
                <Calendar className="w-5.5 h-5.5" />
                <span className="text-[11px] font-bold">المباريات</span>
              </Link>
              <Link
                href="/standings"
                className="flex flex-col items-center justify-center gap-1 py-1 px-4 text-gray-400 hover:text-white transition-all duration-300"
              >
                <Trophy className="w-5.5 h-5.5" />
                <span className="text-[11px] font-bold">الترتيب والفرق</span>
              </Link>
            </nav>
          </div>

          {/* Footer */}
          <footer className="w-full border-t border-white/5 bg-black/40 backdrop-blur-md py-8 mt-auto relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-right">
                {/* Brand Description */}
                <div className="flex flex-col items-center md:items-start gap-3">
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white/5 border border-white/15">
                      <Image
                        src="/شعار البطولة.png"
                        alt="شعار البطولة"
                        fill
                        sizes="32px"
                        className="object-contain p-1"
                      />
                    </div>
                    <span className="font-bold text-white text-base">نجوم الدوري</span>
                  </div>
                  <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                    المنصة التفاعلية الرسمية لمتابعة أقوى بطولات كرة القدم المحلية، رصد حي للنتائج، وجدول ترتيب تفاعلي ومساحة تصويت تفاعلية للجماهير.
                  </p>
                </div>

                {/* Quick Links (Hidden on Mobile) */}
                <div className="hidden md:flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                  <Link href="/" className="hover:text-cream transition-colors duration-300">
                    الرئيسية
                  </Link>
                  <Link href="/matches" className="hover:text-cream transition-colors duration-300">
                    المباريات
                  </Link>
                  <Link href="/standings" className="hover:text-cream transition-colors duration-300">
                    الترتيب والفرق
                  </Link>
                </div>

                {/* Copyright / Info */}
                <div className="flex flex-col items-center md:items-end gap-1 text-sm text-gray-400">
                  <span>© {new Date().getFullYear()} نجوم الدوري. جميع الحقوق محفوظة.</span>
                  <span className="text-xs text-cream/70 font-semibold tracking-wide">
                    المملكة العربية السعودية
                  </span>
                </div>
              </div>
            </div>
          </footer>
          
        </div>
      </body>
    </html>
  );
}
