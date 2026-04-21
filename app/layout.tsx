import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

const montserrat = localFont({
  variable: '--font-montserrat',
  display: 'swap',
  src: [
    { path: '../public/assets/fonts/Montserrat-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/assets/fonts/Montserrat-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../public/assets/fonts/Montserrat-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../public/assets/fonts/Montserrat-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../public/assets/fonts/Montserrat-ExtraBold.ttf', weight: '800', style: 'normal' }
  ]
});

export const metadata: Metadata = {
  title: 'Flight Alert Image Generator',
  description: 'Internal platform to generate flight-alert images.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} min-h-screen font-sans`}>{children}</body>
    </html>
  );
}
