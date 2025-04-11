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
import { format } from "date-fns";
import { Order } from "@/types/types";

export const Route = createFileRoute('/_layout/inventory_/order')({
  component: RouteComponent,
})

const getOrderColumns = (onDelete: (order: Order) => void): ColumnDef<Order, any>[] => [
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
    accessorKey: "supplier_name",
    header: () => "Nama Supplier",
    filterFn: "fuzzy",
  },
  {
    accessorKey: "item_count",
    header: () => "Jenis Barang",
    filterFn: "fuzzy",
  },
  {
    accessorKey: "total_amount",
    header: () => "Jumlah",
    filterFn: "fuzzy",
    cell: ({ row }) => row.original.total_amount,
  },
  {
    accessorKey: "total_price",
    header: () => "Total Harga",
    cell: ({ row }) => formatToRupiah(row.original.total_price),
    filterFn: "fuzzy",
  },
  {
    accessorKey: "created_at",
    header: () => "Tanggal Dibuat",
    cell: ({ row }) => format(new Date(row.original.created_at), "dd MMMM yyyy"),
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
            <Link to="/inventory/order/$order_id" params={{ order_id: String(row.original.id) }} className="w-full">
              Detail
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link to="/inventory/order/edit/$order_id" params={{ order_id: String(row.original.id) }} className="w-full">
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
  // const { auth } = useAuth();

  // if (!canAccess(["Manager Inventory", "Superadmin"], auth?.user.role || "")) {
  //   return <Navigate to="/dashboard" />;
  // }

  const [, setError] = useAtom(errorAtom);
  const {
    data: ordersResponse,
    refetch,
    isLoading,
    isRefetching,
    error: queryError,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => api().get("orders").json<{ data: Order[] }>(),
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
  } = useTable<Order>("orders");

  const orderColumns = useMemo(() => getOrderColumns(handleSingleDelete), []);

  return (
    <div>
      <h2 className="my-2 text-xl font-medium dark:text-gray-300">Order</h2>
      <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
        Daftar Order Inventory
        <Link to="/inventory/order/create">
          <Button className="text-gray-200 transition-all bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95">Tambah Order</Button>
        </Link>
      </div>

      <DataTable
        data={ordersResponse?.data || []}
        columns={orderColumns}
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
        message={`Anda yakin ingin menghapus order? Tindakan ini tidak bisa dibatalkan.`}
      />

      <DeleteDialog
        open={deleteConfirmation.isOpen && deleteConfirmation.type === "bulk"}
        onOpenChange={(open) => !open && cancelDelete()}
        onConfirm={confirmDelete}
        isPending={bulkDeleteMutation.isPending}
        message={`Anda akan menghapus ${Object.keys(tableState.rowSelection).length} order secara permanen. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?`}
      />
    </div>
  );
}

export default RouteComponent;
