import React, { useState } from "react";
import { useMutation } from "@apollo/client";
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
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import {
    RUN_VECTORIZED_BACKTEST,
    RUN_EVENT_DRIVEN_BACKTEST,
    RUN_ML_BACKTEST,
} from "@/lib/queries";
import { ModelManager } from "@/components/ModelManager";
import { format, toDate } from "date-fns";
import { CalendarIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

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

interface BacktestFormProps {
    backtestType: "vectorized" | "event-driven" | "custom-model";
    setBacktestType: (type: "vectorized" | "event-driven" | "custom-model") => void;
    coinList: string[];
    onSubmit: (result: BacktestResult, initCash: number) => void;
}

const BacktestForm: React.FC<BacktestFormProps> = ({
    backtestType,
    setBacktestType,
    coinList,
    onSubmit,
}) => {
    const [loading, setLoading] = useState(false);
    const [selectedModelFilename, setSelectedModelFilename] = useState<string>("");
    const [selectedScalerFilename, setSelectedScalerFilename] = useState<string>("");
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);
    const [symbolOpen, setSymbolOpen] = useState(false);
    const [startMonth, setStartMonth] = useState<Date>(new Date());
    const [endMonth, setEndMonth] = useState<Date>(new Date());

    const [runVectorizedBacktest] = useMutation(RUN_VECTORIZED_BACKTEST);
    const [runEventDrivenBacktest] = useMutation(RUN_EVENT_DRIVEN_BACKTEST);
    const [runMlBacktest] = useMutation(RUN_ML_BACKTEST);

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

    const getErrorMessage = (error: unknown): string => {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check for Binance API timeout or connection errors
        if (
            errorMessage.toLowerCase().includes("timeout") ||
            errorMessage.toLowerCase().includes("connection") ||
            errorMessage.toLowerCase().includes("network") ||
            errorMessage.toLowerCase().includes("binance")
        ) {
            return "Binance API connection timeout. Please try again with a smaller date range or check your internet connection.";
        }

        // Check for other common API errors
        if (errorMessage.toLowerCase().includes("rate limit")) {
            return "API rate limit exceeded. Please wait a moment and try again.";
        }

        if (errorMessage.toLowerCase().includes("invalid symbol")) {
            return "Invalid trading symbol. Please select a different symbol.";
        }

        return errorMessage;
    };

    const handleSubmit = async (data: BacktestFormData) => {
        setLoading(true);
        const toastId = toast.loading("Running Backtest...");

        // Validate model selection for custom-model backtest
        if (backtestType === "custom-model") {
            if (!selectedModelFilename) {
                toast.dismiss(toastId);
                toast.error(
                    "Please select a model from the Model Manager for custom model backtest"
                );
                setLoading(false);
                return;
            }
            if (!selectedScalerFilename) {
                toast.dismiss(toastId);
                toast.error(
                    "Please select a scaler file from the Model Manager for custom model backtest"
                );
                setLoading(false);
                return;
            }
        }

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
                modelFile:
                    backtestType === "custom-model"
                        ? selectedModelFilename
                        : undefined,
                modelScalerFile:
                    backtestType === "custom-model"
                        ? selectedScalerFilename
                        : undefined,
            };

            let response;
            if (backtestType === "vectorized") {
                response = await runVectorizedBacktest({
                    variables: { input },
                });
            } else if (backtestType === "event-driven") {
                response = await runEventDrivenBacktest({
                    variables: { input },
                });
            } else if (backtestType === "custom-model") {
                response = await runMlBacktest({ variables: { input } });
            }

            if (response?.data) {
                const resultKey =
                    backtestType === "vectorized"
                        ? "runVectorizedBacktest"
                        : backtestType === "event-driven"
                        ? "runEventDrivenBacktest"
                        : "runMlBacktest";
                const result = response.data[resultKey];
                toast.dismiss(toastId);
                toast.success("Backtest completed successfully!");
                onSubmit(result, data.initCash);
            }
        } catch (error) {
            console.error("Backtest error:", error);
            toast.dismiss(toastId);
            const errorMessage = getErrorMessage(error);
            toast.error(
                `Backtest failed: ${errorMessage}`,
                {
                    duration: 5000,
                    icon: <AlertTriangle className="h-4 w-4" />,
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Backtest Type</Label>
                        <Select
                            onValueChange={(
                                value:
                                    | "vectorized"
                                    | "event-driven"
                                    | "custom-model"
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
                                <SelectItem value="custom-model">
                                    Custom Model Backtest
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

                {backtestType === "custom-model" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Model Selection</Label>
                            <p className="text-sm text-muted-foreground">
                                Select a model and scaler from your
                                uploaded files below. Click on the files to select them.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Selected Model:</Label>
                                    {selectedModelFilename ? (
                                        <p className="text-sm text-green-600 font-medium">
                                            ✓ {selectedModelFilename}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-red-600">
                                            ⚠ No model selected
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Selected Scaler:</Label>
                                    {selectedScalerFilename ? (
                                        <p className="text-sm text-green-600 font-medium">
                                            ✓ {selectedScalerFilename}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-red-600">
                                            ⚠ No scaler selected
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <ModelManager
                            onModelSelect={setSelectedModelFilename}
                            selectedModel={selectedModelFilename}
                            onScalerSelect={setSelectedScalerFilename}
                            selectedScaler={selectedScalerFilename}
                        />
                    </div>
                )}

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
    );
};

export default BacktestForm;
