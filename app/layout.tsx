import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CppEditor – C++ Online Compiler',
  description: 'Biên dịch C++20 trực tuyến. 3 pane có thể resize. Share link bằng fflate compression.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} bg-bg-base text-gray-100 antialiased overflow-hidden`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#181828',
              border: '1px solid #2a2a42',
              color: '#dde1f0',
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
