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
import { Supplier } from "@/types/types";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_layout/sales_/supplier")({
    component: RouteComponent,
});

const getSupplierColumns = (onDelete: (supplier: Supplier) => void): ColumnDef<Supplier, any>[] => [
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
        accessorKey: "name",
        header: () => "Nama",
        filterFn: "fuzzy",
    },
    {
        accessorKey: "total_orders",
        header: () => "Total Order",
        filterFn: "fuzzy",
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
                        <Link
                            to="/sales/supplier/$supplier_id"
                            params={{
                                supplier_id: String(row.original.id),
                            }}
                            className="w-full"
                        >
                            Detail
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Link
                            to="/sales/supplier/edit/$supplier_id"
                            params={{
                                supplier_id: String(row.original.id),
                            }}
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
    const { auth } = useAuth();

    if (!canAccess(["Sales", "Superadmin", "Manager Sales"], auth?.user.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    const [, setError] = useAtom(errorAtom);
    const {
        data: suppliersResponse,
        refetch,
        isLoading,
        error: queryError,
    } = useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => api().get("suppliers").json<{ data: Supplier[] }>(),
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
    } = useTable<Supplier>("suppliers");

    const supplierColumns = useMemo(() => getSupplierColumns(handleSingleDelete), []);

    return (
        <div>
            <h2 className="my-2 text-xl font-medium dark:text-gray-300">Supplier</h2>
            <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
                Daftar dan Informasi Supplier
                <Link to="/sales/supplier/create">
                    <Button className="text-gray-200 transition-all bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95">Tambah Supplier</Button>
                </Link>
            </div>

            <DataTable
                data={suppliersResponse?.data || []}
                columns={supplierColumns}
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
                onRefresh={refetch}
                isLoading={isLoading}
                onBulkDelete={handleBulkDelete}
                isBulkDeletePending={bulkDeleteMutation.isPending}
                selectedCount={Object.keys(tableState.rowSelection).length}
            />

            <DeleteDialog
                open={deleteConfirmation.isOpen}
                onOpenChange={cancelDelete}
                onConfirm={confirmDelete}
                isPending={deleteMutation.isPending}
                message="Apakah Anda yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan."
            />
        </div>
    );
}
