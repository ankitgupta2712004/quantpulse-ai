import React from 'react';
import { Info } from 'lucide-react';

const ChartCard = ({
  title,
  subtitle,
  children,
  headerAction,
  filters,
  activeFilter,
  onFilterChange,
  isEmpty = false,
  emptyMessage = "Data will appear after connecting market data.",
  className = "",
}) => {
  return (
    <div className={`glass-card rounded-2xl p-6 flex flex-col ${className}`}>
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {filters && filters.length > 0 && (
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => onFilterChange && onFilterChange(filter)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeFilter === filter
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}

          {headerAction}
        </div>
      </div>

      {/* Chart Body */}
      <div className="w-full flex-1 min-h-[260px] flex items-center justify-center">
        {isEmpty ? (
          <div className="text-center py-10 px-4">
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-center text-slate-400">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">{emptyMessage}</p>
            <p className="text-xs text-slate-500">Live charts will render upon feeding ticker history in Phase 2/3.</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
