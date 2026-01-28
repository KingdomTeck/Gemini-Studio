import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorState, CalculationResult } from '../types';
import { Settings, Info, TrendingUp, DollarSign, ShieldAlert, ChevronDown, ChevronUp, RefreshCw, Calculator as CalcIcon, HelpCircle, Loader2 } from 'lucide-react';
import RiskMeter from './RiskMeter';
import { MARKET_PRESETS, fetchLivePriceRatio } from '../utils/marketData';

const Calculator: React.FC = () => {
  const [strategyType, setStrategyType] = useState<string>('haSUI/SUI');
  
  const [inputs, setInputs] = useState<CalculatorState>({
    initialDeposit: 1000,
    leverage: 3,
    priceRatio: 1.1, // Default fallback
    supplyApy: 45.2,
    borrowApy: 1.0,
    liquidationThreshold: 51,
    collateralToken: 'haSUI',
    debtToken: 'SUI',
  });

  const [inputMode, setInputMode] = useState<'leverage' | 'ltv'>('leverage');
  const [targetLtv, setTargetLtv] = useState<string>('66.6');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // Load Strategy Data
  useEffect(() => {
    const loadStrategy = async () => {
      if (strategyType === 'Custom') return;

      const preset = MARKET_PRESETS[strategyType];
      if (!preset) return;

      // Set static data from screenshot configuration
      setInputs(prev => ({
        ...prev,
        collateralToken: preset.collateral,
        debtToken: preset.debt,
        supplyApy: preset.supplyApy,
        borrowApy: preset.borrowApy,
        liquidationThreshold: preset.liquidationLtv
      }));

      // Fetch Live Prices
      setIsLoadingPrices(true);
      const ratio = await fetchLivePriceRatio(preset.coingeckoIds.collateral, preset.coingeckoIds.debt);
      setIsLoadingPrices(false);

      if (ratio) {
        setInputs(prev => ({ ...prev, priceRatio: ratio }));
      }
    };

    loadStrategy();
  }, [strategyType]);

  // Sync Target LTV input when leverage changes
  useEffect(() => {
    if (inputMode === 'leverage') {
      const ltv = (1 - 1 / inputs.leverage) * 100;
      setTargetLtv(ltv.toFixed(1));
    }
  }, [inputs.leverage, inputMode]);

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStrategyType(e.target.value);
  };

  // Core Calculation Logic
  const results: CalculationResult = useMemo(() => {
    const totalExposure = inputs.initialDeposit * inputs.leverage;
    const collateralAmount = totalExposure / inputs.priceRatio;
    const totalDebt = totalExposure - inputs.initialDeposit;
    const ltv = totalExposure > 0 ? (totalDebt / totalExposure) * 100 : 0;

    const thresholdDecimal = inputs.liquidationThreshold / 100;
    const liquidationPrice = (collateralAmount > 0 && thresholdDecimal > 0) 
      ? totalDebt / (collateralAmount * thresholdDecimal)
      : 0;

    const grossYield = totalExposure * (inputs.supplyApy / 100);
    const borrowCost = totalDebt * (inputs.borrowApy / 100);
    const netEarned = grossYield - borrowCost;
    const netApy = inputs.initialDeposit > 0 ? (netEarned / inputs.initialDeposit) * 100 : 0;

    return {
      totalExposure,
      collateralAmount,
      totalDebt,
      ltv,
      liquidationPrice,
      grossYield,
      borrowCost,
      netEarned,
      netApy
    };
  }, [inputs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'collateralToken' || name === 'debtToken') {
       setInputs(prev => ({ ...prev, [name]: value }));
    } else {
       // Allow typing negative numbers and decimals by not parsing immediately if it ends with dot or minus
       // However, to keep it simple with type="number", we mostly rely on browser behavior.
       // We'll use a simple parser that defaults to 0 only if strictly NaN and empty.
       const floatVal = parseFloat(value);
       setInputs(prev => ({
         ...prev,
         [name]: isNaN(floatVal) ? 0 : floatVal
       }));
    }
  };

  const handleLeverageChange = (val: number) => {
    const newLeverage = Math.min(Math.max(val, 1.1), 10);
    setInputs(prev => ({ ...prev, leverage: newLeverage }));
  };

  const handleLtvInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTargetLtv(val);
    const ltvNum = parseFloat(val);
    if (!isNaN(ltvNum) && ltvNum >= 0 && ltvNum < 95) {
      const decimalLtv = ltvNum / 100;
      if (decimalLtv < 0.99) {
          const newLeverage = 1 / (1 - decimalLtv);
          handleLeverageChange(newLeverage);
      }
    }
  };

  const toggleMode = (mode: 'leverage' | 'ltv') => {
    setInputMode(mode);
  };

  const presetLeverages = [2, 3, 5, 7, 9];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Configuration
            </h2>
            {isLoadingPrices && (
              <span className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Fetching Prices...
              </span>
            )}
          </div>

          {/* Token Selection */}
          <div className="mb-6 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
             <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Market Strategy</label>
             <select 
               value={strategyType}
               onChange={handleStrategyChange}
               className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3"
             >
               {Object.keys(MARKET_PRESETS).map(key => (
                 <option key={key} value={key}>{MARKET_PRESETS[key].name} ({key})</option>
               ))}
               <option value="Custom">Custom Pair...</option>
             </select>

             {strategyType === 'Custom' && (
               <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                 <div>
                   <label className="block text-xs text-slate-500 mb-1">Collateral</label>
                   <input 
                     type="text" 
                     name="collateralToken"
                     value={inputs.collateralToken}
                     onChange={handleInputChange}
                     className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-white" 
                   />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-500 mb-1">Debt</label>
                   <input 
                     type="text" 
                     name="debtToken"
                     value={inputs.debtToken}
                     onChange={handleInputChange}
                     className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-white" 
                   />
                 </div>
               </div>
             )}
          </div>

          {/* Initial Deposit */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Initial Deposit ({inputs.debtToken})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm truncate max-w-[60px]">{inputs.debtToken}</span>
              <input
                type="number"
                name="initialDeposit"
                value={inputs.initialDeposit}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-4 pl-16 pr-4 text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="bg-slate-900 p-1 rounded-lg flex mb-6 border border-slate-700">
            <button 
              onClick={() => toggleMode('leverage')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${inputMode === 'leverage' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Manual Leverage
            </button>
            <button 
              onClick={() => toggleMode('ltv')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${inputMode === 'ltv' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Target LTV
            </button>
          </div>

          {/* Dynamic Input Section */}
          <div className="mb-8 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            {inputMode === 'leverage' ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-slate-400">
                    Leverage Multiplier
                  </label>
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-lg font-bold shadow-blue-500/20 shadow-lg">
                    {inputs.leverage.toFixed(2)}x
                  </span>
                </div>
                
                {/* Preset Buttons */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
                  {presetLeverages.map(lev => (
                    <button
                      key={lev}
                      onClick={() => handleLeverageChange(lev)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        Math.abs(inputs.leverage - lev) < 0.1 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                  <button
                    onClick={() => handleLeverageChange(10)} 
                    className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 whitespace-nowrap"
                  >
                    Max
                  </button>
                </div>

                <input
                  type="range"
                  min="1.1"
                  max="10"
                  step="0.1"
                  value={inputs.leverage}
                  onChange={(e) => handleLeverageChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-slate-400">
                      Target LTV
                    </label>
                    <div className="group relative">
                       <HelpCircle className="w-4 h-4 text-slate-500 hover:text-blue-400 cursor-help transition-colors" />
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                         <p className="mb-1 font-bold text-white">Loan-to-Value (LTV)</p>
                         <p>The ratio of your Debt to your Collateral value. Higher LTV means higher leverage and yield, but your liquidation price moves closer to the current price.</p>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">Resulting Leverage:</span>
                    <span className="text-blue-400 font-bold">{inputs.leverage.toFixed(2)}x</span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={targetLtv}
                    onChange={handleLtvInputChange}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl py-3 pl-4 pr-12 text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="60.0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                </div>
              </>
            )}
          </div>

          {/* APY Configuration */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Protocol Rates (Editable)</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-colors">
                <label className="block text-xs text-slate-400 mb-1 truncate">
                  {inputs.collateralToken} Supply APY
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="supplyApy"
                    step="0.01"
                    value={inputs.supplyApy}
                    onChange={handleInputChange}
                    className="w-full bg-transparent text-emerald-400 font-bold text-lg outline-none placeholder-slate-700"
                    placeholder="0.00"
                  />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-medium">%</span>
                </div>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-colors">
                 <label className="block text-xs text-slate-400 mb-1 truncate">
                  {inputs.debtToken} Borrow APY
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="borrowApy"
                    step="0.01"
                    value={inputs.borrowApy}
                    onChange={handleInputChange}
                    className={`w-full bg-transparent font-bold text-lg outline-none placeholder-slate-700 ${inputs.borrowApy < 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    placeholder="0.00"
                  />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-medium">%</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 ml-1">
              *Negative Borrow APY indicates rewards (you are paid to borrow).
            </p>
          </div>

          {/* Advanced Settings Toggle */}
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors py-2 border-t border-slate-700 mt-2"
          >
            <span>Market & Protocol Parameters</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Advanced Inputs */}
          {showAdvanced && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{inputs.collateralToken}/{inputs.debtToken} Price Ratio</label>
                <input
                  type="number"
                  name="priceRatio"
                  step="0.0001"
                  value={inputs.priceRatio}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Liquidation Threshold (%)</label>
                <input
                  type="number"
                  name="liquidationThreshold"
                  step="1"
                  value={inputs.liquidationThreshold}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-200 text-sm">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            You are supplying <strong>{inputs.collateralToken}</strong> and borrowing <strong>{inputs.debtToken}</strong>. 
            Rates are based on current Pebble Finance markets.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Results */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Net APY */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Net APY</p>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-4xl font-bold ${results.netApy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {results.netApy.toFixed(2)}%
              </h3>
              <span className="text-slate-500 text-sm">annualized</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Supply: <span className="text-emerald-400">{inputs.supplyApy.toFixed(1)}%</span> | 
              Borrow: <span className={inputs.borrowApy < 0 ? "text-emerald-400" : "text-red-400"}>{inputs.borrowApy.toFixed(1)}%</span>
            </p>
          </div>

          {/* Net Profit */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-16 h-16 text-blue-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Proj. Yearly Profit</p>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-4xl font-bold ${results.netEarned >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {results.netEarned.toFixed(2)}
              </h3>
              <span className="text-slate-500 text-sm">{inputs.debtToken}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
               Daily est: {(results.netEarned / 365).toFixed(3)} {inputs.debtToken}
            </p>
          </div>
        </div>

        {/* Detailed Stats & Risk */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-slate-400" />
            Position Details & Risk
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stats List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <span className="text-slate-400 text-sm">Total {inputs.debtToken} Exposure</span>
                <span className="text-white font-mono font-medium">{results.totalExposure.toLocaleString(undefined, {maximumFractionDigits: 0})} {inputs.debtToken}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <span className="text-slate-400 text-sm">Total Debt</span>
                <span className="text-red-300 font-mono font-medium">-{results.totalDebt.toLocaleString(undefined, {maximumFractionDigits: 0})} {inputs.debtToken}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <span className="text-slate-400 text-sm">Collateral ({inputs.collateralToken})</span>
                <span className="text-white font-mono font-medium">{results.collateralAmount.toFixed(2)} {inputs.collateralToken}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <span className="text-slate-400 text-sm">Cost / Reward (Yearly)</span>
                <span className={`font-mono font-medium ${results.borrowCost < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {results.borrowCost < 0 ? '+' : '-'}{Math.abs(results.borrowCost).toFixed(2)} {inputs.debtToken}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400 text-sm">Current LTV</span>
                <span className={`font-mono font-bold ${results.ltv > inputs.liquidationThreshold - 5 ? 'text-red-400' : 'text-emerald-400'}`}>{results.ltv.toFixed(2)}%</span>
              </div>
            </div>

            {/* Risk Meter & Liquidation Price */}
            <div className="flex flex-col justify-between">
              <RiskMeter ltv={results.ltv} />
              
              <div className="mt-6 bg-slate-900/50 p-4 rounded-xl border border-red-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Liquidation Price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-white">
                        {results.liquidationPrice.toFixed(4)}
                      </span>
                      <span className="text-xs text-slate-500">{inputs.collateralToken}/{inputs.debtToken}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Current Price</p>
                     <span className="text-sm font-medium text-slate-300">{inputs.priceRatio.toFixed(4)}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Liquidation occurs if price drops by <span className="text-red-400 font-medium">{((1 - results.liquidationPrice / inputs.priceRatio) * 100).toFixed(2)}%</span>
                </div>
              </div>
              <div className="text-right mt-2 text-[10px] text-slate-600">
                  <p>Liquidation LTV: {inputs.liquidationThreshold}%</p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Calculator;