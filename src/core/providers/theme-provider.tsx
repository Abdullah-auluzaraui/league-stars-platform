'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

// ─── أنواع البيانات ───────────────────────────────────────────────────────────
interface ThemeColors {
  primary: string;
  accent: string;
  background: string;
}

interface ThemeContextValue {
  colors: ThemeColors;
}

const DEFAULT_COLORS: ThemeColors = {
  primary: '#750722',
  accent: '#C92142',
  background: '#f8f9fa',
};

// ─── السياق ───────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue>({
  colors: DEFAULT_COLORS,
});

// ─── تحويل HEX إلى HSL لمتغيرات CSS ─────────────────────────────────────────
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 50%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ─── تطبيق الألوان على CSS Variables ─────────────────────────────────────────
function applyColors(colors: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-hsl', hexToHsl(colors.primary));
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-hsl', hexToHsl(colors.accent));
  root.style.setProperty('--background', colors.background);
}

// ─── المزود ───────────────────────────────────────────────────────────────────
interface ThemeProviderProps {
  children: ReactNode;
  /**
   * الألوان المحملة من قاعدة البيانات عبر Server Component.
   * إذا لم تُمرر تُستخدم القيم الافتراضية.
   */
  initialColors?: Partial<ThemeColors>;
}

export function ThemeProvider({ children, initialColors }: ThemeProviderProps) {
  const colors: ThemeColors = {
    ...DEFAULT_COLORS,
    ...initialColors,
  };

  const appliedRef = useRef(false);

  useEffect(() => {
    if (!appliedRef.current) {
      applyColors(colors);
      appliedRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider value={{ colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook للاستخدام السهل ────────────────────────────────────────────────────
export function useTheme() {
  return useContext(ThemeContext);
}
