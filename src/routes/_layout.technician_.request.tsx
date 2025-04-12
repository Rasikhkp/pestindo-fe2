import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2, ChevronDown, RefreshCw, Search, Plus } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { api, canAccess } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import RequestCard from "@/components/inventory/RequestCard";
import { SearchableSelect, SearchableOption } from "@/components/ui/searchable-select";
import { Employee, InventoryRequest } from "@/types/types";



interface RequestsApiResponse {
    data: InventoryRequest[];
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

// API Functions
const fetchRequests = async ({ pageParam = 1, queryKey }: any): Promise<RequestsApiResponse> => {
    const [_key, { status, type, employeeId, startDate, endDate, search }] = queryKey;

    const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        size: '12',
    });

    if (employeeId && employeeId !== "all") {
        searchParams.append('employee_id', employeeId.toString());
    }

    if (status && status !== "all") {
        searchParams.append('status', status);
    }

    if (type && type !== "all") {
        searchParams.append('type', type);
    }

    if (startDate) searchParams.append('start_date', format(startDate, 'yyyy-MM-dd'));
    if (endDate) searchParams.append('end_date', format(endDate, 'yyyy-MM-dd'));
    if (search) searchParams.append('search', search);

    const response: RequestsApiResponse = await api().get("inventory-requests", { searchParams }).json();
    return response;
};

export const Route = createFileRoute("/_layout/technician_/request")({
    component: RouteComponent,
});

function RouteComponent() {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const isSuperadmin = auth?.user?.role === "Superadmin";

    // if (!canAccess(["Teknisi", "Superadmin"], auth?.user?.role || "")) {
    //     return <Navigate to="/dashboard" />;
    // }

    // Get the appropriate ID to filter by - this should be whatever ID the API
    // expects when filtering inventory requests by the current technician
    // We're using any type to work around the type issues with auth.user
    const employeeId = auth?.user.id;

    // State for filters
    const [status, setStatus] = useState<string>("all");
    const [type, setType] = useState<string>("all");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(isSuperadmin ? "all" : employeeId?.toString() || "all");
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
    const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);
    const [isFiltersApplied, setIsFiltersApplied] = useState(false);
    const [search, setSearch] = useState<string>("");
    const [tempSearch, setTempSearch] = useState<string>("");

    // Fetch employees for filter when superadmin
    const { data: employeesResponse, isLoading: isLoadingEmployees } = useQuery({
        queryKey: ['technician-employees'],
        queryFn: async () => {
            const response = await api().get("employee").json<{ data: Employee[] }>();
            return {
                data: response.data.filter(emp => emp.role_name === "Teknisi")
            };
        },
        enabled: isSuperadmin
    });

    // Technician employees for filter
    const technicianEmployees = useMemo(() => {
        if (!employeesResponse?.data) return [];
        return employeesResponse.data.map(emp => ({
            value: emp.id,
            label: emp.name,
            searchableText: [emp.code]
        }));
    }, [employeesResponse]);

    // Data fetching with React Query
    const {
        data: requestsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingRequests,
        isError: isRequestsError,
        error: requestsError,
        refetch: refetchRequests,
    } = useInfiniteQuery<RequestsApiResponse, Error>({
        queryKey: ['inventory-requests', {
            status: isFiltersApplied ? status : "all",
            type: isFiltersApplied ? type : "all",
            employeeId: isSuperadmin ? (isFiltersApplied ? selectedEmployeeId : "all") : employeeId,
            startDate: isFiltersApplied ? startDate : undefined,
            endDate: isFiltersApplied ? endDate : undefined,
            search: isFiltersApplied ? search : ""
        }],
        queryFn: fetchRequests,
        getNextPageParam: (lastPage) => {
            if (lastPage.meta.current_page < lastPage.meta.last_page) {
                return lastPage.meta.current_page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        refetchOnMount: true,
        enabled: !!employeeId,
    });

    // Flatten requests data for rendering
    const allRequests = useMemo(() =>
        requestsData?.pages.flatMap(page => page.data) ?? [],
        [requestsData]
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
            toast.error("Tanggal mulai tidak boleh setelah tanggal akhir");
            return;
        }
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setSearch(tempSearch);
        setIsDatePopoverOpen(false);
        setIsFiltersApplied(true);
        refetchRequests();
    };

    const handleResetFilters = () => {
        setStatus("all");
        setType("all");
        setStartDate(undefined);
        setEndDate(undefined);
        setTempStartDate(undefined);
        setTempEndDate(undefined);
        setSearch("");
        setTempSearch("");
        setIsFiltersApplied(false);
        refetchRequests();
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="my-2 text-xl font-medium dark:text-gray-300">Permintaan Saya</h2>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-400">
                        Daftar permintaan inventory yang saya buat
                    </div>
                </div>
                <Button
                    onClick={() => navigate({ to: '/technician/request/create' })}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Request
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-8">
                <div className="flex flex-col md:flex-row gap-4 mb-4 items-end flex-wrap">
                    {/* Global Search */}
                    <div className="">
                        <label className="block text-sm font-medium mb-1">Search</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Search by item..."
                                className="pl-10 max-w-96"
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="min-w-[150px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="requested">Menunggu</SelectItem>
                                <SelectItem value="approved">Disetujui</SelectItem>
                                <SelectItem value="rejected">Ditolak</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Type Filter */}
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium mb-1">Tipe</label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="min-w-[150px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="in">Masuk</SelectItem>
                                <SelectItem value="out">Keluar</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Employee Filter - Only for Superadmin */}
                    {isSuperadmin && (
                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium mb-1">Teknisi</label>
                            {isLoadingEmployees ? (
                                <Select disabled>
                                    <SelectTrigger className="min-w-[200px]">
                                        <SelectValue placeholder="Loading..." />
                                    </SelectTrigger>
                                </Select>
                            ) : (
                                <SearchableSelect
                                    options={[
                                        { value: "all", label: "All Technicians" },
                                        ...technicianEmployees
                                    ]}
                                    value={selectedEmployeeId}
                                    onChange={(value) => setSelectedEmployeeId(value.toString())}
                                    className="min-w-[200px]"
                                />
                            )}
                        </div>
                    )}

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
                        <Button onClick={handleSubmitFilters} disabled={isLoadingRequests}>
                            {isLoadingRequests ? "Loading..." : "Apply Filters"}
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

            {/* Request Cards Grid */}
            {isLoadingRequests && !requestsData ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-gray-500 dark:text-gray-400">Loading requests...</p>
                </div>
            ) : isRequestsError ? (
                <div className="text-center py-16">
                    <p className="text-red-600 font-medium dark:text-red-400">Error loading requests:</p>
                    <p className="text-red-500 text-sm mt-1 dark:text-red-400">
                        {requestsError?.message || "An unknown error occurred."}
                    </p>
                    <Button onClick={() => refetchRequests()} variant="outline" size="sm" className="mt-4">
                        Retry
                    </Button>
                </div>
            ) : allRequests.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400">
                        No requests found for the selected filters.
                    </p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-6">
                    {allRequests.map((request) => (
                        <RequestCard
                            className=""
                            key={request.id}
                            id={request.id}
                            userName={request.employee.name}
                            userId={request.employee.code}
                            requestId={request.code}
                            dateTime={format(parseISO(request.created_at), 'dd MMM yyyy, HH:mm')}
                            items={request.items.map(item => ({
                                name: item.name,
                                code: item.code,
                                amount: item.amount,
                                unit: item.unit
                            }))}
                            status={request.status}
                            type={request.type}
                            note={request.note || undefined}
                            isTechnician={true}
                        />
                    ))}
                </div>
            )}

            {/* Load more button */}
            {hasNextPage && (
                <div className="mt-8 text-center">
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
