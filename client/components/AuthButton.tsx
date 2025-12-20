'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md">
        {t('auth.loading')}
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <span className="text-sm text-gray-700">{session.user.name}</span>
        <button
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          {t('auth.signOut')}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        router.push(`/${locale}/auth/signin`);
      }}
      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
    >
      {t('auth.signIn')}
    </button>
  );
}

