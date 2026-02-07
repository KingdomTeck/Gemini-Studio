import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorState, CalculationResult } from '../types';
import { Settings, TrendingUp, DollarSign, ShieldAlert, ChevronDown, ChevronUp, Loader2, Wallet } from 'lucide-react';
import RiskMeter from './RiskMeter';
import { MARKET_PRESETS, fetchLivePriceRatio } from '../utils/marketData';

const Calculator: React.FC = () => {
  const [strategyType, setStrategyType] = useState<string>('haSUI/SUI');
  
  const [inputs, setInputs] = useState<CalculatorState>({
    initialDeposit: 1000,
    leverage: 3,
    priceRatio: 1.0, // Default to 1:1 for soft peg initially
    supplyApy: 45.2,
    borrowApy: 1.0,
    liquidationThreshold: 90,
    collateralToken: 'haSUI',
    debtToken: 'SUI',
  });

  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load Strategy Data
  useEffect(() => {
    const loadStrategy = async () => {
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

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStrategyType(e.target.value);
  };

  // Core Calculation Logic (Matches Pebble Multiply / Loop logic)
  const results: CalculationResult = useMemo(() => {
    // 1. Total Assets (Exposure) = Initial Deposit * Leverage
    const totalExposure = inputs.initialDeposit * inputs.leverage;
    
    // 2. Amount of Collateral Token bought = Total Exposure / Price of Collateral (relative to debt)
    const collateralAmount = totalExposure / inputs.priceRatio;
    
    // 3. Total Debt = Total Exposure - Initial Deposit
    const totalDebt = totalExposure - inputs.initialDeposit;
    
    // 4. LTV = Debt / Exposure 
    // In a loop: LTV = (Lev - 1) / Lev. 
    // Example: 3x Leverage -> 200 Debt / 300 Assets = 66.6%
    const ltv = totalExposure > 0 ? (totalDebt / totalExposure) * 100 : 0;

    // 5. Liquidation Price
    // Liquidation occurs when LTV > LiquidationThreshold
    // Debt / (CollateralAmt * Price) = Threshold
    // Price = Debt / (CollateralAmt * Threshold)
    const thresholdDecimal = inputs.liquidationThreshold / 100;
    const liquidationPrice = (collateralAmount > 0 && thresholdDecimal > 0) 
      ? totalDebt / (collateralAmount * thresholdDecimal)
      : 0;

    // 6. Yields
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
    const floatVal = parseFloat(value);
    setInputs(prev => ({
      ...prev,
      [name]: isNaN(floatVal) ? 0 : floatVal
    }));
  };

  const handleLeverageChange = (val: number) => {
    const newLeverage = Math.min(Math.max(val, 1.0), 10); // Reverted max leverage to 10x
    setInputs(prev => ({ ...prev, leverage: newLeverage }));
  };

  const presetLeverages = [2, 3, 5, 8, 10];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      
      {/* CARD CONTAINER */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* HEADER / STRATEGY SELECTOR */}
        <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-500/20 rounded-lg">
               <Settings className="w-5 h-5 text-blue-400" />
             </div>
             <div>
               <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Strategy</label>
               <select 
                 value={strategyType}
                 onChange={handleStrategyChange}
                 className="bg-transparent text-white font-semibold text-lg outline-none cursor-pointer hover:text-blue-400 transition-colors"
               >
                 {Object.keys(MARKET_PRESETS).map(key => (
                   <option key={key} value={key} className="bg-slate-800 text-white">{MARKET_PRESETS[key].name} ({key})</option>
                 ))}
               </select>
             </div>
          </div>
          
          {isLoadingPrices && (
            <span className="flex items-center gap-2 text-xs text-blue-400 animate-pulse bg-blue-500/10 px-3 py-1 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" /> Live Data
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* LEFT: INPUTS */}
          <div className="p-6 md:p-8 space-y-8 border-b md:border-b-0 md:border-r border-slate-700">
            
            {/* 1. CAPITAL INPUT */}
            <div>
              <label className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-3">
                <Wallet className="w-4 h-4" />
                Your Investment Capital
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">
                  {inputs.debtToken}
                </div>
                <input
                  type="number"
                  name="initialDeposit"
                  value={inputs.initialDeposit}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-2xl py-6 pl-16 pr-4 text-white text-3xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-700"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* 2. LEVERAGE SLIDER */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-slate-400 text-sm font-medium">Leverage</label>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all hover:border-slate-600">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={inputs.leverage}
                    onChange={(e) => {
                       const val = parseFloat(e.target.value);
                       if(!isNaN(val) && val >= 1 && val <= 10) {
                           setInputs(prev => ({...prev, leverage: val}));
                       }
                    }}
                    className="w-20 bg-transparent text-blue-400 font-bold text-xl text-right outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-blue-400 font-bold text-xl select-none">x</span>
                </div>
              </div>
              
              <input
                type="range"
                min="1.0"
                max="10"
                step="0.1"
                value={inputs.leverage}
                onChange={(e) => handleLeverageChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all mb-4"
              />

              <div className="flex justify-between gap-2">
                {presetLeverages.map(lev => (
                  <button
                    key={lev}
                    onClick={() => handleLeverageChange(lev)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      Math.abs(inputs.leverage - lev) < 0.5
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-slate-900 text-slate-500 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>

            {/* ADVANCED TOGGLE */}
            <div>
               <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-300 transition-colors"
                >
                  {showAdvanced ? "Hide Protocol Rates" : "Edit Protocol Rates & Prices"}
                  {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
               </button>
               
               {showAdvanced && (
                 <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Supply APY</label>
                      <input 
                        type="number" 
                        name="supplyApy"
                        value={inputs.supplyApy}
                        onChange={handleInputChange}
                        className="w-full bg-transparent text-white font-mono text-sm outline-none" 
                      />
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Borrow APY</label>
                      <input 
                         type="number" 
                         name="borrowApy"
                         value={inputs.borrowApy}
                         onChange={handleInputChange}
                         className="w-full bg-transparent text-white font-mono text-sm outline-none" 
                       />
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Price Ratio</label>
                      <input 
                         type="number" 
                         name="priceRatio"
                         value={inputs.priceRatio}
                         onChange={handleInputChange}
                         className="w-full bg-transparent text-white font-mono text-sm outline-none" 
                       />
                    </div>
                 </div>
               )}
            </div>
          </div>

          {/* RIGHT: RESULTS */}
          <div className="bg-slate-900/30 p-6 md:p-8 flex flex-col justify-center">
            
            <div className="space-y-6">
              {/* PRIMARY OUTPUT: PROFIT */}
              <div className="text-center">
                 <p className="text-slate-400 font-medium mb-2 flex items-center justify-center gap-2">
                   <DollarSign className="w-5 h-5 text-emerald-400" />
                   Projected Yearly Profit
                 </p>
                 <div className={`text-5xl md:text-6xl font-bold tracking-tight mb-2 ${results.netEarned >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                   {results.netEarned.toLocaleString(undefined, {maximumFractionDigits: 0})}
                   <span className="text-lg md:text-xl text-slate-500 font-medium ml-2">{inputs.debtToken}</span>
                 </div>
                 <div className="inline-flex items-center gap-2 bg-slate-800 rounded-full px-4 py-1 text-sm text-slate-300 border border-slate-700">
                    <span>Net APY</span>
                    <span className={`font-bold ${results.netApy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {results.netApy.toFixed(2)}%
                    </span>
                 </div>
              </div>

              {/* SECONDARY STATS */}
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-400">Total Exposure</span>
                   <span className="text-white font-mono">{results.totalExposure.toLocaleString()} {inputs.debtToken}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-400">Total Debt</span>
                   <span className="text-white font-mono">{results.totalDebt.toLocaleString()} {inputs.debtToken}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700/50">
                   <span className="text-slate-400">Daily Profit</span>
                   <span className={`font-mono ${(results.netEarned / 365) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                     +{(results.netEarned / 365).toFixed(2)} {inputs.debtToken}
                   </span>
                 </div>
              </div>

              {/* RISK METER */}
              <div>
                 <RiskMeter ltv={results.ltv} />
                 <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                       <ShieldAlert className="w-3 h-3" />
                       Liq. Price: <span className="text-slate-300 font-mono">{results.liquidationPrice.toFixed(4)}</span>
                    </span>
                    <span>Max LTV: {inputs.liquidationThreshold}%</span>
                 </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;