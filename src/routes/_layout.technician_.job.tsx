// import RegularServiceReport from "@/components/service-report/RegularServiceReport";
import { JobCard } from "@/components/job/JobCard";
// import { ReportWizard } from "@/components/service-report/ReportWizard";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo, useEffect, useState } from "react";
import { ChevronDown, Loader2, RefreshCw, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, canAccess } from "@/lib/utils";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";
import { useAuth } from "@/hooks/useAuth";
import { Employee, Job } from "@/types/types";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";

export const Route = createFileRoute("/_layout/technician_/job")({
    component: RouteComponent,
});

export interface Task {
    id: string;
    code: string;
    employees: Employee[];
    task: {
        id: number;
        code: string;
        customer_name: string;
        address: string;
        type: string;
        contract_type: string;
    };
    date: string;
    is_done: boolean;
}

interface JobsApiResponse {
    data: Task[];
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
const fetchJobs = async ({ pageParam = 1, queryKey }: any): Promise<JobsApiResponse> => {
    const [_key, { employeeId }] = queryKey;

    const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        size: '12',
    });

    if (employeeId) {
        searchParams.append('employee_id', employeeId.toString());
    }

    const response: JobsApiResponse = await api().get("technicians/jobs", { searchParams }).json();
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
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(isSuperadmin ? "" : employeeId?.toString() || "");

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
    }, [employeesResponse?.data]);

    // Data fetching with React Query
    const {
        data: jobsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error: queryError,
        refetch,
    } = useInfiniteQuery<JobsApiResponse, Error>({
        queryKey: ['technician-jobs', {
            employeeId: isSuperadmin ? selectedEmployeeId : employeeId,
        }],
        queryFn: fetchJobs,
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

    // Flatten jobs data for rendering
    const allJobs = useMemo(() =>
        jobsData?.pages.flatMap(page => page.data) ?? [],
        [jobsData]
    );

    console.log('jobsData', jobsData)
    console.log('allJobs', allJobs)

    useEffect(() => {
        if (queryError) {
            const errorMessage = queryError.message || "An error occurred while fetching jobs";
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

    const handleEmployeeChange = (value: string | number) => {
        setSelectedEmployeeId(value.toString());
    };

    return (
        <>
            <div>
                <h2 className="my-2 text-xl font-medium dark:text-gray-300">Pekerjaan Teknisi</h2>
                <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
                    Daftar pekerjaan teknisi
                </div>
            </div>

            {/* Employee Select for Superadmin */}
            {isSuperadmin && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-6">
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
                </div>
            )}

            {/* Loading state */}
            {isLoading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-gray-500 dark:text-gray-400">Loading jobs...</p>
                </div>
            ) : isError ? (
                <div className="text-center py-16">
                    <p className="text-red-600 font-medium dark:text-red-400">Error loading jobs:</p>
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
                        Please select a technician to view their jobs.
                    </p>
                </div>
            ) : allJobs.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400">
                        No jobs found.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {allJobs.map((job) => (
                        <JobCard key={job.id} task={job} />
                    ))}
                </div>
            )}

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