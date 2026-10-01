import React from 'react';

export const SkeletonBox = ({ className = 'h-6 w-full' }) => (
  <div className={`animate-pulse bg-slate-800/80 rounded-xl ${className}`} />
);

export const SkeletonCard = () => (
  <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
    <div className="flex justify-between items-center">
      <SkeletonBox className="h-4 w-24" />
      <SkeletonBox className="h-8 w-8 rounded-xl" />
    </div>
    <SkeletonBox className="h-7 w-36" />
    <SkeletonBox className="h-3.5 w-48" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 5 }) => (
  <div className="glass-card rounded-2xl border border-slate-800 p-4 space-y-3">
    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
      <SkeletonBox className="h-5 w-40" />
      <SkeletonBox className="h-8 w-24 rounded-xl" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid grid-cols-5 gap-3 py-2">
        {Array.from({ length: cols }).map((_, j) => (
          <SkeletonBox key={j} className="h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonChart = () => (
  <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-4">
    <div className="flex justify-between items-center">
      <SkeletonBox className="h-5 w-48" />
      <SkeletonBox className="h-4 w-32" />
    </div>
    <div className="h-64 w-full flex items-end gap-3 pt-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-800/60 rounded-t-lg animate-pulse"
          style={{ height: `${20 + (i * 7) % 80}%` }}
        />
      ))}
    </div>
  </div>
);

export default SkeletonBox;
