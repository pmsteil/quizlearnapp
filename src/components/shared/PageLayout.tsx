import { ReactNode } from 'react';
import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
