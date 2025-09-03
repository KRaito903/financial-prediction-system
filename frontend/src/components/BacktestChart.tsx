import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PortfolioValue {
    Date: string;
    portfolioValue: number;
    signal?: string;
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
    backtestType: "vectorized" | "event-driven" | "custom-model";
    initCashValue: number;
}

const BacktestChart: React.FC<BacktestChartProps> = ({ result, backtestType, initCashValue }) => {
    if (!result || result.status !== "success") return null;
    if (backtestType === "vectorized" || backtestType === "custom-model") {
        // Use signal field to determine colors
        const chartData = result.data.map((item) => {
            let color = "#8884d8"; // default blue for hold
            if (item.signal === "buy") {
                color = "#00ff00"; // green for buy
            } else if (item.signal === "sell") {
                color = "#ff0000"; // red for sell
            }
            
            return {
                index: item.Date,
                portfolioValue: item.portfolioValue,
                color,
                signal: item.signal || "hold",
            };
        });

        const CustomDot = (props: { cx?: number; cy?: number; payload?: { color: string; signal: string } }) => {
            const { cx, cy, payload } = props;
            if (!cx || !cy || !payload) return null;
            
            // Make buy/sell signals more prominent
            const radius = payload.signal === "buy" || payload.signal === "sell" ? 6 : 3;
            
            return <circle cx={cx} cy={cy} r={radius} fill={payload.color} stroke="#333" strokeWidth={1} />;
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>
                        Portfolio Value Over Time ({backtestType === "vectorized" ? "Vectorized" : "Custom Model"} Backtest)
                    </CardTitle>
                    <CardDescription>
                        Line chart showing portfolio value for each day. Green dots indicate buy signals, red dots indicate sell signals, blue for hold positions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="index" />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(label) => `Date: ${label}`}
                                formatter={(value, _name, props) => [
                                    value,
                                    `Portfolio Value (Signal: ${props.payload?.signal || 'hold'})`
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="portfolioValue"
                                stroke="#cccccc"
                                strokeWidth={1}
                                dot={<CustomDot />}
                                activeDot={{ r: 6 }}
                                connectNulls={false}
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
