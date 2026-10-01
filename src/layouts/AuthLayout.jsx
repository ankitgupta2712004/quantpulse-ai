import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Activity, Shield } from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Activity className="w-6 h-6 text-slate-950" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            {APP_NAME}
          </span>
        </Link>
        <p className="text-xs text-slate-400 font-medium">
          AI-Driven Portfolio Management &amp; Risk Analytics
        </p>
      </div>

      {/* Main Auth Form Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="glass-card py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl">
          <Outlet />
        </div>

        {/* Academic Note Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>B.Tech CSE (AI &amp; ML) Academic Security Architecture</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
