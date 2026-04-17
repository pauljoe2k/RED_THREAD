import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

export const metadata: Metadata = {
  title: 'RedThread — Connect the Dots',
  description:
    'RedThread is a conspiracy board app. Create nodes of information and draw typed red threads between them.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100 min-h-screen">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </main>
      </body>
    </html>
  );
}
