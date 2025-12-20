import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react';

// Data Freshness Indicator
interface DataFreshnessProps {
  lastUpdated: Date | string | null;
  isDark?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const DataFreshness: React.FC<DataFreshnessProps> = ({ 
  lastUpdated, 
  isDark = true, 
  onRefresh,
  isRefreshing = false
}) => {
  const [timeAgo, setTimeAgo] = useState('');
  const [status, setStatus] = useState<'fresh' | 'stale' | 'old'>('fresh');

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdated) {
        setTimeAgo('Chưa cập nhật');
        setStatus('old');
        return;
      }

      const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) {
        setTimeAgo('Vừa xong');
        setStatus('fresh');
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} phút trước`);
        setStatus(diffMins < 15 ? 'fresh' : 'stale');
      } else if (diffHours < 24) {
        setTimeAgo(`${diffHours} giờ trước`);
        setStatus('stale');
      } else {
        setTimeAgo(`${diffDays} ngày trước`);
        setStatus('old');
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const statusColors = {
    fresh: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    stale: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    old: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
  };

  const statusIcons = {
    fresh: <CheckCircle size={12} />,
    stale: <Clock size={12} />,
    old: <AlertCircle size={12} />
  };

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-medium ${statusColors[status]}`}>
      {statusIcons[status]}
      <span>{timeAgo}</span>
      {onRefresh && (
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`p-0.5 rounded hover:bg-white/20 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={12} />
        </button>
      )}
    </div>
  );
};

// Mini Sparkline Chart
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: 'auto' | 'green' | 'red' | 'blue';
  showDots?: boolean;
  isDark?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  width = 80, 
  height = 24,
  color = 'auto',
  showDots = false,
  isDark = true
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const isUp = data[data.length - 1] >= data[0];
  
  const getColor = () => {
    if (color === 'auto') return isUp ? '#10b981' : '#ef4444';
    if (color === 'green') return '#10b981';
    if (color === 'red') return '#ef4444';
    return '#3b82f6';
  };

  const strokeColor = getColor();
  const fillColor = `${strokeColor}20`;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Area fill */}
      <polygon points={areaPoints} fill={fillColor} />
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* End dot */}
      {showDots && (
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r={3}
          fill={strokeColor}
        />
      )}
    </svg>
  );
};

// Change Badge with color coding
interface ChangeBadgeProps {
  value: number;
  suffix?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ChangeBadge: React.FC<ChangeBadgeProps> = ({ 
  value, 
  suffix = '%',
  showIcon = true,
  size = 'md'
}) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const colorClasses = isNeutral
    ? 'bg-slate-500/10 text-slate-500'
    : isPositive
      ? 'bg-emerald-500/10 text-emerald-500'
      : 'bg-rose-500/10 text-rose-500';

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg font-medium ${sizeClasses[size]} ${colorClasses}`}>
      {showIcon && <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />}
      <span>{isPositive ? '+' : ''}{value.toFixed(2)}{suffix}</span>
    </span>
  );
};

// Progress Bar with label
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'green' | 'red' | 'blue' | 'amber' | 'auto';
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'blue',
  size = 'md',
  isDark = true
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColor = () => {
    if (color === 'auto') {
      if (percentage >= 70) return 'bg-emerald-500';
      if (percentage >= 40) return 'bg-amber-500';
      return 'bg-rose-500';
    }
    const colors = {
      green: 'bg-emerald-500',
      red: 'bg-rose-500',
      blue: 'bg-blue-500',
      amber: 'bg-amber-500'
    };
    return colors[color];
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {label}
            </span>
          )}
          {showValue && (
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {value.toFixed(0)}/{max}
            </span>
          )}
        </div>
      )}
      <div className={`w-full rounded-full overflow-hidden ${sizeClasses[size]} ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Score Circle
interface ScoreCircleProps {
  score: number;
  maxScore?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
}

export const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  maxScore = 100,
  label,
  size = 'md',
  isDark = true
}) => {
  const percentage = (score / maxScore) * 100;
  const radius = size === 'sm' ? 20 : size === 'md' ? 30 : 40;
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 70) return '#10b981';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const svgSize = (radius + strokeWidth) * 2;
  const center = radius + strokeWidth;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isDark ? '#334155' : '#e2e8f0'}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-2xl'
          } ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {label}
        </span>
      )}
    </div>
  );
};

// Empty State
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  isDark?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  isDark = true
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    {icon && (
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        isDark ? 'bg-slate-800' : 'bg-slate-100'
      }`}>
        {icon}
      </div>
    )}
    <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {title}
    </h3>
    {description && (
      <p className={`text-sm max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {description}
      </p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

// Error State
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isDark?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã xảy ra lỗi',
  message = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  onRetry,
  isDark = true
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-rose-500/10`}>
      <AlertCircle size={32} className="text-rose-500" />
    </div>
    <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {title}
    </h3>
    <p className={`text-sm max-w-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
      {message}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <RefreshCw size={16} />
        Thử lại
      </button>
    )}
  </div>
);

export default {
  DataFreshness,
  Sparkline,
  ChangeBadge,
  ProgressBar,
  ScoreCircle,
  EmptyState,
  ErrorState
};
