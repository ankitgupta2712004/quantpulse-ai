import React from 'react';

const PageHeader = ({ title, subtitle, badge, actionButton }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-slate-400 mt-1 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {actionButton && (
        <div className="flex items-center gap-3">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
