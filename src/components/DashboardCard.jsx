import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

const DashboardCard = ({
  title,
  value,
  change,
  changeType = 'neutral', // 'positive' | 'negative' | 'neutral'
  changeLabel,
  icon: Icon,
  iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  description,
  badge,
  isLoading = false,
  isPendingConnection = false,
}) => {
  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 bg-slate-800 rounded w-24"></div>
          <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
        </div>
        <div className="h-8 bg-slate-800 rounded w-36 mb-2"></div>
        <div className="h-3 bg-slate-800 rounded w-28"></div>
      </div>
    );
  }

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden group">
      {/* Subtle top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700 to-transparent group-hover:via-emerald-500/50 transition-all duration-300" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${iconColor} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
          {value !== undefined && value !== null ? value : '--'}
        </div>
        {badge && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>

      {/* Change / Trend or Pending Status */}
      <div className="flex items-center gap-1.5 text-xs">
        {change !== undefined ? (
          <>
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                changeType === 'positive'
                  ? 'text-emerald-400'
                  : changeType === 'negative'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {changeType === 'positive' && <TrendingUp className="w-3.5 h-3.5" />}
              {changeType === 'negative' && <TrendingDown className="w-3.5 h-3.5" />}
              {changeType === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              {change}
            </span>
            {changeLabel && <span className="text-slate-500 font-normal">{changeLabel}</span>}
          </>
        ) : isPendingConnection ? (
          <span className="inline-flex items-center gap-1 text-slate-500 italic">
            <Info className="w-3 h-3" /> Connects in Phase 2 backend
          </span>
        ) : description ? (
          <span className="text-slate-400">{description}</span>
        ) : null}
      </div>
    </div>
  );
};

export default DashboardCard;
