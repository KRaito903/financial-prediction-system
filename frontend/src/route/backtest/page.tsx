import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FETCH_TRADING_PAIRS,
} from "@/lib/queries";
import toast from "react-hot-toast";
import BacktestChart from "../../components/BacktestChart";
import BacktestMetricsComponent from "../../components/BacktestMetrics";
import HistoricalData from "../../components/HistoricalData";
import BacktestForm from "../../components/BacktestForm";

interface HistoricalBacktest {
	id: string;
	symbol: string;
	status: string;
	strategy?: {
		fastMaPeriod: number;
		slowMaPeriod: number;
	};
	profitFactor: number;
	totalTrades?: number;
	winningTrades?: number;
	losingTrades?: number;
	metrics: {
		totalReturn: number;
		sharpeRatio: number;
		maxDrawdown: number;
		winRate: number;
	};
	data: Array<{
		Date: string;
		portfolioValue: number;
		signal?: string;
	}>;
	createdAt: string;
	updatedAt: string;
}

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
	totalTrades: number;
	winningTrades: number;
	losingTrades: number;
	metrics: BacktestMetrics;
	data: PortfolioValue[];
}

const BacktestPage: React.FC = () => {
	const [backtestType, setBacktestType] = useState<
		"vectorized" | "event-driven" | "custom-model"
	>("vectorized");
	const [result, setResult] = useState<BacktestResult | null>(null);
	const [initCashValue, setInitCashValue] = useState(10000);
	const [coinList, setCoinList] = useState<string[]>([]);
	const [selectedHistoricalBacktest, setSelectedHistoricalBacktest] =
		useState<BacktestResult | null>(null);

	const {
		data,
		loading: queryLoading,
		error: queryError,
	} = useQuery(FETCH_TRADING_PAIRS);

	useEffect(() => {
		if (queryLoading) return;
		if (data?.fetchCoinList?.coins) {
			const coins = [...data.fetchCoinList.coins];
			setCoinList(coins.sort());
			toast.success("Trading pairs fetched successfully!");
		} else if (queryError) {
			console.error("Error fetching trading pairs:", queryError);
			toast.error("Failed to fetch trading pairs. Please try again.");
		}
	}, [data, queryLoading, queryError]);

	const handleHistoricalBacktestSelect = (backtest: HistoricalBacktest) => {
		// Transform the historical backtest data to match BacktestResult interface
		const transformedBacktest: BacktestResult = {
			status: backtest.status,
			strategy: backtest.strategy
				? {
						fastMaPeriod: backtest.strategy.fastMaPeriod,
						slowMaPeriod: backtest.strategy.slowMaPeriod,
				  }
				: undefined,
			data: backtest.data.map((item) => ({
				Date: item.Date,
				portfolioValue: item.portfolioValue,
				signal: item.signal || "hold", // Provide fallback
			})),
			profitFactor: backtest.profitFactor,
			totalTrades: backtest.totalTrades || 0,
			winningTrades: backtest.winningTrades || 0,
			losingTrades: backtest.losingTrades || 0,
			metrics: backtest.metrics,
		};
		setSelectedHistoricalBacktest(transformedBacktest);
		setInitCashValue(10000); // Reset to default or you could store the original initCash
	};

	const handleBacktestSubmit = (backtestResult: BacktestResult, initCash: number) => {
		setResult(backtestResult);
		setInitCashValue(initCash);
		// Clear historical backtest selection when new backtest is run
		setSelectedHistoricalBacktest(null);
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<HistoricalData onBacktestSelect={handleHistoricalBacktestSelect} />
			<Card>
				<CardHeader>
					<CardTitle>Backtesting Configuration</CardTitle>
					<CardDescription>
						Configure your backtest parameters and select the
						backtest type
					</CardDescription>
				</CardHeader>
				<CardContent>
					<BacktestForm
						backtestType={backtestType}
						setBacktestType={setBacktestType}
						coinList={coinList}
						onSubmit={handleBacktestSubmit}
					/>
				</CardContent>
			</Card>

			{result && (
				<div className="space-y-6">
					<BacktestMetricsComponent result={result} />
					<BacktestChart
						result={result}
						backtestType={backtestType}
						initCashValue={initCashValue}
					/>
				</div>
			)}

			{selectedHistoricalBacktest && !result && (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">
							Historical Backtest Results
						</h3>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSelectedHistoricalBacktest(null)}
						>
							Clear Selection
						</Button>
					</div>
					<BacktestMetricsComponent
						result={selectedHistoricalBacktest}
					/>
					<BacktestChart
						result={selectedHistoricalBacktest}
						backtestType="vectorized" // Default to vectorized for historical data
						initCashValue={initCashValue}
					/>
				</div>
			)}
		</div>
	);
};

export default BacktestPage;
