import React from 'react';
import { TrendingUp, TrendingDown, Plus, ExternalLink } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const StockCard = ({
  symbol,
  companyName,
  price,
  change,
  changePercent,
  sector,
  onAddHolding,
  onViewDetails,
}) => {
  const isPositive = changePercent >= 0;

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-wide">{symbol}</span>
              {sector && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                  {sector}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[160px] mt-0.5">{companyName}</p>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold text-white font-mono">
              {price !== undefined ? formatCurrency(price) : '--'}
            </div>
            {changePercent !== undefined ? (
              <div
                className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatPercentage(changePercent)}
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 italic">Phase 2 Feed</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-2">
        <button
          onClick={onViewDetails}
          className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 font-medium transition-colors"
        >
          Analysis <ExternalLink className="w-3 h-3" />
        </button>

        {onAddHolding && (
          <button
            onClick={onAddHolding}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition-all text-xs flex items-center gap-1"
            title="Add to Portfolio"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StockCard;
