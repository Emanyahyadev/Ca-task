import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, UserCircle, Briefcase, HelpCircle, LogOut, LucideIcon, Receipt } from 'lucide-react';
import { User } from '@/types';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen, setIsOpen }) => {
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isAdminOrManager = isAdmin || isManager;

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) => (
    <NavLink
      to={to}
      onClick={() => window.innerWidth < 768 && setIsOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-30 h-full w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Briefcase size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">CA Task Manager</h1>
            <p className="text-xs text-slate-400">Task Management System</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />

          {isAdminOrManager && <NavItem to="/clients" icon={Users} label="Clients" />}

          <NavItem to="/tasks" icon={CheckSquare} label={isAdminOrManager ? "All Tasks" : "My Tasks"} />

          {isAdminOrManager && <NavItem to="/employees" icon={UserCircle} label="Employees" />}

          {isAdminOrManager && <NavItem to="/invoices" icon={Receipt} label="Invoices & Payments" />}

          <NavItem to="/help" icon={HelpCircle} label="Help & Support" />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
