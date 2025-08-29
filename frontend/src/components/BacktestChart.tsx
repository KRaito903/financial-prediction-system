import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PortfolioValue {
    Date: string;
    portfolioValue: number;
}

interface BacktestMetrics {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
}

interface BacktestResult {
    status: string;
    strategy?: {
        fastMaPeriod: number;
        slowMaPeriod: number;
    };
    profitFactor: number;
    totalTrades?: number;
    winningTrades?: number;
    losingTrades?: number;
    data: PortfolioValue[];
    metrics: BacktestMetrics;
}

interface BacktestChartProps {
    result: BacktestResult | null;
    backtestType: "vectorized" | "event-driven";
    initCashValue: number;
}

const BacktestChart: React.FC<BacktestChartProps> = ({ result, backtestType, initCashValue }) => {
    if (!result || result.status !== "success") return null;

    if (backtestType === "vectorized") {
        // Use index-based x-axis with numbers like 1, 2, etc.
        const chartData = result.data.map((item) => ({
            index: item.Date,
            portfolioValue: item.portfolioValue,
        }));

        return (
            <Card>
                <CardHeader>
                    <CardTitle>
                        Portfolio Value Over Time (Vectorized Backtest)
                    </CardTitle>
                    <CardDescription>
                        Line chart showing portfolio value for each day
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="index" />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(label) => `Point ${label}`}
                            />
                            <Line
                                type="monotone"
                                dataKey="portfolioValue"
                                stroke="#8884d8"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    } else {
        // For event-driven backtest, show bar chart with initial and final cash
        const initialCash = initCashValue; // Use dynamic initCash from form
        const finalCash =
            result.data.length > 0
                ? result.data[result.data.length - 1].portfolioValue
                : initialCash;
        const chartData = [
            { name: "Initial Cash", value: initialCash },
            { name: "Final Cash", value: finalCash },
        ];

        return (
            <Card>
                <CardHeader>
                    <CardTitle>
                        Cash Comparison (Event-Driven Backtest)
                    </CardTitle>
                    <CardDescription>
                        Bar chart showing initial vs final cash
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    }
};

export default BacktestChart;
