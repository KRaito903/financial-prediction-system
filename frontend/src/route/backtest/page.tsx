import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
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
import { Calendar } from "@/components/ui/calendar";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import {
	RUN_VECTORIZED_BACKTEST,
	RUN_EVENT_DRIVEN_BACKTEST,
	FETCH_TRADING_PAIRS,
} from "@/lib/queries";
import { format, toDate } from "date-fns";
import { CalendarIcon } from "lucide-react";
import toast from "react-hot-toast";
import BacktestChart from "../../components/BacktestChart";
import BacktestMetricsComponent from "../../components/BacktestMetrics";
import HistoricalData from "../../components/HistoricalData";
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
}

interface fetchInputInput {
	startDate: string;
	endDate: string;
	interval: string;
	symbol: string;
	limit: number;
}

interface BacktestFormData {
	userId: string;
	symbol: string;
	fetchInput: fetchInputInput;
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
		"vectorized" | "event-driven"
	>("vectorized");
	const [result, setResult] = useState<BacktestResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [initCashValue, setInitCashValue] = useState(10000); // Store initCash for chart use
	const [coinList, setCoinList] = useState<string[]>([]);
	const [selectedHistoricalBacktest, setSelectedHistoricalBacktest] = useState<BacktestResult | null>(null);

	const [runVectorizedBacktest] = useMutation(RUN_VECTORIZED_BACKTEST);
	const [runEventDrivenBacktest] = useMutation(RUN_EVENT_DRIVEN_BACKTEST);
	const {
		data,
		loading: queryLoading,
		error: queryError,
	} = useQuery(FETCH_TRADING_PAIRS);

	useEffect(() => {
		if (queryLoading) return; // Wait for loading to finish
		if (data?.fetchCoinList?.coins) {
			const coins = [...data.fetchCoinList.coins]; // Create a copy to avoid mutating the original
			setCoinList(coins.sort()); // Sort the copy and set state
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
			strategy: backtest.strategy ? {
				fastMaPeriod: backtest.strategy.fastMaPeriod,
				slowMaPeriod: backtest.strategy.slowMaPeriod,
			} : undefined,
			data: backtest.data.map((item) => ({
				Date: item.Date,
				portfolioValue: item.portfolioValue,
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

	const [startDateOpen, setStartDateOpen] = useState(false);
	const [endDateOpen, setEndDateOpen] = useState(false);
	const [symbolOpen, setSymbolOpen] = useState(false);
	const [startMonth, setStartMonth] = useState<Date>(new Date());
	const [endMonth, setEndMonth] = useState<Date>(new Date());

	const form = useForm<BacktestFormData>({
		defaultValues: {
			userId: useAuth().user?.id || "test-user",
			symbol: "BTCUSDT",
			fetchInput: {
				startDate: format(
					new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
					"yyyy-MM-dd"
				),
				endDate: format(new Date(), "yyyy-MM-dd"),
				interval: "1d",
				symbol: "BTCUSDT",
				limit: 1000,
			},
			fastMAPeriod: 20,
			slowMAPeriod: 50,
			period: "1D",
			initCash: 10000,
			fees: 0.001,
			slippage: 0.001,
			useFallback: true,
		},
	});

	const onSubmit = async (data: BacktestFormData) => {
		setLoading(true);
		setInitCashValue(data.initCash); // Update initCash for chart
		const toastId = toast.loading("Running Backtest...");
		try {
			const input = {
				userId: data.userId,
				symbol: data.symbol,
				fetchInput: {
					startDate: data.fetchInput.startDate
						? format(
								new Date(data.fetchInput.startDate),
								"yyyy-MM-dd"
						  )
						: format(
								new Date(
									Date.now() - 1000 * 24 * 60 * 60 * 1000
								),
								"yyyy-MM-dd"
						  ),
					endDate: format(
						data.fetchInput.endDate
							? new Date(data.fetchInput.endDate)
							: new Date(),
						"yyyy-MM-dd"
					),
					interval: data.fetchInput.interval,
					symbol: data.symbol,
					limit: data.fetchInput.limit || 1000,
				},
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
				toast.dismiss(toastId);
				toast.success("Backtest completed successfully!");
			}
		} catch (error) {
			console.error("Backtest error:", error);
			toast.dismiss(toastId);
			toast.error(
				`Backtest error: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		} finally {
			setLoading(false);
		}
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
										<FormItem className="flex flex-col">
											<Popover
												open={symbolOpen}
												onOpenChange={setSymbolOpen}
											>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															role="combobox"
															aria-expanded={
																symbolOpen
															}
															className="w-full justify-between"
														>
															{field.value
																? coinList.find(
																		(
																			coin
																		) =>
																			coin ===
																			field.value
																  ) ||
																  "Select symbol..."
																: "Select symbol..."}
															<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-full p-0">
													<Command>
														<CommandInput
															placeholder="Search symbol..."
															className="h-9"
														/>
														<CommandList>
															<CommandEmpty>
																No symbol found.
															</CommandEmpty>
															<CommandGroup>
																{coinList.map(
																	(coin) => (
																		<CommandItem
																			key={
																				coin
																			}
																			value={
																				coin
																			}
																			onSelect={() => {
																				form.setValue(
																					"symbol",
																					coin
																				);
																				setSymbolOpen(
																					false
																				);
																			}}
																		>
																			<Check
																				className={cn(
																					"mr-2 h-4 w-4",
																					field.value ===
																						coin
																						? "opacity-100"
																						: "opacity-0"
																				)}
																			/>
																			{
																				coin
																			}
																		</CommandItem>
																	)
																)}
															</CommandGroup>
														</CommandList>
													</Command>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="fetchInput.startDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>Start Date</FormLabel>
											<Popover
												open={startDateOpen}
												onOpenChange={setStartDateOpen}
											>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant={"outline"}
															className={`w-full pl-3 text-left font-normal ${
																!field.value &&
																"text-muted-foreground"
															}`}
														>
															{field.value ? (
																format(
																	field.value,
																	"PPP"
																)
															) : (
																<span>
																	Pick a date
																</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent
													className="w-auto p-0"
													align="start"
												>
													<div className="flex justify-center p-2">
														<Select
															onValueChange={(
																value
															) =>
																setStartMonth(
																	new Date(
																		parseInt(
																			value
																		),
																		0,
																		1
																	)
																)
															}
														>
															<SelectTrigger className="w-[100px]">
																<SelectValue placeholder="Year" />
															</SelectTrigger>
															<SelectContent>
																{Array.from(
																	{
																		length:
																			new Date().getFullYear() -
																			1970 +
																			1,
																	},
																	(_, i) =>
																		1970 + i
																).map(
																	(year) => (
																		<SelectItem
																			key={
																				year
																			}
																			value={year.toString()}
																		>
																			{
																				year
																			}
																		</SelectItem>
																	)
																)}
															</SelectContent>
														</Select>
													</div>
													<Calendar
														mode="single"
														selected={toDate(
															field.value
														)}
														onSelect={(date) => {
															field.onChange(
																date
															);
															setStartDateOpen(
																false
															);
														}}
														month={startMonth}
														onMonthChange={
															setStartMonth
														}
														disabled={(date) =>
															date > new Date() ||
															date <
																new Date(
																	"1970-01-01"
																)
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="fetchInput.endDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>End Date</FormLabel>
											<Popover
												open={endDateOpen}
												onOpenChange={setEndDateOpen}
											>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant={"outline"}
															className={`w-full pl-3 text-left font-normal ${
																!field.value &&
																"text-muted-foreground"
															}`}
														>
															{field.value ? (
																format(
																	field.value,
																	"PPP"
																)
															) : (
																<span>
																	Pick a date
																</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent
													className="w-auto p-0"
													align="start"
												>
													<div className="flex justify-center p-2">
														<Select
															onValueChange={(
																value
															) =>
																setEndMonth(
																	new Date(
																		parseInt(
																			value
																		),
																		0,
																		1
																	)
																)
															}
														>
															<SelectTrigger className="w-[100px]">
																<SelectValue placeholder="Year" />
															</SelectTrigger>
															<SelectContent>
																{Array.from(
																	{
																		length:
																			new Date().getFullYear() -
																			1970 +
																			1,
																	},
																	(_, i) =>
																		1970 + i
																).map(
																	(year) => (
																		<SelectItem
																			key={
																				year
																			}
																			value={year.toString()}
																		>
																			{
																				year
																			}
																		</SelectItem>
																	)
																)}
															</SelectContent>
														</Select>
													</div>
													<Calendar
														mode="single"
														selected={toDate(
															field.value
														)}
														onSelect={(date) => {
															field.onChange(
																date
															);
															setEndDateOpen(
																false
															);
														}}
														month={endMonth}
														onMonthChange={
															setEndMonth
														}
														disabled={(date) =>
															date > new Date() ||
															date <
																new Date(
																	"1970-01-01"
																)
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="fetchInput.interval"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Interval</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select interval" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="1d">
														1 Day
													</SelectItem>
													<SelectItem value="1h">
														1 Hour
													</SelectItem>
													<SelectItem value="5m">
														5 Minutes
													</SelectItem>
													<SelectItem value="1m">
														1 Minute
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="fetchInput.limit"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Limit</FormLabel>
											<FormControl>
												<Input
													type="number"
													min="100"
													max="1000"
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
						<h3 className="text-lg font-semibold">Historical Backtest Results</h3>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSelectedHistoricalBacktest(null)}
						>
							Clear Selection
						</Button>
					</div>
					<BacktestMetricsComponent result={selectedHistoricalBacktest} />
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
