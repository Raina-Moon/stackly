import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from '../src/i18n/config';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locales.includes(locale as (typeof locales)[number])
    ? locale
    : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`../src/messages/${resolvedLocale}.json`)).default,
  };
});
