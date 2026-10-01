import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  ShieldAlert,
  Sliders,
  Newspaper,
  Brain,
  Settings,
  X,
  Sparkles,
  Activity,
} from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const navIcons = {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  ShieldAlert,
  Sliders,
  Newspaper,
  Brain,
  Settings,
};

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Portfolio', path: '/portfolio', icon: Briefcase },
  { name: 'Stock Analysis', path: '/stocks', icon: TrendingUp },
  { name: 'Risk Analysis', path: '/risk', icon: ShieldAlert },
  { name: 'Optimization', path: '/optimization', icon: Sliders },
  { name: 'News Sentiment', path: '/sentiment', icon: Newspaper },
  { name: 'AI Insights', path: '/ai-insights', icon: Brain, isAi: true },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block">
                {APP_NAME}
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold block -mt-1">
                B.Tech AI&ML System
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            System Modules
          </div>

          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>

                {item.isAi && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Phase / System Footer Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
              <span>Project Phase 1</span>
              <span className="text-emerald-400 text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Frontend UI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Modular UI Foundation prepared for Node/FastAPI integration.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
