import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { Providers } from '@/providers';
import { locales } from '@/i18n/config';

export const metadata: Metadata = {
  title: 'Stackly - Kanban Board & Schedule Management',
  description: 'High performance scheduling engine designed to turn project chaos into visual clarity',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    redirect('/en');
  }

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
