import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block">
                {APP_NAME}
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold block -mt-1">
                Portfolio &amp; Risk AI
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">
              Platform Demo
            </Link>
            <Link to="/stocks" className="hover:text-emerald-400 transition-colors">
              Stock Analytics
            </Link>
            <Link to="/risk" className="hover:text-emerald-400 transition-colors">
              Risk Engine
            </Link>
            <Link to="/optimization" className="hover:text-emerald-400 transition-colors">
              Portfolio Optimization
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              Launch App
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Academic Decision Support System &bull; 3rd Year B.Tech CSE (AI &amp; ML)</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} {APP_NAME}. Built with React, Vite &amp; Tailwind CSS.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
