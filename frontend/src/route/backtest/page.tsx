import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
} from "recharts";
import {
	RUN_VECTORIZED_BACKTEST,
	RUN_EVENT_DRIVEN_BACKTEST,
} from "@/lib/queries";

interface OHLCVData {
	Date: string;
	Open: number;
	High: number;
	Low: number;
	Close: number;
	Volume: number;
}

interface BacktestFormData {
	userId: string;
	symbol: string;
	data: OHLCVData[];
	fastMAPeriod: number;
	slowMAPeriod: number;
	period: string;
	initCash: number;
	fees: number;
	slippage: number;
	fixedSize?: number;
	percentSize?: number;
	useFallback: boolean;
}

interface PortfolioValue {
    Date: string;
    portfolioValue: number;
}

interface BacktestMetrics {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    totalTrades?: number;
    winningTrades?: number;
    losingTrades?: number;
}

interface BacktestResult {
    status: string;
    strategy?: {
        fastMaPeriod: number;
        slowMaPeriod: number;
    };
    data: PortfolioValue[];
    metrics: BacktestMetrics;
}

const BacktestPage: React.FC = () => {
	const [backtestType, setBacktestType] = useState<
		"vectorized" | "event-driven"
	>("vectorized");
	const [result, setResult] = useState<BacktestResult | null>(null);
	const [loading, setLoading] = useState(false);

	const [runVectorizedBacktest] = useMutation(RUN_VECTORIZED_BACKTEST);
	const [runEventDrivenBacktest] = useMutation(RUN_EVENT_DRIVEN_BACKTEST);

	const form = useForm<BacktestFormData>({
		defaultValues: {
			userId: "test-user",
			symbol: "AAPL",
			data: [],
			fastMAPeriod: 20,
			slowMAPeriod: 50,
			period: "1D",
			initCash: 10000,
			fees: 0.001,
			slippage: 0.001,
			useFallback: true,
		},
	});

	// Sample data for demonstration - in a real app, this would come from Binance API from the graph
	const sampleData: OHLCVData[] = [
		{
			Date: "2023-01-27",
			Open: 109.23,
			High: 109.72,
			Low: 109.04,
			Close: 109.22,
			Volume: 1393,
		},
		{
			Date: "2023-01-28",
			Open: 109.22,
			High: 112.57,
			Low: 109.03,
			Close: 110.5,
			Volume: 1418,
		},
		{
			Date: "2023-01-29",
			Open: 110.5,
			High: 113.27,
			Low: 108.63,
			Close: 113.25,
			Volume: 1380,
		},
		{
			Date: "2023-01-30",
			Open: 113.25,
			High: 113.32,
			Low: 110.29,
			Close: 113.08,
			Volume: 1230,
		},
		{
			Date: "2023-01-31",
			Open: 113.08,
			High: 113.62,
			Low: 112.62,
			Close: 112.91,
			Volume: 1343,
		},
		{
			Date: "2023-02-01",
			Open: 112.91,
			High: 115.85,
			Low: 111.57,
			Close: 115.81,
			Volume: 1791,
		},
		{
			Date: "2023-02-02",
			Open: 115.81,
			High: 118.26,
			Low: 114.47,
			Close: 117.37,
			Volume: 1656,
		},
		{
			Date: "2023-02-03",
			Open: 117.37,
			High: 118.3,
			Low: 115.72,
			Close: 116.78,
			Volume: 1420,
		},
		{
			Date: "2023-02-04",
			Open: 116.78,
			High: 119.61,
			Low: 115.15,
			Close: 117.96,
			Volume: 1521,
		},
		{
			Date: "2023-02-05",
			Open: 117.96,
			High: 119.13,
			Low: 116.71,
			Close: 117.38,
			Volume: 1224,
		},
		{
			Date: "2023-02-06",
			Open: 117.38,
			High: 119.38,
			Low: 115.78,
			Close: 116.8,
			Volume: 1209,
		},
		{
			Date: "2023-02-07",
			Open: 116.8,
			High: 119.27,
			Low: 116.72,
			Close: 117.45,
			Volume: 1587,
		},
		{
			Date: "2023-02-08",
			Open: 117.45,
			High: 118.07,
			Low: 113.26,
			Close: 114.32,
			Volume: 1432,
		},
		{
			Date: "2023-02-09",
			Open: 114.32,
			High: 115.2,
			Low: 111.23,
			Close: 111.59,
			Volume: 1754,
		},
		{
			Date: "2023-02-10",
			Open: 111.59,
			High: 111.99,
			Low: 110.25,
			Close: 110.87,
			Volume: 1595,
		},
		{
			Date: "2023-02-11",
			Open: 110.87,
			High: 111.12,
			Low: 107.97,
			Close: 109.41,
			Volume: 1517,
		},
		{
			Date: "2023-02-12",
			Open: 109.41,
			High: 110.5,
			Low: 109.18,
			Close: 110.14,
			Volume: 1738,
		},
		{
			Date: "2023-02-13",
			Open: 110.14,
			High: 110.42,
			Low: 108.0,
			Close: 108.86,
			Volume: 1403,
		},
		{
			Date: "2023-02-14",
			Open: 108.86,
			High: 110.26,
			Low: 105.84,
			Close: 106.77,
			Volume: 1738,
		},
		{
			Date: "2023-02-15",
			Open: 106.77,
			High: 109.18,
			Low: 106.4,
			Close: 108.91,
			Volume: 1585,
		},
		{
			Date: "2023-02-16",
			Open: 108.91,
			High: 109.16,
			Low: 107.4,
			Close: 108.32,
			Volume: 1205,
		},
		{
			Date: "2023-02-17",
			Open: 108.32,
			High: 108.64,
			Low: 107.44,
			Close: 108.21,
			Volume: 1203,
		},
		{
			Date: "2023-02-18",
			Open: 108.21,
			High: 108.4,
			Low: 104.38,
			Close: 105.68,
			Volume: 1615,
		},
		{
			Date: "2023-02-19",
			Open: 105.68,
			High: 106.93,
			Low: 103.92,
			Close: 104.61,
			Volume: 1627,
		},
		{
			Date: "2023-02-20",
			Open: 104.61,
			High: 105.4,
			Low: 103.4,
			Close: 104.58,
			Volume: 1647,
		},
		{
			Date: "2023-02-21",
			Open: 104.58,
			High: 105.58,
			Low: 102.13,
			Close: 102.56,
			Volume: 1594,
		},
		{
			Date: "2023-02-22",
			Open: 102.56,
			High: 103.82,
			Low: 102.41,
			Close: 102.93,
			Volume: 1420,
		},
		{
			Date: "2023-02-23",
			Open: 102.93,
			High: 103.84,
			Low: 100.96,
			Close: 101.8,
			Volume: 1783,
		},
		{
			Date: "2023-02-24",
			Open: 101.8,
			High: 102.69,
			Low: 100.91,
			Close: 101.15,
			Volume: 1578,
		},
		{
			Date: "2023-02-25",
			Open: 101.15,
			High: 101.16,
			Low: 98.58,
			Close: 100.04,
			Volume: 1546,
		},
		{
			Date: "2023-02-26",
			Open: 100.04,
			High: 104.05,
			Low: 100.01,
			Close: 102.62,
			Volume: 1633,
		},
		{
			Date: "2023-02-27",
			Open: 102.62,
			High: 103.72,
			Low: 101.9,
			Close: 102.39,
			Volume: 1764,
		},
		{
			Date: "2023-02-28",
			Open: 102.39,
			High: 102.52,
			Low: 99.81,
			Close: 100.56,
			Volume: 1779,
		},
		{
			Date: "2023-03-01",
			Open: 100.56,
			High: 102.46,
			Low: 99.03,
			Close: 101.6,
			Volume: 1710,
		},
		{
			Date: "2023-03-02",
			Open: 101.6,
			High: 102.53,
			Low: 99.02,
			Close: 99.54,
			Volume: 1534,
		},
		{
			Date: "2023-03-03",
			Open: 99.54,
			High: 99.82,
			Low: 99.16,
			Close: 99.65,
			Volume: 1542,
		},
		{
			Date: "2023-03-04",
			Open: 99.65,
			High: 99.88,
			Low: 95.73,
			Close: 96.52,
			Volume: 1794,
		},
		{
			Date: "2023-03-05",
			Open: 96.52,
			High: 96.58,
			Low: 93.31,
			Close: 94.4,
			Volume: 1726,
		},
		{
			Date: "2023-03-06",
			Open: 94.4,
			High: 95.31,
			Low: 93.39,
			Close: 94.49,
			Volume: 1621,
		},
		{
			Date: "2023-03-07",
			Open: 94.49,
			High: 96.85,
			Low: 93.6,
			Close: 95.54,
			Volume: 1685,
		},
		{
			Date: "2023-03-08",
			Open: 95.54,
			High: 96.08,
			Low: 95.29,
			Close: 95.79,
			Volume: 1747,
		},
		{
			Date: "2023-03-09",
			Open: 95.79,
			High: 96.28,
			Low: 91.93,
			Close: 95.62,
			Volume: 1678,
		},
		{
			Date: "2023-03-10",
			Open: 95.62,
			High: 96.89,
			Low: 94.25,
			Close: 95.19,
			Volume: 1677,
		},
		{
			Date: "2023-03-11",
			Open: 95.19,
			High: 95.49,
			Low: 92.37,
			Close: 93.08,
			Volume: 1425,
		},
		{
			Date: "2023-03-12",
			Open: 93.08,
			High: 93.23,
			Low: 91.28,
			Close: 92.07,
			Volume: 1221,
		},
		{
			Date: "2023-03-13",
			Open: 92.07,
			High: 94.19,
			Low: 89.73,
			Close: 91.44,
			Volume: 1371,
		},
		{
			Date: "2023-03-14",
			Open: 91.44,
			High: 93.27,
			Low: 91.37,
			Close: 92.89,
			Volume: 1222,
		},
		{
			Date: "2023-03-15",
			Open: 92.89,
			High: 93.8,
			Low: 91.88,
			Close: 93.36,
			Volume: 1276,
		},
		{
			Date: "2023-03-16",
			Open: 93.36,
			High: 94.8,
			Low: 90.78,
			Close: 90.9,
			Volume: 1329,
		},
		{
			Date: "2023-03-17",
			Open: 90.9,
			High: 92.01,
			Low: 90.7,
			Close: 91.34,
			Volume: 1231,
		},
		{
			Date: "2023-03-18",
			Open: 91.34,
			High: 93.52,
			Low: 89.13,
			Close: 90.81,
			Volume: 1582,
		},
		{
			Date: "2023-03-19",
			Open: 90.81,
			High: 92.64,
			Low: 89.72,
			Close: 89.89,
			Volume: 1677,
		},
		{
			Date: "2023-03-20",
			Open: 89.89,
			High: 91.11,
			Low: 88.38,
			Close: 90.71,
			Volume: 1247,
		},
		{
			Date: "2023-03-21",
			Open: 90.71,
			High: 92.58,
			Low: 89.92,
			Close: 92.12,
			Volume: 1445,
		},
		{
			Date: "2023-03-22",
			Open: 92.12,
			High: 93.71,
			Low: 91.83,
			Close: 93.4,
			Volume: 1350,
		},
		{
			Date: "2023-03-23",
			Open: 93.4,
			High: 95.04,
			Low: 91.85,
			Close: 92.23,
			Volume: 1596,
		},
		{
			Date: "2023-03-24",
			Open: 92.23,
			High: 92.58,
			Low: 90.28,
			Close: 91.8,
			Volume: 1567,
		},
		{
			Date: "2023-03-25",
			Open: 91.8,
			High: 93.65,
			Low: 91.35,
			Close: 92.25,
			Volume: 1413,
		},
		{
			Date: "2023-03-26",
			Open: 92.25,
			High: 93.82,
			Low: 90.51,
			Close: 93.6,
			Volume: 1258,
		},
		{
			Date: "2023-03-27",
			Open: 93.6,
			High: 96.63,
			Low: 92.25,
			Close: 93.21,
			Volume: 1303,
		},
		{
			Date: "2023-03-28",
			Open: 93.21,
			High: 95.09,
			Low: 92.0,
			Close: 93.23,
			Volume: 1569,
		},
		{
			Date: "2023-03-29",
			Open: 93.23,
			High: 93.64,
			Low: 91.85,
			Close: 91.97,
			Volume: 1424,
		},
		{
			Date: "2023-03-30",
			Open: 91.97,
			High: 92.02,
			Low: 88.45,
			Close: 90.59,
			Volume: 1713,
		},
		{
			Date: "2023-03-31",
			Open: 90.59,
			High: 92.87,
			Low: 90.17,
			Close: 91.97,
			Volume: 1242,
		},
		{
			Date: "2023-04-01",
			Open: 91.97,
			High: 94.3,
			Low: 91.91,
			Close: 94.11,
			Volume: 1551,
		},
		{
			Date: "2023-04-02",
			Open: 94.11,
			High: 94.4,
			Low: 93.49,
			Close: 94.29,
			Volume: 1432,
		},
		{
			Date: "2023-04-03",
			Open: 94.29,
			High: 96.59,
			Low: 92.28,
			Close: 96.0,
			Volume: 1527,
		},
		{
			Date: "2023-04-04",
			Open: 96.0,
			High: 96.96,
			Low: 95.43,
			Close: 96.81,
			Volume: 1776,
		},
		{
			Date: "2023-04-05",
			Open: 96.81,
			High: 97.28,
			Low: 95.96,
			Close: 96.16,
			Volume: 1391,
		},
		{
			Date: "2023-04-06",
			Open: 96.16,
			High: 97.54,
			Low: 95.34,
			Close: 96.97,
			Volume: 1270,
		},
		{
			Date: "2023-04-07",
			Open: 96.97,
			High: 100.44,
			Low: 95.54,
			Close: 99.5,
			Volume: 1726,
		},
		{
			Date: "2023-04-08",
			Open: 99.5,
			High: 100.55,
			Low: 98.87,
			Close: 99.74,
			Volume: 1369,
		},
		{
			Date: "2023-04-09",
			Open: 99.74,
			High: 102.94,
			Low: 99.02,
			Close: 102.38,
			Volume: 1684,
		},
		{
			Date: "2023-04-10",
			Open: 102.38,
			High: 102.4,
			Low: 98.55,
			Close: 98.67,
			Volume: 1423,
		},
		{
			Date: "2023-04-11",
			Open: 98.67,
			High: 100.85,
			Low: 97.51,
			Close: 100.18,
			Volume: 1758,
		},
		{
			Date: "2023-04-12",
			Open: 100.18,
			High: 100.83,
			Low: 99.08,
			Close: 100.61,
			Volume: 1650,
		},
		{
			Date: "2023-04-13",
			Open: 100.61,
			High: 101.02,
			Low: 100.2,
			Close: 100.46,
			Volume: 1741,
		},
		{
			Date: "2023-04-14",
			Open: 100.46,
			High: 102.21,
			Low: 100.44,
			Close: 100.9,
			Volume: 1392,
		},
		{
			Date: "2023-04-15",
			Open: 100.9,
			High: 101.14,
			Low: 97.34,
			Close: 98.19,
			Volume: 1206,
		},
		{
			Date: "2023-04-16",
			Open: 98.19,
			High: 98.51,
			Low: 97.59,
			Close: 97.72,
			Volume: 1770,
		},
		{
			Date: "2023-04-17",
			Open: 97.72,
			High: 99.97,
			Low: 96.68,
			Close: 98.1,
			Volume: 1469,
		},
		{
			Date: "2023-04-18",
			Open: 98.1,
			High: 101.13,
			Low: 96.9,
			Close: 100.13,
			Volume: 1603,
		},
		{
			Date: "2023-04-19",
			Open: 100.13,
			High: 100.9,
			Low: 98.54,
			Close: 99.2,
			Volume: 1673,
		},
		{
			Date: "2023-04-20",
			Open: 99.2,
			High: 99.21,
			Low: 96.97,
			Close: 97.85,
			Volume: 1234,
		},
		{
			Date: "2023-04-21",
			Open: 97.85,
			High: 99.89,
			Low: 95.24,
			Close: 96.96,
			Volume: 1732,
		},
		{
			Date: "2023-04-22",
			Open: 96.96,
			High: 98.96,
			Low: 96.65,
			Close: 98.15,
			Volume: 1285,
		},
		{
			Date: "2023-04-23",
			Open: 98.15,
			High: 99.09,
			Low: 96.81,
			Close: 98.49,
			Volume: 1260,
		},
		{
			Date: "2023-04-24",
			Open: 98.49,
			High: 98.73,
			Low: 97.06,
			Close: 97.56,
			Volume: 1243,
		},
		{
			Date: "2023-04-25",
			Open: 97.56,
			High: 98.71,
			Low: 96.71,
			Close: 98.16,
			Volume: 1248,
		},
		{
			Date: "2023-04-26",
			Open: 98.16,
			High: 99.58,
			Low: 96.78,
			Close: 98.16,
			Volume: 1687,
		},
		{
			Date: "2023-04-27",
			Open: 98.16,
			High: 100.1,
			Low: 96.82,
			Close: 99.44,
			Volume: 1250,
		},
		{
			Date: "2023-04-28",
			Open: 99.44,
			High: 99.75,
			Low: 96.78,
			Close: 98.24,
			Volume: 1454,
		},
		{
			Date: "2023-04-29",
			Open: 98.24,
			High: 98.54,
			Low: 97.61,
			Close: 97.61,
			Volume: 1481,
		},
		{
			Date: "2023-04-30",
			Open: 97.61,
			High: 97.92,
			Low: 96.09,
			Close: 96.89,
			Volume: 1647,
		},
		{
			Date: "2023-05-01",
			Open: 96.89,
			High: 97.36,
			Low: 94.53,
			Close: 94.62,
			Volume: 1424,
		},
		{
			Date: "2023-05-02",
			Open: 94.62,
			High: 95.55,
			Low: 94.24,
			Close: 94.9,
			Volume: 1334,
		},
		{
			Date: "2023-05-03",
			Open: 94.9,
			High: 95.19,
			Low: 93.97,
			Close: 95.12,
			Volume: 1795,
		},
		{
			Date: "2023-05-04",
			Open: 95.12,
			High: 95.21,
			Low: 94.26,
			Close: 94.99,
			Volume: 1781,
		},
		{
			Date: "2023-05-05",
			Open: 94.99,
			High: 97.15,
			Low: 94.13,
			Close: 94.51,
			Volume: 1617,
		},
	];

	const onSubmit = async (data: BacktestFormData) => {
		setLoading(true);
		try {
			const input = {
				userId: data.userId,
				symbol: data.symbol,
				data: sampleData, // Using sample data for now
				maCrossoverParams: {
					fast: data.fastMAPeriod,
					slow: data.slowMAPeriod,
				},
				period: data.period,
				initCash: data.initCash,
				fees: data.fees,
				slippage: data.slippage,
				fixedSize: data.fixedSize || null,
				percentSize: data.percentSize || null,
				useFallback: data.useFallback,
			};

			let response;
			if (backtestType === "vectorized") {
				response = await runVectorizedBacktest({
					variables: { input },
				});
			} else {
				response = await runEventDrivenBacktest({
					variables: { input },
				});
			}

			if (response.data) {
				const resultKey =
					backtestType === "vectorized"
						? "runVectorizedBacktest"
						: "runEventDrivenBacktest";
				setResult(response.data[resultKey]);
			}
		} catch (error) {
			console.error("Backtest error:", error);
		} finally {
			setLoading(false);
		}
	};

	const renderChart = () => {
    if (!result || result.status !== "success") return null;

    if (backtestType === "vectorized") {
        // Map result.data to use actual dates from sampleData
        const chartData = result.data.map((item, index) => ({
            Date: sampleData[index]?.Date || item.Date,
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
                            <XAxis dataKey="Date" />
                            <YAxis />
                            <Tooltip />
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
        const initialCash = 10000; // This should come from the form data
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

	const renderMetrics = () => {
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
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						<div>
							<Label className="text-sm font-medium">
								Total Return
							</Label>
							<p className="text-2xl font-bold">
								{result.metrics.totalReturn.toFixed(2)}%
							</p>
						</div>
						<div>
							<Label className="text-sm font-medium">
								Sharpe Ratio
							</Label>
							<p className="text-2xl font-bold">
								{result.metrics.sharpeRatio.toFixed(2)}
							</p>
						</div>
						<div>
							<Label className="text-sm font-medium">
								Max Drawdown
							</Label>
							<p className="text-2xl font-bold">
								{result.metrics.maxDrawdown.toFixed(2)}%
							</p>
						</div>
						<div>
							<Label className="text-sm font-medium">
								Win Rate
							</Label>
							<p className="text-2xl font-bold">
								{result.metrics.winRate.toFixed(2)}%
							</p>
						</div>
						<div>
							<Label className="text-sm font-medium">
								Profit Factor
							</Label>
							<p className="text-2xl font-bold">
								{result.metrics.profitFactor.toFixed(2)}
							</p>
						</div>
						<div>
							<Label className="text-sm font-medium">
								Total Trades
							</Label>
							<p className="text-2xl font-bold">
								{result.metrics.totalTrades || 0}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Backtesting Configuration</CardTitle>
					<CardDescription>
						Configure your backtest parameters and select the
						backtest type
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-6"
						>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label>Backtest Type</Label>
									<Select
										onValueChange={(
											value: "vectorized" | "event-driven"
										) => setBacktestType(value)}
										defaultValue={backtestType}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select backtest type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="vectorized">
												Vectorized Backtest
											</SelectItem>
											<SelectItem value="event-driven">
												Event-Driven Backtest
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<FormField
									control={form.control}
									name="symbol"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Symbol</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g., AAPL"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<FormField
									control={form.control}
									name="fastMAPeriod"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Fast MA Period
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													{...field}
													onChange={(e) =>
														field.onChange(
															parseInt(
																e.target.value
															)
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="slowMAPeriod"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Slow MA Period
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													{...field}
													onChange={(e) =>
														field.onChange(
															parseInt(
																e.target.value
															)
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<FormField
									control={form.control}
									name="initCash"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Initial Cash</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													{...field}
													onChange={(e) =>
														field.onChange(
															parseFloat(
																e.target.value
															)
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="fees"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Fees</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.001"
													{...field}
													onChange={(e) =>
														field.onChange(
															parseFloat(
																e.target.value
															)
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="slippage"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Slippage</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.001"
													{...field}
													onChange={(e) =>
														field.onChange(
															parseFloat(
																e.target.value
															)
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<Button
								type="submit"
								disabled={loading}
								className="w-full"
							>
								{loading
									? "Running Backtest..."
									: "Run Backtest"}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>

			{result && (
				<div className="space-y-6">
					{renderMetrics()}
					{renderChart()}
				</div>
			)}
		</div>
	);
};

export default BacktestPage;