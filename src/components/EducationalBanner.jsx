import React, { useState } from 'react';
import { Info, X, ShieldAlert } from 'lucide-react';
import { DISCLAIMER_TEXT } from '../utils/constants';

const EducationalBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-blue-950/70 border border-indigo-500/20 rounded-xl p-3.5 mb-6 text-xs text-slate-300 flex items-start justify-between gap-3 shadow-sm backdrop-blur">
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 mt-0.5 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-indigo-300 mr-1.5 uppercase tracking-wider text-[11px]">
            Academic System Notice:
          </span>
          <span>{DISCLAIMER_TEXT}</span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-200 transition-colors p-1"
        aria-label="Dismiss disclaimer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default EducationalBanner;
