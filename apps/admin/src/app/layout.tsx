import type { Metadata } from 'next';
import './globals.css';

import WebSocketProvider from '@/components/WebSocketProvider';
import ToastContainer from '@/components/ToastContainer';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';

export const metadata: Metadata = {
  title: {
    default: 'Kiosk Admin',
    template: '%s | Kiosk Admin',
  },
  description: 'Manage orders, menu, and screensaver settings for your restaurant kiosk',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50">
        <WebSocketProvider />
        <ToastContainer />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <MobileHeader />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
