import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = "Loading financial data...", subtext = "Connecting to market analytics engine" }) => {
  return (
    <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[260px]">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-pulse" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">{message}</h3>
      <p className="text-xs text-slate-400 max-w-sm">{subtext}</p>
    </div>
  );
};

export default LoadingState;
