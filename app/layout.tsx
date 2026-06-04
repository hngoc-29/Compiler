import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'CppEditor – C++ Online Compiler',
  description: 'Biên dịch C++20 trực tuyến. 3 pane có thể resize. Share link bằng fflate compression.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-base text-gray-100 antialiased overflow-hidden">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#181828',
              border: '1px solid #2a2a42',
              color: '#dde1f0',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
