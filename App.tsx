import React from 'react';
import Calculator from './components/Calculator';
import LivePrices from './components/LivePrices';
import { Calculator as CalculatorIcon } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 pb-12">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
               <CalculatorIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Pebble<span className="text-blue-500">Calc</span>
            </span>
          </div>
          
          <nav className="flex gap-4">
             <a href="https://pebble-finance.gitbook.io/" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">Pebble Docs</a>
             <a href="https://beta.pebble-finance.com/multiply" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">Launch Pebble</a>
          </nav>
        </div>
      </header>

      {/* Hero / Intro */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Multiply Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">SUI Yield</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Easily calculate your potential profits, risks, and net APY instantly for Pebble Finance Multiply mechanics.
        </p>
      </div>

      {/* Main Content */}
      <main>
        <Calculator />
        <LivePrices />
      </main>
      
      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 mt-12 py-8 border-t border-slate-800 text-center">
        <p className="text-slate-500 text-sm">
          Disclaimer: This calculator is for informational purposes only. DeFi involves risks including liquidation. 
          Rates are subject to market fluctuations.
        </p>
      </footer>
    </div>
  );
};

export default App;