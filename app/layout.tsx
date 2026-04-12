import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flight Alert Image Generator',
  description: 'Internal platform to generate flight-alert images.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
