import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2, ChevronDown, RefreshCw, ArrowRight, Search } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useInfiniteQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { api, canAccess, convertSnakeToTitleCase } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

// Types
interface InventoryLog {
    id: number;
    created_at: string; // ISO 8601
    employee_name: string;
    employee_code: string;
    item_name: string;
    item_code: string;
    from: number | string;
    to: number | string;
    change_reason: string;
    change_amount: number;
    note: string;
}

interface LogsApiResponse {
    data: InventoryLog[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        path: string;
        per_page: number;
        to: number | null;
        total: number;
    };
}

// Constants
const CHANGE_REASON_OPTIONS = [
    { value: "adjustment", label: "Adjustment" },
    { value: "check_out", label: "Checkout" },
    { value: "check_in", label: "Check-in" },
    { value: "order", label: "Order" },
    { value: "other", label: "Other" },
];

// API Function
const fetchLogs = async ({ pageParam = 1, queryKey }: any): Promise<LogsApiResponse> => {
    const [_key, { changeReason, startDate, endDate, search }] = queryKey;

    const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        size: '10',
    });

    if (changeReason && changeReason !== "all") {
        searchParams.append('change_reason', changeReason);
    }

    if (startDate) searchParams.append('start_date', format(startDate, 'yyyy-MM-dd'));
    if (endDate) searchParams.append('end_date', format(endDate, 'yyyy-MM-dd'));
    if (search) searchParams.append('search', search);

    const response: LogsApiResponse = await api().get("inventory-logs", { searchParams }).json();
    return response;
};

export const Route = createFileRoute("/_layout/inventory_/log")({
    component: RouteComponent,
});

function RouteComponent() {
    const { auth } = useAuth();

    if (!canAccess(["Superadmin", "Admin Inventaris"], auth?.user.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    // State for filters
    const [changeReason, setChangeReason] = useState<string>("all");
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
    const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);
    const [isFiltersApplied, setIsFiltersApplied] = useState(false);
    const [search, setSearch] = useState<string>("");
    const [tempSearch, setTempSearch] = useState<string>("");

    // Data fetching with React Query
    const {
        data: logsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingLogs,
        isError: isLogsError,
        error: logsError,
        refetch: refetchLogs,
    } = useInfiniteQuery<LogsApiResponse, Error>({
        queryKey: ['inventory-logs', {
            changeReason: isFiltersApplied ? changeReason : "all",
            startDate: isFiltersApplied ? startDate : undefined,
            endDate: isFiltersApplied ? endDate : undefined,
            search: isFiltersApplied ? search : ""
        }],
        queryFn: fetchLogs,
        getNextPageParam: (lastPage) => {
            if (lastPage.meta.current_page < lastPage.meta.last_page) {
                return lastPage.meta.current_page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        refetchOnMount: true,
    });

    // Flatten logs data for rendering
    const allLogs = useMemo(() =>
        logsData?.pages.flatMap(page => page.data) ?? [],
        [logsData]
    );

    // Event handlers
    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const handlePopoverOpenChange = (open: boolean) => {
        if (open) {
            setTempStartDate(startDate);
            setTempEndDate(endDate);
        }
        setIsDatePopoverOpen(open);
    };

    const handleSubmitFilters = () => {
        if (tempStartDate && tempEndDate && tempStartDate > tempEndDate) {
            alert("Start date cannot be after end date.");
            setTempStartDate(startDate);
            setTempEndDate(endDate);
            return;
        }
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setSearch(tempSearch);
        setIsDatePopoverOpen(false);
        setIsFiltersApplied(true);
        refetchLogs();
    };

    const handleResetFilters = () => {
        setChangeReason("all");
        setStartDate(undefined);
        setEndDate(undefined);
        setTempStartDate(undefined);
        setTempEndDate(undefined);
        setSearch("");
        setTempSearch("");
        setIsFiltersApplied(false);
        refetchLogs();
    };

    // Get badge color based on change reason
    const getChangeReasonBadgeClass = (reason: string) => {
        switch (reason.toLowerCase()) {
            case 'adjustment':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
            case 'checkout':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
            case 'check-in':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
            case 'order':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <h2 className="my-2 text-xl font-medium dark:text-gray-300">Inventory Logs</h2>
            <div className="mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
                Daftar dan Informasi Log Inventory
            </div>

            {/* Filters */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-8">
                <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
                    {/* Global Search */}
                    <div className="">
                        <label className="block text-sm font-medium mb-1">Search</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Search by item or user..."
                                className="pl-10 max-w-96"
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <Select value={changeReason} onValueChange={setChangeReason}>
                            <SelectTrigger className="min-w-[200px]">
                                <SelectValue placeholder="All Reasons" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Reasons</SelectItem>
                                {CHANGE_REASON_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium mb-1">Date Range</label>
                        <Popover open={isDatePopoverOpen} onOpenChange={handlePopoverOpenChange}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full md:w-auto min-w-[200px] justify-start gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    {startDate && endDate ? (
                                        <span>
                                            {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                                        </span>
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4 space-y-4" align="start">
                                <div className="text-sm font-medium text-center mb-2">Select Date Range</div>
                                <Calendar
                                    mode="range"
                                    selected={{ from: tempStartDate, to: tempEndDate }}
                                    onSelect={(range: DateRange | undefined) => {
                                        setTempStartDate(range?.from);
                                        setTempEndDate(range?.to);
                                    }}
                                    numberOfMonths={1}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handleSubmitFilters} disabled={isLoadingLogs}>
                            {isLoadingLogs ? "Loading..." : "Apply Filters"}
                        </Button>
                        {isFiltersApplied && (
                            <Button variant="outline" onClick={handleResetFilters} className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm">
                        <tr>
                            <th className="px-6 py-4 font-medium whitespace-nowrap">Tanggal & Waktu</th>
                            <th className="px-6 py-4 font-medium">Pengguna</th>
                            <th className="px-6 py-4 font-medium">Barang</th>
                            <th className="px-6 py-4 font-medium">
                                <div className="flex gap-4 items-center">
                                    <Badge variant="outline">Dari</Badge>
                                    <ArrowRight className="h-4 w-4" />
                                    <Badge variant="outline">Ke</Badge>
                                </div>
                            </th>
                            <th className="px-6 py-4 font-medium">Perubahan</th>
                            <th className="px-6 py-4 font-medium">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {isLoadingLogs && !logsData && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    <p className="mt-2 text-gray-500 dark:text-gray-400">Loading logs...</p>
                                </td>
                            </tr>
                        )}

                        {isLogsError && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <p className="text-red-600 font-medium dark:text-red-400">Error loading logs:</p>
                                    <p className="text-red-500 text-sm mt-1 dark:text-red-400">{logsError?.message || "An unknown error occurred."}</p>
                                    <Button onClick={() => refetchLogs()} variant="outline" size="sm" className="mt-4">
                                        Retry
                                    </Button>
                                </td>
                            </tr>
                        )}

                        {!isLoadingLogs && !isLogsError && allLogs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <p className="text-gray-500 dark:text-gray-400">No logs found for the selected filters.</p>
                                </td>
                            </tr>
                        )}

                        {allLogs.map((log) => {
                            const dateObj = parseISO(log.created_at);
                            return (
                                <tr key={log.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4">
                                        <div className="text-sm">{format(dateObj, 'dd MMM yyyy')}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{format(dateObj, 'h:mm a')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm">{log.employee_name}</div>
                                        {log.employee_code && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">#{log.employee_code}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">{log.item_name}</div>
                                        {log.item_code && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">#{log.item_code}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4 items-center justify-center">
                                            <Badge variant="outline">{log.from}</Badge>
                                            <ArrowRight className="h-4 w-4" />
                                            <Badge variant="outline">{log.to}</Badge>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">{log.change_amount}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChangeReasonBadgeClass(log.change_reason)}`}>
                                            {convertSnakeToTitleCase(log.change_reason)}
                                        </span>
                                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{log.note}</div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Load more button */}
            {hasNextPage && (
                <div className="mt-6 text-center">
                    <Button
                        onClick={handleLoadMore}
                        variant="outline"
                        className="gap-2 px-8 py-2 text-base"
                        size="lg"
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                Load More
                                <ChevronDown className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
