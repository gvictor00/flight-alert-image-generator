import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ThemeProvider } from '@/components/common/ThemeProvider';

const montserrat = localFont({
  variable: '--font-montserrat',
  display: 'swap',
  src: [
    { path: '../../public/assets/fonts/Montserrat-Thin.ttf', weight: '100', style: 'normal' },
    { path: '../../public/assets/fonts/Montserrat-ExtraLight.ttf', weight: '200', style: 'normal' },
    { path: '../../public/assets/fonts/Montserrat-Light.ttf', weight: '300', style: 'normal' },
    { path: '../../public/assets/fonts/Montserrat-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/assets/fonts/Montserrat-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../public/assets/fonts/Montserrat-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../../public/assets/fonts/Montserrat-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../../public/assets/fonts/Montserrat-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: '../../public/assets/fonts/Montserrat-Black.ttf', weight: '900', style: 'normal' }
  ]
});

export const metadata: Metadata = {
  title: 'Flight Alert Image Generator',
  description: 'Internal platform to generate flight-alert images.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${montserrat.variable} min-h-screen font-sans`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
