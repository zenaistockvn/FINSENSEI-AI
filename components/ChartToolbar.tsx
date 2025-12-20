import React from 'react';
import { 
  BarChart2, CandlestickChart, LineChart, TrendingUp,
  Layers, Settings, Download, Maximize2, RefreshCw
} from 'lucide-react';

interface ChartToolbarProps {
  isDark: boolean;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  chartType: 'candle' | 'line' | 'area';
  onChartTypeChange: (type: 'candle' | 'line' | 'area') => void;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onExport?: () => void;
}

const ChartToolbar: React.FC<ChartToolbarProps> = ({
  isDark,
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  onRefresh,
  onFullscreen,
  onExport
}) => {
  const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', 'ALL'];
  
  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b ${
      isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
    }`}>
      {/* Timeframe Selector */}
      <div className="flex items-center gap-1">
        {timeframes.map(tf => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              timeframe === tf
                ? isDark 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-indigo-500 text-white'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      
      {/* Chart Type & Tools */}
      <div className="flex items-center gap-2">
        {/* Chart Type */}
        <div className={`flex items-center rounded-lg p-0.5 ${
          isDark ? 'bg-slate-700' : 'bg-slate-200'
        }`}>
          <button
            onClick={() => onChartTypeChange('candle')}
            className={`p-1.5 rounded ${
              chartType === 'candle'
                ? isDark ? 'bg-slate-600 text-white' : 'bg-white text-slate-900 shadow'
                : isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
            title="Candlestick"
          >
            <BarChart2 size={16} />
          </button>
          <button
            onClick={() => onChartTypeChange('line')}
            className={`p-1.5 rounded ${
              chartType === 'line'
                ? isDark ? 'bg-slate-600 text-white' : 'bg-white text-slate-900 shadow'
                : isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
            title="Line"
          >
            <TrendingUp size={16} />
          </button>
        </div>
        
        {/* Divider */}
        <div className={`w-px h-6 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
        
        {/* Tools */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`p-1.5 rounded transition-colors ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        )}
        
        {onFullscreen && (
          <button
            onClick={onFullscreen}
            className={`p-1.5 rounded transition-colors ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        )}
        
        {onExport && (
          <button
            onClick={onExport}
            className={`p-1.5 rounded transition-colors ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Export"
          >
            <Download size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChartToolbar;
