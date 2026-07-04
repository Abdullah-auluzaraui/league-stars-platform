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
    <nav className="hidden md:flex items-center gap-1.5">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 border ${
              isActive
                ? 'text-[#F0C040] bg-[#C9971A]/12 border-[#C9971A]/30 shadow-[0_0_12px_rgba(201,151,26,0.12)]'
                : 'text-white/45 hover:text-white border-transparent hover:bg-white/[0.04]'
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
      className="md:hidden fixed left-3 right-3 z-50 rounded-[28px] px-1.5 py-1.5 shadow-[0_20px_55px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]"
      style={{
        bottom: 'calc(12px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(135deg, rgba(21,22,25,0.66), rgba(7,8,13,0.74))',
        backdropFilter: 'blur(28px) saturate(1.45)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.45)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-8 -top-px h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }}
      />
      <nav className="relative grid grid-cols-4 items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const { Icon } = item;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[22px] px-1.5 py-2 transition-all duration-300 ${
                isActive
                  ? 'text-[#F3EED9] bg-white/[0.075] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09),0_8px_22px_rgba(0,0,0,0.18)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.045]'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-2xl transition-all duration-300 ${
                  isActive ? 'bg-white/[0.065]' : 'bg-transparent'
                }`}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={isActive ? 2.5 : 2.1} />
              </span>
              <span className="max-w-full truncate text-[9.5px] font-black leading-none tracking-normal">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
