import React from 'react';
import { type TradeData } from '../types/chart';

interface TradeTableProps {
  trades: TradeData[];
  loading?: boolean;
}

const TradeTable: React.FC<TradeTableProps> = ({ trades, loading = false }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(4);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="text-sm font-medium text-gray-900">Recent Trades</h3>
      </div>

      {/* Table Header */}
      <div className="bg-white border-b">
        <div className="grid grid-cols-3 gap-4 px-4 py-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price</div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-gray-500">Loading trades...</span>
            </div>
          </div>
        ) : trades.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No trades yet</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {trades.map((trade, index) => (
              <div 
                key={`${trade.time}-${index}`}
                className="grid grid-cols-3 gap-4 px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                {/* Price - Green for buyer trades, Red for seller trades */}
                <div className={`text-sm font-medium ${
                  trade.isBuyerMaker ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${formatPrice(trade.price)}
                </div>
                
                {/* Amount */}
                <div className="text-sm text-gray-900">
                  {formatAmount(trade.amount)}
                </div>
                
                {/* Time */}
                <div className="text-sm text-gray-500">
                  {formatTime(trade.time)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeTable;