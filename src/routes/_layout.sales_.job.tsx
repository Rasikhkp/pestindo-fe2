import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useEffect } from "react";
import { Checkbox } from "@heroui/checkbox";
import { More } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api, canAccess, getApiErrorMessage } from "@/lib/utils";
import { DeleteDialog } from "@/components/DeleteDialog";
import { DataTable } from "@/components/DataTable";
import { useTable } from "@/hooks/useTable";
import { Job } from "@/types/types";
import { is } from "date-fns/locale";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_layout/sales_/job")({
    component: RouteComponent,
});

const getJobColumns = (onDelete: (job: Job) => void): ColumnDef<Job, any>[] => [
    {
        id: "select",
        accessorKey: "id",
        header: ({ table }) => (
            <Checkbox
                color="primary"
                isSelected={table.getIsAllRowsSelected()}
                isIndeterminate={table.getIsSomeRowsSelected()}
                onChange={table.getToggleAllRowsSelectedHandler()}
                className="p-0 pl-2 mx-auto dark:border-blue-600"
            />
        ),
        cell: ({ row, getValue }) => (
            <div className="flex justify-center">
                <Checkbox
                    color="primary"
                    isSelected={row.getIsSelected()}
                    isIndeterminate={row.getIsSomeSelected()}
                    onChange={row.getToggleSelectedHandler()}
                    disabled={!row.getCanSelect()}
                    className="p-0 pl-2 m-0 dark:border-blue-600"
                    value={getValue()}
                />
            </div>
        ),
        enableSorting: false,
    },
    {
        accessorKey: "code",
        header: () => "ID",
        filterFn: "fuzzy",
    },
    {
        accessorKey: "type",
        header: () => "Tipe",
        filterFn: (row, colId, filterValue) => filterValue === "all" || filterValue === row.getValue(colId),
        cell: ({ row }) => {
            const type = row.original.type;
            let badgeStyle = "";
            let typeText = "";
            if (type === "pest_control") {
                badgeStyle = "bg-green-100 text-green-800";
                typeText = "Pest Control";
            } else if (type === "termite_control") {
                badgeStyle = "bg-blue-100 text-blue-800";
                typeText = "Termite Control";
            }
            return <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeStyle}`}>{typeText}</span>;
        },
    },
    {
        accessorKey: "customer_name",
        header: () => "Nama Pelanggan",
        filterFn: "fuzzy",
    },
    {
        accessorKey: "total_contract_value",
        header: () => "Nilai Kontrak",
        filterFn: "fuzzy",
    },
    {
        id: "tanggal",
        header: () => "Tanggal",
        cell: ({ row }) => (
            <div>
                {row.original.start_date} - {row.original.end_date}
            </div>
        ),
        filterFn: "fuzzy",
    },
    {
        accessorKey: "status",
        header: () => "Status",
        filterFn: (row, colId, filterValue) => filterValue === "all" || filterValue === row.getValue(colId),
        cell: ({ row }) => {
            const status = row.original.status;
            let badgeStyle = "";
            let statusText = "";
            if (status === "pending") {
                badgeStyle = "bg-gray-100 text-gray-800";
                statusText = "Pending";
            } else if (status === "in_progress") {
                badgeStyle = "bg-yellow-100 text-yellow-800";
                statusText = "In Progress";
            } else if (status === "completed") {
                badgeStyle = "bg-green-100 text-green-800";
                statusText = "Completed";
            } else if (status === "cancelled") {
                badgeStyle = "bg-red-100 text-red-800";
                statusText = "Cancelled";
            }
            return <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeStyle}`}>{statusText}</span>;
        },
    },
    {
        accessorKey: "id",
        header: "",
        cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-2 transition-all rounded hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-700">
                        <More className="rotate-90" size={16} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>
                        <Link to="/sales/job/$job_id" params={{ job_id: String(row.original.id) }} className="w-full">
                            Detail
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Link to="/sales/job/edit/$job_id" params={{ job_id: String(row.original.id) }} className="w-full">
                            Edit
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(row.original)} className="cursor-pointer">
                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];

function RouteComponent() {
    const { auth } = useAuth();

    if (!canAccess(["Sales", "Superadmin", "Manager Sales"], auth?.user.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    const [, setError] = useAtom(errorAtom);
    const {
        data: jobsResponse,
        refetch,
        isLoading,
        isRefetching,
        error: queryError,
    } = useQuery({
        queryKey: ["jobs"],
        queryFn: async () => api().get("jobs").json<{ data: Job[] }>(),
    });

    useEffect(() => {
        if (queryError) {
            getApiErrorMessage(queryError).then(errorMessage => setError(errorMessage));
        }
    }, [queryError, setError]);

    const {
        tableState,
        setTableState,
        handleSortOptionChange,
        handleSingleDelete,
        handleBulkDelete,
        deleteMutation,
        bulkDeleteMutation,
        deleteConfirmation,
        confirmDelete,
        cancelDelete,
    } = useTable<Job>("jobs");

    const jobColumns = useMemo(() => getJobColumns(handleSingleDelete), []);

    const filters = [
        {
            id: "type",
            label: "Tipe",
            options: [
                { value: "all", label: "Semua" },
                { value: "termite_control", label: "Termite Control" },
                { value: "pest_control", label: "Pest Control" },
            ],
        },
        {
            id: "status",
            label: "Status",
            options: [
                { value: "all", label: "Semua" },
                { value: "pending", label: "Pending" },
                { value: "in_progress", label: "Dalam Proses" },
                { value: "completed", label: "Selesai" },
                { value: "cancelled", label: "Dibatalkan" },
            ],
        },
    ];

    return (
        <div>
            <h2 className="my-2 text-xl font-medium dark:text-gray-300">Pekerjaan</h2>
            <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
                Daftar dan Informasi Pekerjaan
                <Link to="/sales/job/create">
                    <Button className="text-gray-200 transition-all bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95">Tambah Pekerjaan</Button>
                </Link>
            </div>

            <DataTable
                data={jobsResponse?.data || []}
                columns={jobColumns}
                globalFilter={tableState.globalFilter}
                onGlobalFilterChange={(value) => setTableState((prev) => ({ ...prev, globalFilter: value }))}
                rowSelection={tableState.rowSelection}
                onRowSelectionChange={(value) =>
                    setTableState((prev) => ({
                        ...prev,
                        rowSelection: typeof value === "function" ? value(prev.rowSelection) : value,
                    }))
                }
                sorting={tableState.sorting}
                onSortingChange={(value) =>
                    setTableState((prev) => ({
                        ...prev,
                        sorting: typeof value === "function" ? value(prev.sorting) : value,
                    }))
                }
                pagination={tableState.pagination}
                onPaginationChange={(value) =>
                    setTableState((prev) => ({
                        ...prev,
                        pagination: typeof value === "function" ? value(prev.pagination) : value,
                    }))
                }
                sortOption={tableState.sortOption}
                onSortOptionChange={handleSortOptionChange}
                filters={filters}
                onRefresh={refetch}
                isLoading={isRefetching || isLoading}
                onBulkDelete={handleBulkDelete}
                isBulkDeletePending={bulkDeleteMutation.isPending}
                selectedCount={Object.keys(tableState.rowSelection).length}
            />

            <DeleteDialog
                open={deleteConfirmation.isOpen && deleteConfirmation.type === "single"}
                onOpenChange={(open) => !open && cancelDelete()}
                onConfirm={confirmDelete}
                isPending={deleteMutation.isPending}
                message={`Anda yakin ingin menghapus pekerjaan? Tindakan ini tidak bisa dibatalkan.`}
            />

            <DeleteDialog
                open={deleteConfirmation.isOpen && deleteConfirmation.type === "bulk"}
                onOpenChange={(open) => !open && cancelDelete()}
                onConfirm={confirmDelete}
                isPending={bulkDeleteMutation.isPending}
                message={`Anda akan menghapus ${Object.keys(tableState.rowSelection).length} pekerjaan secara permanen. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?`}
            />
        </div>
    );
}

export default RouteComponent;
