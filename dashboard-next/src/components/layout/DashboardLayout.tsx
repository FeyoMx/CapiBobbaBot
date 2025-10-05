'use client';

import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        <div className="container mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
