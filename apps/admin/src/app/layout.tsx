import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '키오스크 관리자',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
