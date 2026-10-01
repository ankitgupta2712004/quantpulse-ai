import React from 'react';
import { Trash2, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import EmptyState from './EmptyState';

const PortfolioTable = ({
  holdings = [],
  onRemoveHolding,
  onAddHoldingClick,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/4"></div>
          <div className="h-10 bg-slate-800/60 rounded"></div>
          <div className="h-10 bg-slate-800/40 rounded"></div>
          <div className="h-10 bg-slate-800/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No Portfolio Assets Connected"
        description="Data will appear after connecting market data or adding custom holdings. In Phase 2, this table will sync live with MongoDB and real-time market quotes."
        actionText="Add Sample Asset"
        onAction={onAddHoldingClick}
      />
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Asset / Symbol</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Shares / Qty</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Avg Cost</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Market Price</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Current Value</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Unrealized P/L</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {holdings.map((item) => {
              const currentVal = item.shares * (item.currentPrice || item.avgCost);
              const totalCost = item.shares * item.avgCost;
              const pnl = currentVal - totalCost;
              const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
              const isProfit = pnl >= 0;

              return (
                <tr key={item.id || item.symbol} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                        {item.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-white tracking-wide">{item.symbol}</div>
                        <div className="text-xs text-slate-400">{item.name || item.companyName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-slate-200">
                    {item.shares}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-300">
                    {formatCurrency(item.avgCost)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                    {item.currentPrice ? formatCurrency(item.currentPrice) : '--'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-white">
                    {formatCurrency(currentVal)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    <div className={`inline-flex items-center gap-1 font-semibold text-xs ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{formatCurrency(pnl)}</span>
                      <span>({formatPercentage(pnlPercent)})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onRemoveHolding && onRemoveHolding(item.id || item.symbol)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove holding"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortfolioTable;
