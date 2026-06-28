'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, BarChart2, ThumbsUp } from 'lucide-react';

export function DesktopNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'الرئيسية' },
    { href: '/matches', label: 'المباريات' },
    { href: '/standings', label: 'المنافسات' },
    { href: '/votes', label: 'هدف الجولة' },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 ${
              isActive
                ? 'text-white bg-white/10 border border-white/10'
                : 'text-white/45 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'الرئيسية', Icon: Home },
    { href: '/matches', label: 'المباريات', Icon: Calendar },
    { href: '/standings', label: 'المنافسات', Icon: BarChart2 },
    { href: '/votes', label: 'هدف الجولة', Icon: ThumbsUp },
  ];

  return (
    <div
      className="md:hidden fixed bottom-4 left-4 right-4 z-50 rounded-2xl shadow-2xl px-2 py-1.5"
      style={{
        background: 'rgba(16,16,22,0.95)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <nav className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const { Icon } = item;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-xl transition-all duration-300 flex-1 ${
                isActive
                  ? 'bg-white/[0.06] text-[#F3EED9]'
                  : 'text-white/35 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
