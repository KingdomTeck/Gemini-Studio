export interface CalculationResult {
  totalExposure: number; // Debt Token value
  collateralAmount: number; // Collateral Token amount
  totalDebt: number; // Debt Token amount
  ltv: number; // Loan to Value percentage
  liquidationPrice: number; // Estimated Collateral/Debt price where liquidation occurs
  grossYield: number; // Debt Token earned from supply
  borrowCost: number; // Debt Token paid for debt
  netEarned: number; // Net Debt Token profit
  netApy: number; // Net Annual Percentage Yield
}

export interface CalculatorState {
  initialDeposit: number;
  leverage: number; // Multiplier (e.g., 1x to 10x)
  priceRatio: number; // Price of Collateral / Price of Debt
  supplyApy: number; // e.g., 3%
  borrowApy: number; // e.g., 2%
  liquidationThreshold: number; // e.g. 85% LTV where liquidation happens
  collateralToken: string; // e.g. 'HASUI'
  debtToken: string; // e.g. 'SUI'
}