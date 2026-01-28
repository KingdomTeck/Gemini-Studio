import React, { useEffect, useState } from 'react';
import { SUPPORTED_TOKENS, FALLBACK_PRICES } from '../utils/marketData';
import { Activity, RefreshCw, WifiOff } from 'lucide-react';

interface PriceData {
  [key: string]: {
    usd: number;
  };
}

const LivePrices: React.FC = () => {
  const [prices, setPrices] = useState<PriceData>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const ids = SUPPORTED_TOKENS.map(t => t.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Ensure we have data for our tokens, if empty it implies failure or bad response
      if (Object.keys(data).length === 0) {
        throw new Error('Empty data received');
      }

      setPrices(data);
      setUsingFallback(false);
      setLastUpdated(new Date());
    } catch (error) {
      // Quietly fall back to default prices on any error (network, rate limit, timeout)
      setUsingFallback(true);
      
      // Construct price data structure from fallback
      const fallbackData: PriceData = {};
      SUPPORTED_TOKENS.forEach(t => {
        fallbackData[t.id] = { usd: FALLBACK_PRICES[t.id] || 0 };
      });
      setPrices(fallbackData);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 mt-8">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className={`w-5 h-5 ${usingFallback ? 'text-yellow-500' : 'text-emerald-400'}`} />
              Market Rates (USD)
            </h2>
            {usingFallback && (
              <span className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20">
                <WifiOff className="w-3 h-3" />
                Est. Data
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
             {lastUpdated && (
                <span className="text-xs text-slate-500 hidden sm:block">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
             )}
            <button 
              onClick={fetchPrices}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Prices"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {SUPPORTED_TOKENS.map((token) => {
            const price = prices[token.id]?.usd;
            return (
              <div 
                key={token.id} 
                className={`bg-slate-800 border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors ${usingFallback ? 'border-yellow-900/20' : 'border-slate-700 hover:border-blue-500/30'}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 mb-2 p-0.5 overflow-hidden ring-2 ring-slate-700/50">
                  <img 
                    src={token.logoUrl} 
                    alt={token.symbol} 
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.symbol}&background=334155&color=fff&size=64`;
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {token.symbol}
                </span>
                <span className={`text-lg font-mono font-medium ${usingFallback ? 'text-slate-300' : 'text-white'}`}>
                  {price !== undefined && price > 0
                    ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` 
                    : <span className="text-slate-600 text-sm">--</span>}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-600">
              {usingFallback 
                ? "Live prices unavailable. Showing estimated values."
                : "Data provided by CoinGecko API"
              }
            </p>
        </div>
      </div>
    </div>
  );
};

export default LivePrices;