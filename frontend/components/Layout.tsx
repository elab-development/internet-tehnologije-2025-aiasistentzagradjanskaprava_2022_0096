
import React, { ReactNode } from 'react';

interface LayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ sidebar, children }) => {
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <aside className="hidden md:flex flex-col h-full shrink-0">
        {sidebar}
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
