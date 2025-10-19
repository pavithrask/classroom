import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
  </svg>
);

const SignOutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
    />
  </svg>
);

export const Layout: React.FC = () => {
  const { logout, userEmail } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-primary-light/20 ${
      isActive ? 'bg-primary/10 text-primary-dark' : 'text-slate-700'
    }`;

  return (
    <div className="flex min-h-screen">
      <aside className={`bg-white shadow-lg transition-all duration-200 md:w-64 ${menuOpen ? 'w-64' : 'w-0 md:w-64'}`}>
        <div className="hidden md:flex flex-col h-full">
          <div className="border-b px-4 py-6 text-lg font-semibold text-primary-dark">Classroom Manager</div>
          <nav className="flex-1 space-y-1 px-4 py-6">
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/classes" className={linkClass}>
              Classes
            </NavLink>
            <NavLink to="/students" className={linkClass}>
              Students
            </NavLink>
            <NavLink to="/attendance" className={linkClass}>
              Attendance
            </NavLink>
            <NavLink to="/assignments" className={linkClass}>
              Assignments
            </NavLink>
            <NavLink to="/birthdays" className={linkClass}>
              Birthdays
            </NavLink>
            <NavLink to="/settings" className={linkClass}>
              Settings
            </NavLink>
          </nav>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <SignOutIcon className="h-5 w-5" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow md:hidden">
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-primary hover:text-primary"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="text-sm font-medium text-slate-500">{userEmail}</div>
          <button onClick={logout} className="text-sm font-medium text-primary">
            Sign out
          </button>
        </header>
        <main className="flex-1 bg-slate-100 p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
