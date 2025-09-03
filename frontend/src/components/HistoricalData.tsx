import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { FETCH_BACKTEST_HISTORY } from "@/lib/queries";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

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
	}>;
	createdAt: string;
	updatedAt: string;
}interface HistoricalDataProps {
	onBacktestSelect?: (backtest: HistoricalBacktest) => void;
}

const HistoricalData: React.FC<HistoricalDataProps> = ({
	onBacktestSelect,
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const { data, loading, error } = useQuery(FETCH_BACKTEST_HISTORY, {
		variables: {
			input: {
				userId: useAuth().user?.id || "test-user"
			},
		},
		skip: !isOpen, // Only fetch when panel is open
	});

	const historicalBacktests: HistoricalBacktest[] =
		data?.fetchBacktestHistory || [];

	return (
		<>
			{/* Hamburger Menu Button */}
			<Button
				variant="outline"
				size="icon"
				className="fixed top-4 right-4 z-50"
				onClick={() => setIsOpen(true)}
			>
				<Menu className="h-4 w-4" />
			</Button>

			{/* Side Panel */}
			{isOpen && (
				<div className="fixed inset-0 z-40 flex">
					{/* Overlay */}
					<div
						className="absolute inset-0 bg-black/50 h-dvh"
						onClick={() => setIsOpen(false)}
					/>

					{/* Panel */}
					<div className="relative ml-auto h-screen w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b flex-shrink-0">
							<h2 className="text-lg font-semibold">
								Backtest History
							</h2>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsOpen(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* Content */}
						<div className="p-4 overflow-y-auto flex-1">
							{loading && (
								<div className="text-center py-8">
									<p>Loading historical backtests...</p>
								</div>
							)}

							{error && (
								<div className="text-center py-8 text-red-600">
									<p>Error loading backtest history</p>
									<p className="text-sm">{error.message}</p>
								</div>
							)}

							{!loading &&
								!error &&
								historicalBacktests.length === 0 && (
									<div className="text-center py-8 text-gray-500">
										<p>No historical backtests found</p>
									</div>
								)}

							<div className="space-y-4">
								{historicalBacktests.map((backtest, index) => (
									<Card
										key={index}
										className="cursor-pointer hover:shadow-md transition-shadow"
										onClick={() =>
											onBacktestSelect?.(backtest)
										}
									>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm">
												MA Crossover Strategy
											</CardTitle>
											<p className="text-xs text-gray-500">
												{backtest.createdAt
													? format(
															new Date(
																backtest.createdAt
															),
															"PPP"
													  )
													: "Date not available"}
											</p>
										</CardHeader>
										<CardContent className="space-y-2">
											<div className="grid grid-cols-2 gap-2 text-xs">
												<div>
													<span className="font-medium">
														Fast MA:
													</span>{" "}
													{backtest.strategy
														?.fastMaPeriod || "N/A"}
												</div>
												<div>
													<span className="font-medium">
														Slow MA:
													</span>{" "}
													{backtest.strategy
														?.slowMaPeriod || "N/A"}
												</div>
											</div>

											<div className="grid grid-cols-2 gap-2 text-xs">
												<div>
													<span className="font-medium">
														Total Return:
													</span>{" "}
													<span
														className={
															backtest.metrics
																.totalReturn >=
															0
																? "text-green-600"
																: "text-red-600"
														}
													>
														{backtest.metrics.totalReturn.toFixed(
															2
														)}
														%
													</span>
												</div>
												<div>
													<span className="font-medium">
														Sharpe Ratio:
													</span>{" "}
													{backtest.metrics.sharpeRatio.toFixed(
														2
													)}
												</div>
											</div>

											<div className="grid grid-cols-2 gap-2 text-xs">
												<div>
													<span className="font-medium">
														Win Rate:
													</span>{" "}
													{backtest.metrics.winRate.toFixed(
														2
													)}
													%
												</div>
												<div>
													<span className="font-medium">
														Max Drawdown:
													</span>{" "}
													{backtest.metrics.maxDrawdown.toFixed(
														2
													)}
													%
												</div>
											</div>

											<div className="grid grid-cols-3 gap-2 text-xs">
												<div>
													<span className="font-medium">
														Total Trades:
													</span>{" "}
													{backtest.totalTrades || 0}
												</div>
												<div>
													<span className="font-medium">
														Winning:
													</span>{" "}
													<span className="text-green-600">
														{backtest.winningTrades ||
															0}
													</span>
												</div>
												<div>
													<span className="font-medium">
														Losing:
													</span>{" "}
													<span className="text-red-600">
														{backtest.losingTrades ||
															0}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default HistoricalData;
