import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMemo, useEffect, useState } from "react";
import { ChevronDown, Loader2, RefreshCw, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, canAccess } from "@/lib/utils";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";
import { useAuth } from "@/hooks/useAuth";
import { Employee, TechnicianItem } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from "@/components/inventory/ItemCard";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";

export const Route = createFileRoute("/_layout/technician_/item")({
    component: RouteComponent,
});

interface ItemsApiResponse {
    data: TechnicianItem[];
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
const fetchItems = async ({ pageParam = 1, queryKey }: any): Promise<ItemsApiResponse> => {
    const [_key, { type, employeeId, search }] = queryKey;

    const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        size: '12',
    });

    if (employeeId && employeeId !== "all") {
        searchParams.append('employee_id', employeeId.toString());
    }

    if (type && type !== "all") {
        searchParams.append('type', type);
    }

    if (search) searchParams.append('search', search);

    const response: ItemsApiResponse = await api().get("technicians/items", { searchParams }).json();
    return response;
};

function RouteComponent() {
    const { auth } = useAuth();
    const isSuperadmin = auth?.user?.role === "Superadmin";
    const [, setError] = useAtom(errorAtom);

    if (!canAccess(["Teknisi", "Superadmin"], auth?.user?.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    // Get the appropriate ID to filter by
    const employeeId = auth?.user.id;

    // State for filters
    const [type, setType] = useState<string>("all");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(isSuperadmin ? "" : employeeId?.toString() || "");
    const [search, setSearch] = useState<string>("");
    const [tempSearch, setTempSearch] = useState<string>("");
    const [isFiltersApplied, setIsFiltersApplied] = useState(false);

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
    }, []);

    // Data fetching with React Query
    const {
        data: itemsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error: queryError,
        refetch,
    } = useInfiniteQuery<ItemsApiResponse, Error>({
        queryKey: ['technician-items', {
            type,
            employeeId: isSuperadmin ? selectedEmployeeId : employeeId,
            search: isFiltersApplied ? search : ""
        }],
        queryFn: fetchItems,
        getNextPageParam: (lastPage) => {
            if (lastPage.meta.current_page < lastPage.meta.last_page) {
                return lastPage.meta.current_page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        refetchOnMount: true,
        // Only enable the query when we have an employeeId or for superadmin when they've selected an employee
        enabled: isSuperadmin ? !!selectedEmployeeId : true,
    });

    // Flatten items data for rendering
    const allItems = useMemo(() =>
        itemsData?.pages.flatMap(page => page.data) ?? [],
        [itemsData]
    );

    useEffect(() => {
        if (queryError) {
            const errorMessage = queryError.message || "An error occurred while fetching items";
            setError({ message: errorMessage });
            toast.error(errorMessage);
        }
    }, [queryError, setError]);

    // Event handlers
    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const handleSearch = () => {
        setSearch(tempSearch);
        setIsFiltersApplied(true);
        refetch();
    };

    const handleTypeChange = (newType: string) => {
        if (!selectedEmployeeId) {
            return
        }

        setType(newType);
        refetch();
    };

    const handleEmployeeChange = (value: string | number) => {
        setSelectedEmployeeId(value.toString());
    };

    const handleResetFilters = () => {
        setType("all");
        setSearch("");
        setTempSearch("");
        setIsFiltersApplied(false);
        refetch();
    };

    // Filter items by type for tabs
    const filteredItems = useMemo(() => {
        if (type === "all") return allItems;
        return allItems.filter(item => item.type === type.toLowerCase());
    }, [allItems, type]);

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h2 className="my-2 text-xl font-medium dark:text-gray-300">Barang Teknisi</h2>
                    <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
                        Daftar barang teknisi
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Cari barang..."
                            className="pl-10 bg-white h-9"
                            value={tempSearch}
                            onChange={(e) => setTempSearch(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSearch}>Cari</Button>
                </div>
            </div>

            {/* Employee Select for Superadmin */}
            {isSuperadmin && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium mb-1">Pilih Teknisi</label>
                            {isLoadingEmployees ? (
                                <div className="flex items-center">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span>Loading employees...</span>
                                </div>
                            ) : (
                                <SearchableSelect
                                    options={technicianEmployees}
                                    value={selectedEmployeeId}
                                    onChange={handleEmployeeChange}
                                    className="min-w-[200px]"
                                    placeholder="Select technician"
                                />
                            )}
                        </div>

                        {isFiltersApplied && (
                            <Button variant="outline" onClick={handleResetFilters} className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Tabs for filtering by type */}
            <Tabs defaultValue="all" className="mb-6" onValueChange={handleTypeChange}>
                <TabsList className="w-full md:w-auto h-8">
                    <TabsTrigger value="all" className="text-xs md:text-sm">
                        All
                    </TabsTrigger>
                    <TabsTrigger value="chemical" className="text-xs md:text-sm">
                        Chemical
                    </TabsTrigger>
                    <TabsTrigger value="asset" className="text-xs md:text-sm">
                        Asset
                    </TabsTrigger>
                    <TabsTrigger value="equipment" className="text-xs md:text-sm">
                        Equipment
                    </TabsTrigger>
                </TabsList>

                {/* Loading state */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2 text-gray-500 dark:text-gray-400">Loading items...</p>
                    </div>
                ) : isError ? (
                    <div className="text-center py-16">
                        <p className="text-red-600 font-medium dark:text-red-400">Error loading items:</p>
                        <p className="text-red-500 text-sm mt-1 dark:text-red-400">
                            {queryError?.message || "An unknown error occurred."}
                        </p>
                        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
                            Retry
                        </Button>
                    </div>
                ) : isSuperadmin && !selectedEmployeeId ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 dark:text-gray-400">
                            Please select a technician to view their items.
                        </p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 dark:text-gray-400">
                            No items found for the selected filters.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                        {filteredItems.map((item) => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </Tabs>

            {/* Load more button */}
            {hasNextPage && !isLoading && (
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
        </>
    );
}

export default RouteComponent;
