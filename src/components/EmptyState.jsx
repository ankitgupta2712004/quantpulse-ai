import React from 'react';
import { Database, Plus, ArrowRight } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Database,
  title = "Data will appear after connecting market data",
  description = "No active portfolio records or real-time ticker stream detected. Add your first asset or connect backend service in Phase 2.",
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="glass-card rounded-2xl p-10 md:p-14 text-center flex flex-col items-center justify-center border border-dashed border-slate-800">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8 opacity-80" />
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2 max-w-md">
        {title}
      </h3>
      
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionText && (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {actionText}
            </button>
          )}

          {secondaryActionText && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all border border-slate-700"
            >
              {secondaryActionText}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
