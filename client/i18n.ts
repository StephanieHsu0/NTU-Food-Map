import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

// 修改這裡：參數改用 { requestLocale }
export default getRequestConfig(async ({ requestLocale }) => {
  // 1. 必須使用 await 獲取 locale
  let locale = await requestLocale;

  // 2. 驗證 locale 是否有效
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    // 3. (重要) 新版規定必須在這裡回傳 locale
    locale,
    messages: (await import(`./lib/i18n/${locale}.json`)).default
  };
});