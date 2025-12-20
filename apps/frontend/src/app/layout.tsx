import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stackly - Kanban Board & Schedule Management',
  description: 'High performance scheduling engine designed to turn project chaos into visual clarity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

