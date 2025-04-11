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
    OnChangeFn,
    RowSelectionState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowRotateRight, ArrowUp } from "iconsax-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DebounceInput } from "@/components/DebounceInput";
import { PaginationControls } from "@/components/PaginationControls";
import { fuzzyFilter } from "@/lib/utils";

interface FilterOption {
    value: string;
    label: string;
}

interface Filter {
    id: string;
    label: string;
    options: FilterOption[];
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T, any>[];
    globalFilter: string;
    onGlobalFilterChange: (value: string) => void;
    rowSelection: RowSelectionState;
    onRowSelectionChange: OnChangeFn<RowSelectionState>;
    sorting: SortingState;
    onSortingChange: OnChangeFn<SortingState>;
    pagination: PaginationState;
    onPaginationChange: OnChangeFn<PaginationState>;
    sortOption: string;
    onSortOptionChange: (value: string) => void;
    filters?: Filter[];
    onRefresh?: () => void;
    isLoading?: boolean;
    onBulkDelete?: () => void;
    isBulkDeletePending?: boolean;
    selectedCount?: number;
}

export function DataTable<T>({
    data,
    columns,
    globalFilter,
    onGlobalFilterChange,
    rowSelection,
    onRowSelectionChange,
    sorting,
    onSortingChange,
    pagination,
    onPaginationChange,
    sortOption,
    onSortOptionChange,
    filters = [],
    onRefresh,
    isLoading,
    onBulkDelete,
    isBulkDeletePending,
    selectedCount,
}: DataTableProps<T>) {
    const table = useReactTable({
        data,
        columns,
        filterFns: { fuzzy: fuzzyFilter },
        globalFilterFn: "fuzzy",
        state: {
            globalFilter,
            pagination,
            rowSelection,
            sorting,
        },
        getRowId: (row: any) => row.id.toString(),
        enableRowSelection: true,
        onGlobalFilterChange,
        onPaginationChange,
        onRowSelectionChange,
        onSortingChange,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="bg-white border border-gray-200 rounded-xl dark:bg-[#30334E] dark:border-gray-600">
            <div className="flex flex-col justify-between gap-2 p-4 border-b border-gray-200 sm:items-center sm:flex-row dark:border-gray-600">
                <DebounceInput
                    value={globalFilter}
                    onChange={onGlobalFilterChange}
                    type="search"
                    placeholder="Cari disini..."
                    className="transition-all outline-none dark:border-gray-600 max-w-96 hover:ring-blue-300 hover:ring-1 dark:hover:ring-gray-700 dark:focus-visible:ring-gray-800"
                />
                <div className="flex gap-2">
                    {onRefresh && (
                        <Button variant="outline" onClick={onRefresh} disabled={isLoading || isBulkDeletePending}>
                            <ArrowRotateRight className={isLoading ? "animate-spin" : ""} />
                        </Button>
                    )}
                    {onBulkDelete && selectedCount && selectedCount > 0 ? (
                        <Button
                            onClick={onBulkDelete}
                            className="transition-all bg-red-500 hover:bg-red-600 active:bg-red-700 active:scale-[.99] text-gray-200"
                            disabled={isBulkDeletePending}
                        >
                            {isBulkDeletePending ? "Menghapus..." : `Hapus (${selectedCount})`}
                        </Button>
                    ) : null}
                    {filters.map((filter) => (
                        <Select
                            key={filter.id}
                            value={table.getColumn(filter.id)?.getFilterValue()?.toString() || "all"}
                            onValueChange={(val) => table.getColumn(filter.id)?.setFilterValue(val)}
                        >
                            <SelectTrigger className="w-40 dark:border-gray-600">
                                <SelectValue placeholder={`Pilih ${filter.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {filter.options.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    ))}
                    <Select value={sortOption} onValueChange={onSortOptionChange}>
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
                            <tr key={idx} className="text-left text-gray-400 bg-gray-50 dark:bg-[#2e3149] border-b border-gray-200 dark:border-gray-600">
                                {headerGroup.headers.map((header, idx2) => (
                                    <th key={idx2} className="p-3 font-medium" onClick={header.column.getToggleSortingHandler()}>
                                        <div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                            <tr key={idx} className="text-left text-gray-600 border-b divide-x divide-gray-200 dark:divide-gray-600 dark:border-gray-600 dark:text-gray-300">
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

            <PaginationControls table={table} pagination={pagination} setPageSize={(size) => table.setPageSize(size)} />
        </div>
    );
}
