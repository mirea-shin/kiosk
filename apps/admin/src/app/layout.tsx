import type { Metadata } from 'next';
import './globals.css';

import Message from '@/components/Message';

export const metadata: Metadata = {
  title: '키오스크 관리자',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Message />
        {children}
      </body>
    </html>
  );
}
