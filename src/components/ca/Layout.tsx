import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { User } from '@/types';
import { Menu } from 'lucide-react';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar user={user} onLogout={onLogout} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm sticky top-0 z-10 md:hidden p-4 flex items-center justify-between">
            <div className="font-bold text-slate-800">CA Manager</div>
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-100">
              <Menu size={24} />
            </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
