import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useEffect } from "react";
import { Checkbox } from "@heroui/checkbox";
import { More } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api, canAccess, formatToRupiah, getApiErrorMessage } from "@/lib/utils";
import { DeleteDialog } from "@/components/DeleteDialog";
import { DataTable } from "@/components/DataTable";
import { useTable } from "@/hooks/useTable";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_layout/inventory_/item")({
    component: RouteComponent,
});

const IMAGE_BASE_URL = import.meta.env.VITE_API_URL + "/storage/";
const PLACEHOLDER_IMAGE = "https://placehold.co/300x200";

interface Item {
    id: number;
    code: string;
    name: string;
    image: string;
    price: number;
    amount: number;
    unit: string;
    type: "chemical" | "equipment" | "asset";
}

const getItemColumns = (onDelete: (item: Item) => void): ColumnDef<Item, any>[] => [
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
        id: "item",
        header: () => "Item",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <img
                    src={`${IMAGE_BASE_URL}${row.original.image}` || PLACEHOLDER_IMAGE}
                    alt={row.original.name}
                    className="object-cover w-10 h-10 rounded-md"
                />
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.name}</span>
                    <span className="text-xs text-gray-500">#{row.original.code}</span>
                </div>
            </div>
        ),
        filterFn: "fuzzy",
    },
    {
        accessorKey: "price",
        header: () => "Harga",
        cell: ({ row }) => formatToRupiah(row.original.price),
        filterFn: "fuzzy",
    },
    {
        accessorKey: "amount",
        header: () => "Jumlah",
        filterFn: "fuzzy",
    },
    {
        accessorKey: "unit",
        header: () => "Satuan",
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
            if (type === "chemical") {
                badgeStyle = "bg-green-100 text-green-800";
                typeText = "Chemical";
            } else if (type === "equipment") {
                badgeStyle = "bg-blue-100 text-blue-800";
                typeText = "Equipment";
            } else if (type === "asset") {
                badgeStyle = "bg-purple-100 text-purple-800";
                typeText = "Asset";
            }
            return <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeStyle}`}>{typeText}</span>;
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
                        <Link to="/inventory/item/$item_id" params={{ item_id: String(row.original.id) }} className="w-full">
                            Detail
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Link to="/inventory/item/edit/$item_id" params={{ item_id: String(row.original.id) }} className="w-full">
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

    if (!canAccess(["Admin Inventaris", "Superadmin"], auth?.user.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    const [, setError] = useAtom(errorAtom);
    const {
        data: itemsResponse,
        refetch,
        isLoading,
        isRefetching,
        error: queryError,
    } = useQuery({
        queryKey: ["items"],
        queryFn: async () => api().get("items").json<{ data: Item[] }>(),
        refetchOnMount: true,
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
    } = useTable<Item>("items");

    const itemColumns = useMemo(() => getItemColumns(handleSingleDelete), []);

    const filters = [
        {
            id: "type",
            label: "Tipe",
            options: [
                { value: "all", label: "Semua" },
                { value: "chemical", label: "Chemical" },
                { value: "equipment", label: "Equipment" },
                { value: "asset", label: "Asset" },
            ],
        },
    ];

    return (
        <div>
            <h2 className="my-2 text-xl font-medium dark:text-gray-300">Inventory</h2>
            <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
                Daftar Item Inventory
                <Link to="/inventory/item/create">
                    <Button className="text-gray-200 transition-all bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95">Tambah Item</Button>
                </Link>
            </div>

            <DataTable
                data={itemsResponse?.data || []}
                columns={itemColumns}
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
                message={`Anda yakin ingin menghapus item? Tindakan ini tidak bisa dibatalkan.`}
            />

            <DeleteDialog
                open={deleteConfirmation.isOpen && deleteConfirmation.type === "bulk"}
                onOpenChange={(open) => !open && cancelDelete()}
                onConfirm={confirmDelete}
                isPending={bulkDeleteMutation.isPending}
                message={`Anda akan menghapus ${Object.keys(tableState.rowSelection).length} item secara permanen. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?`}
            />
        </div>
    );
}

export default RouteComponent;
