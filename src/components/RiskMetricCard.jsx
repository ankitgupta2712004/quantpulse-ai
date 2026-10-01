import React from 'react';
import { Shield, AlertCircle, HelpCircle } from 'lucide-react';

const RiskMetricCard = ({
  title,
  value,
  formula,
  status = 'neutral', // 'safe' | 'moderate' | 'high' | 'neutral'
  interpretation,
  academicNote,
  isPending = false,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'safe':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'moderate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'high':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between border border-slate-800">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase ${getStatusBadge()}`}>
            {status}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <div className="text-3xl font-bold tracking-tight text-white font-mono">
            {value !== undefined && value !== null ? value : '--'}
          </div>
          {formula && (
            <span className="text-xs text-slate-500 font-mono" title="Mathematical definition">
              [{formula}]
            </span>
          )}
        </div>

        {interpretation && (
          <p className="text-xs text-slate-300 mt-2 font-normal leading-relaxed">
            {interpretation}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80">
        {academicNote ? (
          <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>{academicNote}</span>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 italic">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Calculated via Python SciPy/NumPy in Phase 3</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RiskMetricCard;
