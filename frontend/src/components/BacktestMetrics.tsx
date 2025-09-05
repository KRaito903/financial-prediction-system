import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Label } from './ui/label';

interface BacktestMetrics {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
}

interface PortfolioValue {
    Date: string;
    portfolioValue: number;
}

interface BacktestResult {
    status: string;
    strategy?: {
        fastMaPeriod: number;
        slowMaPeriod: number;
    };
    profitFactor: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    data: PortfolioValue[];
    metrics: BacktestMetrics;
}

interface BacktestMetricsProps {
    result: BacktestResult | null;
}

const BacktestMetricsComponent: React.FC<BacktestMetricsProps> = ({ result }) => {
    if (!result || result.status !== "success") return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Backtest Metrics</CardTitle>
                <CardDescription>
                    Performance statistics from the backtest
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <Label className="text-sm font-medium">
                            Total Return
                        </Label>
                        <p className="text-2xl font-bold">
                            {result.metrics.totalReturn ? result.metrics.totalReturn.toFixed(2) : '0.00'}%
                        </p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">
                            Sharpe Ratio
                        </Label>
                        <p className="text-2xl font-bold">
                            {result.metrics.sharpeRatio ? result.metrics.sharpeRatio.toFixed(2) : '0.00'}
                        </p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">
                            Max Drawdown
                        </Label>
                        <p className="text-2xl font-bold">
                            {result.metrics.maxDrawdown ? result.metrics.maxDrawdown.toFixed(2) : '0.00'}%
                        </p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">
                            Win Rate
                        </Label>
                        <p className="text-2xl font-bold">
                            {result.metrics.winRate ? result.metrics.winRate.toFixed(2) : '0.00'}%
                        </p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">
                            Profit Factor
                        </Label>
                        <p className="text-2xl font-bold">
                            {result.profitFactor ? result.profitFactor.toFixed(2) : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">
                            Total Trades
                        </Label>
                        <p className="text-2xl font-bold">
                            {result.totalTrades ?? 0}
                        </p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">
                            Winning Trades
                        </Label>
                        <p className="text-2xl font-bold">
                            {result.winningTrades ?? 0}
                        </p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">
                            Losing Trades
                        </Label>
                        <p className="text-2xl font-bold">
                            {result.losingTrades ?? 0}
                        </p>
                    </div>
                </div>
                {result.strategy && (
                    <div className="mt-4">
                        <Label className="text-sm font-medium">
                            Strategy: Fast MA (
                            {result.strategy.fastMaPeriod}) / Slow MA (
                            {result.strategy.slowMaPeriod})
                        </Label>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default BacktestMetricsComponent;
