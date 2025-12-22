'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
   const [open, setOpen] = useState(false);
   const dropdownRef = useRef<HTMLDivElement>(null);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = currentLocale === 'zh' ? '中文' : 'English';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="px-3 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all bg-white border border-divider text-text-primary shadow-sm hover:shadow-md flex items-center gap-1.5 md:gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span aria-hidden className="text-sm md:text-base">🌐</span>
        <span>{label}</span>
        <span className="text-xs text-text-secondary">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-divider bg-white shadow-md z-50 py-2">
          {['zh', 'en'].map((lng) => {
            const isActive = lng === currentLocale;
            const text = lng === 'zh' ? '中文' : 'English';
            return (
              <button
                key={lng}
                onClick={() => {
                  setOpen(false);
                  switchLocale(lng);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-text-secondary hover:bg-gray-50'
                }`}
                role="option"
                aria-selected={isActive}
              >
                {text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

