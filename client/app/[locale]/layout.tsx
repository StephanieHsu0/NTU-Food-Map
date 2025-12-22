import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import UsageInstructions from '@/components/UsageInstructions';
import AuthButton from '@/components/AuthButton';
import Providers from '@/components/Providers';
import Link from 'next/link';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <div className="min-h-screen bg-background">
          <header className="bg-white shadow-sm border-b border-divider">
            <div className="px-3 sm:px-6 lg:px-8 py-3 md:py-4 flex justify-between items-center gap-2 md:gap-4 w-full">
              <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1">
                <Link href={`/${locale}`} className="text-lg md:text-2xl font-bold text-text-primary hover:text-primary-600 transition-colors truncate">
                  NTU Food Map
                </Link>
                
              </div>
              <div className="ml-auto flex items-center gap-2 md:gap-4 flex-shrink-0">
                <UsageInstructions />
                <AuthButton />
                <LanguageSwitcher currentLocale={locale} />
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}

