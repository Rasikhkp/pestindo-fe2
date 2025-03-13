import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    useReactTable,
    SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@heroui/checkbox";
import { ArrowDown, ArrowRotateRight, ArrowUp, More } from "iconsax-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DebounceInput } from "@/components/DebounceInput";
import { api, fuzzyFilter } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/DeleteDialog";
import { PaginationControls } from "@/components/PaginationControls";

// Definisikan tipe data Job
export interface Job {
    id: number;
    code: string;
    customer_name: string;
    customer_type: string;
    total_contract_value: string;
    start_date: string;
    end_date: string;
    status: string;
    type: string;
    contract_type: string;
    created_at: string;
    updated_at: string;
}

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
    // Kolom ID, dengan accessorKey menggunakan "code"
    {
        accessorKey: "code",
        header: () => "ID",
        filterFn: "fuzzy",
    },
    // Kolom tipe (menggunakan field "type")
    {
        accessorKey: "type",
        header: () => "Tipe",
        filterFn: "fuzzy",
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
    // Kolom nama pelanggan (menggunakan field "customer_name")
    {
        accessorKey: "customer_name",
        header: () => "Nama Pelanggan",
        filterFn: "fuzzy",
    },
    // Kolom nilai kontrak
    {
        accessorKey: "total_contract_value",
        header: () => "Nilai Kontrak",
        filterFn: "fuzzy",
    },
    // Kolom tanggal: gabungan start_date dan end_date
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
    // Kolom status
    {
        accessorKey: "status",
        header: () => "Status",
        filterFn: "fuzzy",
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
            }
            return <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeStyle}`}>{statusText}</span>;
        },
    },
    // Kolom aksi (tanpa header)
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
                        <Link
                            to="/sales/job/edit/$job_id"
                            params={{ job_id: String(row.original.id) }}
                            className="w-full"
                        >
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
    const queryClient = useQueryClient();
    const {
        data: jobsResponse,
        refetch,
        isLoading,
    } = useQuery({
        queryKey: ["jobs"],
        queryFn: async () => api().get("jobs").json<{ data: Job[] }>(),
    });

    const [globalFilter, setGlobalFilter] = useState("");
    const [rowSelection, setRowSelection] = useState({});
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isSingleDeleteOpen, setSingleDeleteOpen] = useState(false);
    const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([{ id: "id", desc: true }]);
    const [sortOption, setSortOption] = useState("newest");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });

    console.log("rowSelection", rowSelection);
    const deleteJobMutation = useMutation({
        mutationFn: async (id: number) => api().delete(`jobs/${id}`).json(),
        onSuccess: () => {
            toast.success("Pekerjaan berhasil dihapus");
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
            setRowSelection({});
        },
        onError: (error) => {
            toast.error("Gagal menghapus pekerjaan");
            console.error("Delete error:", error);
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: number[]) => api().post("jobs/delete-many", { json: { ids } }).json(),
        onSuccess: () => {
            toast.success(`${Object.keys(rowSelection).length} pekerjaan berhasil dihapus`);
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
            setRowSelection({});
        },
        onError: (error) => {
            toast.error("Gagal menghapus pekerjaan");
            console.error("Bulk delete error:", error);
            (error as any).response.json().then((err: any) => console.log("Error details:", err));
        },
    });

    const handleSortOptionChange = (value: string) => {
        setSortOption(value);
        setSorting([{ id: "id", desc: value === "newest" }]);
    };

    const handleSingleDelete = (job: Job) => {
        setSelectedJob(job);
        setSingleDeleteOpen(true);
    };

    const handleBulkDelete = () => {
        // setTimeout(() => {
        setBulkDeleteOpen(true);
        // }, 100);
    };

    const confirmSingleDelete = () => {
        if (selectedJob) {
            deleteJobMutation.mutate(selectedJob.id);
        }
        setSingleDeleteOpen(false);
    };

    const confirmBulkDelete = () => {
        const selectedIds = Object.keys(rowSelection).map(Number);
        if (selectedIds.length > 0) {
            bulkDeleteMutation.mutate(selectedIds);
        }
        setBulkDeleteOpen(false);
    };

    const jobColumns = useMemo(() => getJobColumns(handleSingleDelete), []);

    const table = useReactTable({
        data: jobsResponse?.data || [],
        columns: jobColumns,
        filterFns: { fuzzy: fuzzyFilter },
        globalFilterFn: "fuzzy",
        state: {
            globalFilter,
            pagination,
            rowSelection,
            sorting,
        },
        getRowId: (row) => row.id.toString(),
        enableRowSelection: true,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div>
            <h2 className="my-2 text-xl font-medium dark:text-gray-300">Pekerjaan</h2>
            <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
                Daftar dan Informasi Pekerjaan
                <Link to="/sales/job/create">
                    <Button className="text-gray-200 transition-all bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95">
                        Tambah Pekerjaan
                    </Button>
                </Link>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl dark:bg-[#30334E] dark:border-gray-600">
                <div className="flex flex-col justify-between gap-2 p-4 border-b border-gray-200 sm:items-center sm:flex-row dark:border-gray-600">
                    <DebounceInput
                        value={globalFilter}
                        onChange={setGlobalFilter}
                        type="search"
                        placeholder="Cari disini..."
                        className="transition-all outline-none dark:border-gray-600 max-w-96 hover:ring-blue-300 hover:ring-1 dark:hover:ring-gray-700 dark:focus-visible:ring-gray-800"
                    />
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            disabled={isLoading || deleteJobMutation.isPending || bulkDeleteMutation.isPending}
                        >
                            <ArrowRotateRight className={isLoading ? "animate-spin" : ""} />
                        </Button>
                        {Object.keys(rowSelection).length > 0 && (
                            <Button
                                onClick={handleBulkDelete}
                                className="transition-all bg-red-500 hover:bg-red-600 active:bg-red-700 active:scale-[.99] text-gray-200"
                                disabled={bulkDeleteMutation.isPending}
                            >
                                {bulkDeleteMutation.isPending
                                    ? "Menghapus..."
                                    : `Hapus (${Object.keys(rowSelection).length})`}
                            </Button>
                        )}
                        {/* Contoh filter status */}
                        <Select
                            value={table.getColumn("status")?.getFilterValue()?.toString() || "all"}
                            onValueChange={(val) => table.getHeaderGroups()[0].headers[6].column.setFilterValue(val)}
                        >
                            <SelectTrigger className="w-40 dark:border-gray-600">
                                <SelectValue placeholder="Pilih Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="in_progress">Dalam Proses</SelectItem>
                                    <SelectItem value="completed">Selesai</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Select value={sortOption} onValueChange={handleSortOptionChange}>
                            <SelectTrigger className="w-40 dark:border-gray-600">
                                <SelectValue placeholder="Urutan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="newest">Terbaru</SelectItem>
                                    <SelectItem value="oldest">Terlama</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup, idx) => (
                                <tr
                                    key={idx}
                                    className="text-left text-gray-400 bg-gray-50 dark:bg-[#2e3149] border-b border-gray-200 dark:border-gray-600"
                                >
                                    {headerGroup.headers.map((header, idx2) => (
                                        <th
                                            key={idx2}
                                            className="p-3 font-medium"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                                {idx2 !== headerGroup.headers.length - 1 &&
                                                    ({
                                                        asc: <ArrowUp size={14} />,
                                                        desc: <ArrowDown size={14} />,
                                                    }[header.column.getIsSorted() as string] ??
                                                        null)}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row, idx) => (
                                <tr
                                    key={idx}
                                    className="text-left text-gray-600 border-b divide-x divide-gray-200 dark:divide-gray-600 dark:border-gray-600 dark:text-gray-300"
                                >
                                    {row.getVisibleCells().map((cell, cellIdx) => (
                                        <td key={cellIdx} className="p-3 whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <PaginationControls
                    table={table}
                    pagination={pagination}
                    setPageSize={(size) => table.setPageSize(size)}
                />
            </div>

            <DeleteDialog
                open={isSingleDeleteOpen}
                onOpenChange={setSingleDeleteOpen}
                onConfirm={confirmSingleDelete}
                isPending={deleteJobMutation.isPending}
                message={`Anda yakin ingin menghapus pekerjaan ${selectedJob?.code}? Tindakan ini tidak bisa dibatalkan.`}
            />

            <DeleteDialog
                open={isBulkDeleteOpen}
                onOpenChange={setBulkDeleteOpen}
                onConfirm={confirmBulkDelete}
                isPending={bulkDeleteMutation.isPending}
                message={`Anda akan menghapus ${Object.keys(rowSelection).length} pekerjaan secara permanen. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?`}
            />
        </div>
    );
}

export default RouteComponent;
