import React from 'react';

export default function Loading() {
  return (
    <div className="w-full h-full space-y-6 animate-pulse">
      {/* Toolbar Skeleton */}
      <div className="flex flex-col lg:row items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
        <div className="flex-1 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
        <div className="w-full lg:w-48 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="w-full lg:w-48 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="w-full lg:w-40 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>

      {/* Grid/Table Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            </div>
            <div className="h-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl" />
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
