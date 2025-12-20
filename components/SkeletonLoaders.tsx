import React from 'react';

interface SkeletonProps {
  className?: string;
  isDark?: boolean;
}

// Base Skeleton component
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', isDark = true }) => (
  <div className={`skeleton rounded ${className} ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'}`}></div>
);

// Chart Skeleton
export const ChartSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => (
  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Skeleton isDark={isDark} className="w-12 h-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton isDark={isDark} className="w-20 h-5" />
          <Skeleton isDark={isDark} className="w-32 h-4" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton isDark={isDark} className="w-16 h-8 rounded-lg" />
        <Skeleton isDark={isDark} className="w-16 h-8 rounded-lg" />
        <Skeleton isDark={isDark} className="w-16 h-8 rounded-lg" />
      </div>
    </div>
    
    {/* Chart Area */}
    <div className="relative h-[300px]">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} isDark={isDark} className="w-10 h-3" />
        ))}
      </div>
      
      {/* Chart bars */}
      <div className="absolute left-14 right-0 top-0 bottom-8 flex items-end justify-around gap-1">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <Skeleton 
              isDark={isDark} 
              className="w-full" 
              style={{ height: `${Math.random() * 60 + 20}%` }} 
            />
          </div>
        ))}
      </div>
      
      {/* X-axis labels */}
      <div className="absolute left-14 right-0 bottom-0 flex justify-between">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} isDark={isDark} className="w-12 h-3" />
        ))}
      </div>
    </div>
  </div>
);

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number; isDark?: boolean }> = ({ 
  rows = 5, 
  cols = 5, 
  isDark = true 
}) => (
  <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
    {/* Header */}
    <div className={`flex gap-4 p-4 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} isDark={isDark} className={`h-4 ${i === 0 ? 'w-24' : 'flex-1'}`} />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div 
        key={rowIdx} 
        className={`flex gap-4 p-4 ${rowIdx < rows - 1 ? `border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}` : ''}`}
      >
        {Array.from({ length: cols }).map((_, colIdx) => (
          <Skeleton 
            key={colIdx} 
            isDark={isDark} 
            className={`h-4 ${colIdx === 0 ? 'w-24' : 'flex-1'}`} 
          />
        ))}
      </div>
    ))}
  </div>
);

// Card Skeleton
export const CardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => (
  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center gap-3 mb-4">
      <Skeleton isDark={isDark} className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton isDark={isDark} className="w-24 h-4" />
        <Skeleton isDark={isDark} className="w-16 h-3" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton isDark={isDark} className="w-full h-3" />
      <Skeleton isDark={isDark} className="w-3/4 h-3" />
      <Skeleton isDark={isDark} className="w-1/2 h-3" />
    </div>
  </div>
);

// Stats Card Skeleton
export const StatsCardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => (
  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center justify-between mb-3">
      <Skeleton isDark={isDark} className="w-20 h-4" />
      <Skeleton isDark={isDark} className="w-8 h-8 rounded-lg" />
    </div>
    <Skeleton isDark={isDark} className="w-32 h-8 mb-2" />
    <div className="flex items-center gap-2">
      <Skeleton isDark={isDark} className="w-16 h-4" />
      <Skeleton isDark={isDark} className="w-12 h-4" />
    </div>
  </div>
);

// Profile/User Skeleton
export const ProfileSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => (
  <div className="flex items-center gap-3">
    <Skeleton isDark={isDark} className="w-12 h-12 rounded-full" />
    <div className="space-y-2">
      <Skeleton isDark={isDark} className="w-32 h-4" />
      <Skeleton isDark={isDark} className="w-24 h-3" />
    </div>
  </div>
);

// List Item Skeleton
export const ListItemSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => (
  <div className="flex items-center gap-3 p-3">
    <Skeleton isDark={isDark} className="w-10 h-10 rounded-lg" />
    <div className="flex-1 space-y-2">
      <Skeleton isDark={isDark} className="w-24 h-4" />
      <Skeleton isDark={isDark} className="w-40 h-3" />
    </div>
    <Skeleton isDark={isDark} className="w-16 h-6 rounded" />
  </div>
);

// Mini Sparkline Skeleton
export const SparklineSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => (
  <div className="flex items-end gap-0.5 h-8">
    {Array.from({ length: 12 }).map((_, i) => (
      <Skeleton 
        key={i} 
        isDark={isDark} 
        className="w-1 rounded-t" 
        style={{ height: `${Math.random() * 60 + 20}%` }} 
      />
    ))}
  </div>
);

export default Skeleton;
