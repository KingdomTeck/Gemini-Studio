import React from 'react';

interface RiskMeterProps {
  ltv: number; // 0 to 100
}

const RiskMeter: React.FC<RiskMeterProps> = ({ ltv }) => {
  // Normalize LTV for display (usually maxes out around 90-95% in DeFi before liquidation)
  const percentage = Math.min(Math.max(ltv, 0), 100);
  
  // Determine color based on risk
  let colorClass = 'bg-emerald-500';
  let riskText = 'Low Risk';
  
  if (percentage > 60 && percentage <= 80) {
    colorClass = 'bg-yellow-500';
    riskText = 'Moderate Risk';
  } else if (percentage > 80) {
    colorClass = 'bg-red-500';
    riskText = 'High Risk';
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-sm text-slate-400">Liquidation Risk (LTV)</span>
        <span className={`text-sm font-bold ${percentage > 80 ? 'text-red-400' : 'text-slate-200'}`}>
          {ltv.toFixed(2)}%
        </span>
      </div>
      <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden relative">
        <div 
          className={`h-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Safe</span>
        <span className="text-slate-300 font-medium">{riskText}</span>
        <span>Risky</span>
      </div>
    </div>
  );
};

export default RiskMeter;