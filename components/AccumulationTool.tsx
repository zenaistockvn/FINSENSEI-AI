import React, { useState, useEffect } from 'react';
import {
    PiggyBank, TrendingUp, Calendar, Target,
    ArrowRight, Info, ChevronRight, Calculator,
    BarChart3, Wallet, LineChart, ShieldCheck, Lightbulb,
    Search, RefreshCw
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getSimplizeCompanyData, SimplizeCompanyData, getMonthlyPriceHistory } from '../services/supabaseClient';

const VN30 = [
    'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG',
    'MBB', 'MSN', 'MWG', 'PLX', 'POW', 'SAB', 'SHB', 'SSB', 'SSI', 'STB',
    'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE'
];

interface AccumulationToolProps {
    isDark?: boolean;
}

const AccumulationTool: React.FC<AccumulationToolProps> = ({ isDark = true }) => {
    const [initialInvestment, setInitialInvestment] = useState(10000000); // 10M
    const [monthlyContribution, setMonthlyContribution] = useState(2000000); // 2M
    const [expectedReturn, setExpectedReturn] = useState(12); // 12%
    const [years, setYears] = useState(10);
    const [inflationRate, setInflationRate] = useState(4); // 4%

    // Mode: 'projection' (future) or 'backtest' (past)
    const [calculationMode, setCalculationMode] = useState<'projection' | 'backtest'>('projection');
    const [backtestStartDate, setBacktestStartDate] = useState('2015-01-01');
    const [backtestEndDate, setBacktestEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Stock Selection State
    const [selectedSymbol, setSelectedSymbol] = useState<string>('HPG');
    const [stockData, setStockData] = useState<SimplizeCompanyData | null>(null);
    const [manualPrice, setManualPrice] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);

    const [data, setData] = useState<any[]>([]);
    const [results, setResults] = useState({
        totalInvested: 0,
        futureValue: 0,
        realFutureValue: 0,
        totalProfit: 0,
        totalShares: 0,
        currentPrice: 0,
        historicalReturn: 0,
        backtestYears: 0
    });

    const [transactions, setTransactions] = useState<any[]>([]);
    const [showAllTransactions, setShowAllTransactions] = useState(false);

    // Fetch stock data when symbol changes
    useEffect(() => {
        fetchStockData(selectedSymbol);
    }, [selectedSymbol]);

    const fetchStockData = async (symbol: string) => {
        setIsLoading(true);
        try {
            const data = await getSimplizeCompanyData(symbol);
            if (data) {
                setStockData(data);
                setManualPrice(data.price_close);
            }
        } catch (error) {
            console.error('Error fetching stock data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (calculationMode === 'projection') {
            calculateProjection();
        } else {
            runBacktest();
        }
    }, [initialInvestment, monthlyContribution, expectedReturn, years, inflationRate, stockData, calculationMode, backtestStartDate, backtestEndDate, manualPrice]);

    const calculateProjection = () => {
        const monthlyRate = expectedReturn / 100 / 12;
        const monthlyInflation = inflationRate / 100 / 12;
        const totalMonths = years * 12;
        const currentRefPrice = manualPrice || stockData?.price_close || 27000;

        const monthlyBankRate = 0.06 / 12; // 6% / year
        let currentBankBalance = initialInvestment;

        let chartData = [];
        let currentBalance = initialInvestment;
        let currentRealBalance = initialInvestment;
        let totalInvested = initialInvestment;
        let totalShares = initialInvestment / currentRefPrice;

        for (let month = 0; month <= totalMonths; month++) {
            if (month > 0) {
                currentBalance = (currentBalance + monthlyContribution) * (1 + monthlyRate);
                currentRealBalance = (currentRealBalance + monthlyContribution) * (1 + monthlyRate - monthlyInflation);
                currentBankBalance = (currentBankBalance + monthlyContribution) * (1 + monthlyBankRate);
                totalInvested += monthlyContribution;
                totalShares += monthlyContribution / currentRefPrice;
            } else {
                // Month 0: Initial state, assume bank balance starts same as investment
            }

            if (month % 12 === 0 || month === totalMonths) {
                chartData.push({
                    year: month / 12,
                    label: `Năm ${month / 12}`,
                    balance: Math.round(currentBalance),
                    invested: Math.round(totalInvested),
                    profit: Math.round(currentBalance - totalInvested),
                    realValue: Math.round(currentRealBalance),
                    bankBalance: Math.round(currentBankBalance)
                });
            }
        }

        setData(chartData);
        setResults({
            totalInvested,
            futureValue: currentBalance,
            realFutureValue: currentRealBalance,
            totalProfit: currentBalance - totalInvested,
            totalShares: Math.round(totalShares),
            currentPrice: currentRefPrice,
            historicalReturn: 0,
            backtestYears: 0,
            bankBalance: currentBankBalance
        });
    };

    const runBacktest = async () => {
        setIsLoading(true);
        try {
            const history = await getMonthlyPriceHistory(selectedSymbol, years, backtestStartDate, backtestEndDate);
            if (!history || history.length === 0) {
                setCalculationMode('projection');
                return;
            }

            // Calculate actual number of months and years from history
            const actualMonths = history.length;
            const actualYears = Math.max(1, Math.round((actualMonths / 12) * 10) / 10);

            // Initial investment happens at history[0] (Month 0)
            let totalInvested = initialInvestment;
            let totalShares = totalInvested / history[0].close_price;

            // Bank comparison logic
            const monthlyBankRate = 0.06 / 12; // 6% fixed for comparison
            let currentBankBalance = initialInvestment;

            let chartData = [];
            // purchaseLog will store individual transactions for the table
            let purchaseLog = [{
                date: history[0].trading_date,
                price: history[0].close_price,
                invested: initialInvestment,
                type: 'Vốn khởi đầu',
                sharesBought: totalShares,
                totalShares: totalShares,
                balance: totalShares * history[0].close_price
            }];

            // Consistent valuation: use manual price if provided and looking at current period,
            // otherwise check if we can use the latest stock data for better accuracy
            const isCurrentPeriod = new Date().toISOString().slice(0, 7) === backtestEndDate.slice(0, 7);
            const latestPrice = manualPrice || stockData?.price_close || 0;

            const currentPriceForValuation = (calculationMode === 'backtest' && isCurrentPeriod && latestPrice > 0)
                ? latestPrice
                : (history[history.length - 1].close_price);

            history.forEach((point, index) => {
                const buyPrice = point.close_price;
                // Monthly contributions happen from index 1 to N-1 (N-1 contributions)
                // This matches the projection logic where Month 0 is just the initial state
                if (index > 0) {
                    const monthlyShares = monthlyContribution / buyPrice;
                    totalInvested += monthlyContribution;
                    totalShares += monthlyShares;

                    // Bank calculation: Interest from previous month + new contribution
                    currentBankBalance = currentBankBalance * (1 + monthlyBankRate) + monthlyContribution;

                    purchaseLog.push({
                        date: point.trading_date,
                        price: buyPrice,
                        invested: monthlyContribution,
                        type: 'Tích lũy tháng',
                        sharesBought: monthlyShares,
                        totalShares: totalShares,
                        balance: totalShares * buyPrice
                    });
                } else {
                    // Index 0: Initial state
                    // currentBankBalance is already initialInvestment
                }

                // Push every month to chart
                chartData.push({
                    monthIndex: index,
                    label: point.trading_date.substring(0, 7),
                    balance: Math.round(totalShares * point.close_price),
                    invested: Math.round(totalInvested),
                    profit: Math.round(totalShares * point.close_price - totalInvested),
                    realValue: Math.round(totalShares * point.close_price),
                    bankBalance: Math.round(currentBankBalance)
                });
            });

            // If we're showing the current period, add a final data point for "Today/Current" 
            // to connect the start-of-month contribution to the current real-time value
            if (isCurrentPeriod && currentPriceForValuation > 0) {
                chartData.push({
                    monthIndex: history.length,
                    label: 'Hiện tại',
                    balance: Math.round(totalShares * currentPriceForValuation),
                    invested: Math.round(totalInvested),
                    profit: Math.round(totalShares * currentPriceForValuation - totalInvested),
                    realValue: Math.round(totalShares * currentPriceForValuation),
                    bankBalance: Math.round(currentBankBalance) // Assume consistent for the partial month or just keep same
                });
            }

            const futureValue = totalShares * currentPriceForValuation;
            const absoluteReturn = ((futureValue - totalInvested) / totalInvested) * 100;

            setData(chartData);
            setTransactions(purchaseLog.reverse());
            setResults({
                totalInvested,
                futureValue,
                realFutureValue: futureValue,
                totalProfit: futureValue - totalInvested,
                totalShares: Math.round(totalShares),
                currentPrice: currentPriceForValuation,
                historicalReturn: absoluteReturn,
                backtestYears: actualYears,
                bankBalance: currentBankBalance
            });
        } catch (error) {
            console.error('Backtest error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className={`p-4 md:p-6 space-y-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                        Tích sản đầu tư
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Lập kế hoạch tự do tài chính qua tích lũy tài sản dài hạn
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                    <Calculator size={18} className="text-indigo-500" />
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Công cụ hoạch định SENAI</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Input Controls */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/5">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                            <button
                                onClick={() => setCalculationMode('projection')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${calculationMode === 'projection' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-400'}`}
                            >
                                <LineChart size={14} />
                                Kế hoạch
                            </button>
                            <button
                                onClick={() => setCalculationMode('backtest')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${calculationMode === 'backtest' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-400'}`}
                            >
                                <RefreshCw size={14} />
                                Kiểm thử
                            </button>
                        </div>

                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <PiggyBank size={20} className="text-indigo-500" />
                            {calculationMode === 'projection' ? 'Thông số kế hoạch' : 'Thông số kiểm thử'}
                        </h3>

                        <div className="space-y-6">
                            {/* Strategy Rule Info */}
                            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 flex items-start gap-3">
                                <Info size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                    Chiến lược: <span className="text-indigo-500 font-bold">DCA hàng tháng</span>. Hệ thống tự động mua vào <span className="text-indigo-500 font-bold">ngày 01</span> hàng tháng (hoặc ngày giao dịch kế tiếp).
                                </div>
                            </div>

                            {/* Backtest Start Date - Only in Backtest mode */}
                            {calculationMode === 'backtest' && (
                                <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                        <Calendar size={14} className="text-indigo-500" />
                                        Bắt đầu từ tháng/năm
                                    </label>
                                    <input
                                        type="month"
                                        value={backtestStartDate.substring(0, 7)}
                                        onChange={(e) => setBacktestStartDate(`${e.target.value}-01`)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        * Phân tích tính từ ngày 01 của tháng bắt đầu.
                                    </p>
                                </div>
                            )}

                            {calculationMode === 'backtest' && (
                                <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                        <ArrowRight size={14} className="text-red-500" />
                                        Kết thúc vào tháng/năm
                                    </label>
                                    <input
                                        type="month"
                                        value={backtestEndDate.substring(0, 7)}
                                        onChange={(e) => {
                                            if (!e.target.value) return;
                                            const [year, month] = e.target.value.split('-');
                                            // Set to the last day of the selected month to ensure the query includes all trading days in that month
                                            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                                            setBacktestEndDate(`${e.target.value}-${lastDay}`);
                                        }}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 transition-all font-bold"
                                    />
                                </div>
                            )}

                            {/* Stock Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Chọn mã VN30</label>
                                <div className="relative">
                                    <select
                                        value={selectedSymbol}
                                        onChange={(e) => setSelectedSymbol(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
                                    >
                                        {VN30.map(s => (
                                            <option key={s} value={s}>
                                                {s} - {
                                                    s === 'HPG' ? 'Hòa Phát' :
                                                        s === 'FPT' ? 'FPT' :
                                                            s === 'VIC' ? 'Vingroup' :
                                                                s === 'VCB' ? 'Vietcombank' :
                                                                    s === 'VNM' ? 'Vinamilk' :
                                                                        s === 'MSN' ? 'Masan' :
                                                                            s === 'MWG' ? 'Thế Giới Di Động' : s
                                                }
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <ChevronRight size={16} className="rotate-90" />}
                                    </div>
                                </div>
                                {stockData && (
                                    <div className="flex items-center justify-between px-1 mt-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-400">Giá hiện tại:</span>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    value={manualPrice}
                                                    onChange={(e) => setManualPrice(Number(e.target.value))}
                                                    className="w-24 bg-transparent text-indigo-500 font-bold text-sm border-b border-dashed border-indigo-500/30 focus:border-indigo-500 outline-none text-right px-1"
                                                />
                                                <span className="text-[10px] text-indigo-500 font-bold ml-1">₫</span>
                                                <div className="absolute top-full left-0 hidden group-hover:block z-10 bg-black text-white text-[10px] p-1 rounded mt-1 whitespace-nowrap">
                                                    Nhập để điều chỉnh giá
                                                </div>
                                            </div>
                                        </div>
                                        {stockData.dividend_yield > 0 && (
                                            <span className="text-[10px] text-emerald-500">Cổ tức: {stockData.dividend_yield}%</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Initial Investment */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-slate-500">Vốn khởi đầu</label>
                                    <span className="text-sm font-bold text-indigo-500">{formatCurrency(initialInvestment)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1000000000"
                                    step="10000000"
                                    value={initialInvestment}
                                    onChange={(e) => setInitialInvestment(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            {/* Monthly Contribution */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-slate-500">Tích lũy hàng tháng</label>
                                    <span className="text-sm font-bold text-emerald-500">{formatCurrency(monthlyContribution)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="500000"
                                    max="50000000"
                                    step="500000"
                                    value={monthlyContribution}
                                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <div className="text-[10px] text-slate-400 text-right">
                                    ~ {Math.floor(monthlyContribution / results.currentPrice)} cổ phiếu {selectedSymbol}/tháng
                                </div>
                            </div>

                            {/* Expected Return - Only show in Projection mode */}
                            {calculationMode === 'projection' ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium text-slate-500">Lãi suất kỳ vọng (%/năm)</label>
                                        <span className="text-sm font-bold text-purple-500">{expectedReturn}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        step="0.5"
                                        value={expectedReturn}
                                        onChange={(e) => setExpectedReturn(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                </div>
                            ) : (
                                <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp size={14} className="text-purple-500" />
                                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Hiệu suất thực tế</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                        Trong chế độ Kiểm thử, lợi nhuận được tính trực tiếp từ biến động giá lịch sử của {selectedSymbol}, không sử dụng lãi suất giả định.
                                    </p>
                                </div>
                            )}

                            {/* Years - Only show in Projection mode */}
                            {calculationMode === 'projection' && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium text-slate-500">Thời gian tích sản (năm)</label>
                                        <span className="text-sm font-bold text-orange-500">{years} năm</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="40"
                                        step="1"
                                        value={years}
                                        onChange={(e) => setYears(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                    />
                                </div>
                            )}

                            {/* Inflation Rate - Only show in Projection mode */}
                            {calculationMode === 'projection' && (
                                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5 animate-in fade-in duration-500">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium text-slate-400">Lạm phát giả định</label>
                                        <span className="text-sm font-medium text-slate-400">{inflationRate}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="15"
                                        step="0.1"
                                        value={inflationRate}
                                        onChange={(e) => setInflationRate(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingUp size={120} />
                        </div>
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                            <Target size={18} />
                            Sức mạnh lãi kép
                        </h4>
                        <p className="text-indigo-100 text-xs leading-relaxed">
                            "Kỳ quan thứ 8 của thế giới là lãi kép. Ai hiểu nó sẽ kiếm được nó, ai không hiểu nó sẽ phải trả nó."
                            - Albert Einstein
                        </p>
                    </div>
                </div>

                {/* Results & Visualization */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                    <Wallet size={20} />
                                </div>
                                <span className="text-sm font-medium text-slate-500">Tổng vốn đầu tư</span>
                            </div>
                            <div className="text-2xl font-bold">{formatCurrency(results.totalInvested)}</div>
                        </div>

                        <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="text-sm font-medium text-slate-500">
                                    {calculationMode === 'projection' ? 'Giá trị tương lai' : 'Giá trị cuối kỳ'}
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(results.futureValue)}</div>
                            <div className="text-[10px] text-slate-400 mt-1">~ {results.totalShares.toLocaleString()} cổ phiếu {selectedSymbol}</div>
                        </div>

                        <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-white/5 sm:col-span-2 xl:col-span-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                    <Target size={20} />
                                </div>
                                <span className="text-sm font-medium text-slate-500">
                                    Lợi nhuận ròng
                                </span>
                            </div>
                            <div className={`text-2xl font-bold ${results.totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatCurrency(results.totalProfit)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                                Hiệu suất: {calculationMode === 'projection' ? 'Dự kiến' : `${results.historicalReturn.toFixed(1)}%`}
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/5 h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <BarChart3 size={20} className="text-indigo-500" />
                                {calculationMode === 'projection' ? 'Biểu đồ tăng trưởng dự kiến' : `Lịch sử tích sản ${selectedSymbol}`}
                            </h3>
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                    <span className="text-slate-500">Tài sản</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-slate-500">Lợi nhuận</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                                    <span className="text-slate-500">Vốn gốc</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/30"></div>
                                    <span className="text-slate-500">Gửi Tiết kiệm</span>
                                </div>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBank" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                <XAxis
                                    dataKey="label"
                                    stroke={isDark ? "#94a3b8" : "#64748b"}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke={isDark ? "#94a3b8" : "#64748b"}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => (val / 1000000) + 'M'}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                        borderColor: isDark ? '#374151' : '#e5e7eb',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value: any) => formatCurrency(value)}
                                    labelStyle={{ color: '#6366f1', fontWeight: 'bold', marginBottom: '4px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorBalance)"
                                    name={calculationMode === 'projection' ? "Tổng tài sản dự kiến" : "Giá trị danh mục"}
                                />
                                {calculationMode === 'projection' && (
                                    <Area
                                        type="monotone"
                                        dataKey="realValue"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        fillOpacity={1}
                                        fill="url(#colorReal)"
                                        name="Giá trị sau lạm phát"
                                    />
                                )}
                                <Area
                                    type="monotone"
                                    dataKey="invested"
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                    fill="transparent"
                                    name="Vốn gốc tích lũy"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="bankBalance"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    fillOpacity={1}
                                    fill="url(#colorBank)"
                                    name="Gửi tiết kiệm (6%)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Analysis Card */}
                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-dashed border-slate-300 dark:border-white/10">
                        <h4 className="font-bold flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                            <Lightbulb size={20} />
                            Nhận định từ FinSensei
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 p-1 bg-emerald-500 rounded-full text-white">
                                        <ChevronRight size={12} />
                                    </div>
                                    <p className="text-sm leading-relaxed">
                                        Sau <span className="font-bold text-indigo-500">{calculationMode === 'projection' ? years : results.backtestYears} năm</span>, lãi suất kép tạo ra <span className="font-bold text-emerald-500">{formatCurrency(results.totalProfit)}</span> lợi nhuận, gấp <span className="font-bold">{(results.futureValue / results.totalInvested).toFixed(1)} lần</span> số vốn bạn bỏ ra.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 p-1 bg-indigo-500 rounded-full text-white">
                                        <ChevronRight size={12} />
                                    </div>
                                    <p className="text-sm leading-relaxed">
                                        Dòng tiền hàng tháng ({formatCurrency(monthlyContribution)}) đóng vai trò là "động cơ" chính trong giai đoạn đầu.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {calculationMode === 'projection' && results.futureValue - results.realFutureValue > 0 && (
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-orange-500 rounded-full text-white">
                                            <ChevronRight size={12} />
                                        </div>
                                        <p className="text-sm leading-relaxed">
                                            Lạm phát {inflationRate}% đã làm "bốc hơi" <span className="font-bold text-orange-500">{formatCurrency(results.futureValue - results.realFutureValue)}</span> sức mua tương đương của bạn.
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-start gap-3 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                                    <p className="text-xs font-medium text-slate-500 italic">
                                        Gợi ý: Hãy cân nhắc tích sản vào các mã Blue-chip thuộc nhóm VN30 có cổ tức đều đặn để tối ưu hóa kế hoạch này.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Transactions Table (Only in Backtest mode) */}
                    {calculationMode === 'backtest' && transactions.length > 0 && (
                        <div className="bg-white dark:bg-[#111827] rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Calendar size={20} className="text-indigo-500" />
                                    Bảng kê giao dịch chi tiết ({selectedSymbol})
                                </h3>
                                <button
                                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                                >
                                    {showAllTransactions ? 'Thu gọn' : `Xem tất cả (${transactions.length})`}
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-white/5 text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">Ngày thực hiện</th>
                                            <th className="px-6 py-3 font-semibold">Loại giao dịch</th>
                                            <th className="px-6 py-3 font-semibold text-right">Giá mua</th>
                                            <th className="px-6 py-3 font-semibold text-right">Tiền mua</th>
                                            <th className="px-6 py-3 font-semibold text-right">Cổ phiếu mua</th>
                                            <th className="px-6 py-3 font-semibold text-right">Tổng sở hữu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {(showAllTransactions ? transactions : transactions.slice(0, 10)).map((t, i) => (
                                            <tr key={`${t.date}-${t.type}`} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium">{t.date}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${t.type === 'Vốn khởi đầu' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                        {t.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-600 dark:text-slate-300">{formatCurrency(t.price)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-indigo-500">{formatCurrency(t.invested)}</td>
                                                <td className="px-6 py-4 text-right font-medium">+{t.sharesBought.toFixed(1)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-emerald-500">{t.totalShares.toFixed(0)} CP</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccumulationTool;
