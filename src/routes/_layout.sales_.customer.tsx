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
import { Customer } from "@/types/types";

export const Route = createFileRoute("/_layout/sales_/customer")({
  component: RouteComponent,
});

const getCustomerColumns = (onDelete: (customer: Customer) => void): ColumnDef<Customer, any>[] => [
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
  },
  {
    accessorKey: "name",
    header: () => "Nama",
    filterFn: "fuzzy",
  },
  {
    accessorKey: "phone",
    header: () => "No HP",
    filterFn: "fuzzy",
  },
  {
    accessorKey: "total_jobs",
    header: () => "Total Pekerjaan",
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
              to="/sales/customer/$customer_id"
              params={{
                customer_id: String(row.original.id),
              }}
              className="w-full"
            >
              Detail
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link
              to="/sales/customer/edit/$customer_id"
              params={{
                customer_id: String(row.original.id),
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
  const queryClient = useQueryClient();
  const {
    data: customersResponse,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => api().get("customers").json<{ data: Customer[] }>(),
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSingleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "id", desc: true }]);
  const [sortOption, setSortOption] = useState("newest");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => api().delete(`customers/${id}`).json(),
    onSuccess: () => {
      toast.success("Pelanggan berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setRowSelection({});
    },
    onError: (error) => {
      toast.error("Gagal menghapus pelanggan");
      console.error("Delete error:", error);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => api().post("customers/delete-many", { json: { ids } }).json(),
    onSuccess: () => {
      toast.success(`${Object.keys(rowSelection).length} pelanggan berhasil dihapus`);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setRowSelection({});
    },
    onError: (error) => {
      toast.error("Gagal menghapus pelanggan");
      console.error("Bulk delete error:", error);
      (error as any).response.json().then((err: any) => console.log("Error details:", err));
    },
  });

  const handleSortOptionChange = (value: string) => {
    setSortOption(value);
    setSorting([{ id: "id", desc: value === "newest" }]);
  };

  const handleSingleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setTimeout(() => {
      setSingleDeleteOpen(true);
    }, 100);
  };

  const handleBulkDelete = () => {
    setTimeout(() => {
      setBulkDeleteOpen(true);
    }, 100);
  };

  const confirmSingleDelete = () => {
    if (selectedCustomer) {
      deleteCustomerMutation.mutate(selectedCustomer.id);
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

  const customerColumns = useMemo(() => getCustomerColumns(handleSingleDelete), []);

  const table = useReactTable({
    data: customersResponse?.data || [],
    columns: customerColumns,
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
      <h2 className="my-2 text-xl font-medium dark:text-gray-300">Pelanggan</h2>
      <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
        Daftar dan Informasi Pelanggan
        <Link to="/sales/customer/create">
          <Button className="text-gray-200 transition-all bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95">
            Tambah Pelanggan
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
              disabled={isLoading || deleteCustomerMutation.isPending || bulkDeleteMutation.isPending}
            >
              <ArrowRotateRight className={isLoading ? "animate-spin" : ""} />
            </Button>
            {Object.keys(rowSelection).length > 0 && (
              <Button
                onClick={handleBulkDelete}
                className="transition-all bg-red-500 hover:bg-red-600 active:bg-red-700 active:scale-[.99] text-gray-200"
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Menghapus..." : `Hapus (${Object.keys(rowSelection).length})`}
              </Button>
            )}
            <Select
              value={table.getColumn("type")?.getFilterValue()?.toString() || "all"}
              onValueChange={(val) => table.getHeaderGroups()[0].headers[2].column.setFilterValue(val)}
            >
              <SelectTrigger className="w-40 dark:border-gray-600">
                <SelectValue placeholder="Pilih Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
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

        <PaginationControls table={table} pagination={pagination} setPageSize={(size) => table.setPageSize(size)} />
      </div>

      <DeleteDialog
        open={isSingleDeleteOpen}
        onOpenChange={setSingleDeleteOpen}
        onConfirm={confirmSingleDelete}
        isPending={deleteCustomerMutation.isPending}
        message={`Anda yakin ingin menghapus pelanggan ${selectedCustomer?.name}? Tindakan ini tidak bisa dibatalkan.`}
      />

      <DeleteDialog
        open={isBulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={confirmBulkDelete}
        isPending={bulkDeleteMutation.isPending}
        message={`Anda akan menghapus ${Object.keys(rowSelection).length} pelanggan secara permanen. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?`}
      />
    </div>
  );
}
