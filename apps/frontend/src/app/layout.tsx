import { cookies } from 'next/headers'
import './globals.css'

const fallbackLocale = 'en'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = cookies().get('NEXT_LOCALE')?.value ?? fallbackLocale

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  )
}



