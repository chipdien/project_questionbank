import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import LayoutWrapper from '../components/layout/LayoutWrapper'
import MathJaxProvider from '../components/MathJaxProvider'

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
        <Script
          id="mathjax-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                  processEscapes: true,
                  packages: {'[+]': ['base', 'ams', 'noerrors', 'noundefined']}
                },
                options: {
                  ignoreHtmlClass: 'tex2jax_ignore',
                  processHtmlClass: 'tex2jax_process'
                },
                svg: {
                  fontCache: 'local',
                  displayAlign: 'center',
                  displayIndent: '0px'
                },
                startup: {
                  typeset: false,
                  ready: () => {
                    MathJax.startup.defaultReady();
                  }
                }
              };
            `,
          }}
        />
        <Script
          id="mathjax-script"
          strategy="beforeInteractive"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
        />
        <MathJaxProvider />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  )
}
