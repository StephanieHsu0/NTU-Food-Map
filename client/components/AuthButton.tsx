'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userImage, setUserImage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch user image from API to avoid storing in session token (prevents HTTP 431)
  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.image) {
            setUserImage(data.image);
          }
        })
        .catch(() => {
          // Silently fail - will show initial instead
        });
    } else {
      setUserImage(null);
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-text-secondary rounded-lg md:rounded-xl border border-divider text-xs md:text-sm">
        {t('auth.loading')}
      </div>
    );
  }

  if (session?.user) {
    const initial =
      session.user.name?.charAt(0).toUpperCase() ||
      session.user.email?.charAt(0).toUpperCase() ||
      '?';

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="px-3 py-1.5 md:w-9 md:h-9 md:px-0 md:py-0 rounded-lg md:rounded-full border border-divider bg-white shadow-sm hover:shadow-md flex items-center justify-center overflow-hidden transition-all gap-1.5 md:gap-0"
        >
          {userImage ? (
            <Image
              src={userImage}
              alt={session.user.name || 'User'}
              width={36}
              height={36}
              className="rounded-full object-cover w-5 h-5 md:w-9 md:h-9 flex-shrink-0"
            />
          ) : (
            <span className="text-xs md:text-sm font-semibold text-text-primary flex-shrink-0">{initial}</span>
          )}
          <span className="md:hidden text-xs text-text-primary font-medium truncate max-w-[80px]">
            {session.user.name?.split(' ')[0] || session.user.name || t('auth.signedIn')}
          </span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-divider bg-white shadow-md z-50">
            <div className="px-4 py-3 min-w-0">
              <p className="text-sm font-semibold text-text-primary break-words overflow-wrap-anywhere">
                {session.user.name || t('auth.signedIn')}
              </p>
              {session.user.email && (
                <p className="text-xs text-text-secondary mt-1 break-words overflow-wrap-anywhere">
                  {session.user.email}
                </p>
              )}
            </div>
            <div className="h-px bg-divider" />
            <button
              onClick={() => {
                setOpen(false);
                router.push(`/${locale}/profile`);
              }}
              className="w-full text-left px-4 py-3 text-sm text-text-primary hover:bg-gray-50 transition-colors"
            >
              {t('profile.title')}
            </button>
            <div className="h-px bg-divider" />
            <button
              onClick={async () => {
                setOpen(false);
                await signOut({ redirect: false });
                window.location.reload();
              }}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 transition-colors"
            >
              {t('auth.signOut')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        router.push(`/${locale}/auth/signin`);
      }}
      className="px-3 py-1.5 md:px-4 md:py-2 bg-primary-600 text-white rounded-lg md:rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm hover:shadow-md text-xs md:text-sm"
    >
      {t('auth.signIn')}
    </button>
  );
}

