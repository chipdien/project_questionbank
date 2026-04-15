import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import 'katex/dist/katex.min.css'
import 'katex/dist/katex.min.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: 'VietElite Dashboard',
  description: 'Trích xuất văn bản từ tài liệu PDF (kể cả scanned) và Word nhanh chóng.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${manrope.variable} bg-background font-body text-on-background antialiased overflow-hidden`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

