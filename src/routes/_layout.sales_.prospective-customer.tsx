import { useState, useMemo } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@heroui/checkbox";
import { More, Buildings2, User } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api, canAccess } from "@/lib/utils"; // Keep api import for future use
import { DeleteDialog } from "@/components/DeleteDialog";
import { DataTable } from "@/components/DataTable";
import { useTable } from "@/hooks/useTable";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query"; // Keep for delete

// Define the ProspectiveCustomer type
export interface ProspectiveCustomer {
    id: number;
    code: string;
    type: 'company' | 'individual';
    name: string;
    phone: string;
    status: 0 | 25 | 75; // 0%, 25%, 75%
}

export const Route = createFileRoute("/_layout/sales_/prospective-customer")({
    component: RouteComponent,
});

// Mock Data
export const mockProspectiveCustomers: ProspectiveCustomer[] = [
    { id: 1, code: "PC001", type: "company", name: "PT Maju Mundur", phone: "081234567890", status: 25 },
    { id: 2, code: "PC002", type: "individual", name: "Budi Santoso", phone: "081112233445", status: 75 },
    { id: 3, code: "PC003", type: "company", name: "CV Laris Manis", phone: "082233445566", status: 0 },
    { id: 4, code: "PC004", type: "individual", name: "Siti Aminah", phone: "087788990011", status: 25 },
    { id: 5, code: "PC005", type: "company", name: "UD Sejahtera", phone: "085566778899", status: 75 },
    { id: 6, code: "PC006", type: "individual", name: "Agus Salim", phone: "089988776655", status: 0 },
];

// Column Definitions
const getProspectiveCustomerColumns = (onDelete: (customer: ProspectiveCustomer) => void): ColumnDef<ProspectiveCustomer, any>[] => [
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
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full">
                    {type === "company" ? (
                        <>
                            <Buildings2 size={16} className="text-blue-500" />
                            <span className="text-blue-700 dark:text-blue-300">Company</span>
                        </>
                    ) : (
                        <>
                            <User size={16} className="text-green-500" />
                            <span className="text-green-700 dark:text-green-300">Individual</span>
                        </>
                    )}
                </div>
            );
        },
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
        accessorKey: "status",
        header: () => "Status",
        filterFn: (row, colId, filterValue) => {
            const value = row.getValue(colId);
            return filterValue === "all" || (value !== undefined && filterValue === String(value));
        },
        cell: ({ row }) => {
            const status = row.original.status;

            let bgColor = "bg-blue-200";
            switch (status) {
                case 0:
                    bgColor = "bg-red-200";
                    break;
                case 25:
                    bgColor = "bg-yellow-200";
                    break;
                case 75:
                    bgColor = "bg-green-200";
                    break;
            }


            return (
                <div className="flex justify-center">

                    <Badge variant="outline" className={bgColor}>
                        {status}%
                    </Badge>
                </div>
            );
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
                        <Link to="/sales/prospective-customer/$prospective_customer_id" params={{
                            prospective_customer_id: String(row.original.id),
                        }}>
                            Detail
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <button
                            onClick={() => console.log(`Edit customer ${row.original.id}`)}
                            className="w-full text-left"
                        >
                            Edit
                        </button>
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

    // Mock data state
    const [prospectiveCustomers, setProspectiveCustomers] = useState(mockProspectiveCustomers);
    const isLoading = false; // Set to false as we are using mock data

    // Use simplified table state management for mock data
    const {
        tableState,
        setTableState,
        handleSortOptionChange,
        deleteConfirmation,
        confirmDelete,
        cancelDelete,
        handleSingleDelete,
        handleBulkDelete,
    } = useTable<ProspectiveCustomer>("prospectiveCustomers"); // Identifier for the hook instance

    // Mock delete mutations
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            console.log("Mock deleting prospective customer:", id);
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setProspectiveCustomers(prev => prev.filter(pc => pc.id !== id));
            return { success: true };
        },
        onSuccess: () => {
            cancelDelete(); // Close dialog on success
        },
        onError: (error) => {
            console.error("Mock delete failed:", error);
            alert("Failed to delete prospective customer.");
            cancelDelete();
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: number[]) => {
            console.log("Mock bulk deleting prospective customers:", ids);
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setProspectiveCustomers(prev => prev.filter(pc => !ids.includes(pc.id)));
            return { success: true };
        },
        onSuccess: () => {
            setTableState(prev => ({ ...prev, rowSelection: {} })); // Clear selection
            cancelDelete(); // Close dialog on success
        },
        onError: (error) => {
            console.error("Mock bulk delete failed:", error);
            alert("Failed to delete selected prospective customers.");
            cancelDelete();
        }
    });

    const handleConfirmDelete = () => {
        if (deleteConfirmation.type === 'single' && deleteConfirmation.item) {
            deleteMutation.mutate(deleteConfirmation.item.id);
        } else if (deleteConfirmation.type === 'bulk' && deleteConfirmation.ids) {
            bulkDeleteMutation.mutate(deleteConfirmation.ids);
        }
    };

    const prospectiveCustomerColumns = useMemo(() => getProspectiveCustomerColumns(handleSingleDelete), [tableState.rowSelection]);

    const filters = [
        {
            id: "type",
            label: "Tipe",
            options: [
                { value: "all", label: "Semua" },
                { value: "individual", label: "Individual" },
                { value: "company", label: "Company" },
            ],
        },
        {
            id: "status",
            label: "Status",
            options: [
                { value: "all", label: "Semua" },
                { value: "0", label: "0%" },
                { value: "25", label: "25%" },
                { value: "75", label: "75%" },
            ],
        },
    ];

    return (
        <div>
            <h2 className="my-2 text-xl font-medium dark:text-gray-300">Calon Pelanggan</h2>
            <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
                Daftar dan Informasi Calon Pelanggan
                <Button
                    className="text-gray-200 transition-all bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95"
                    onClick={() => console.log("Navigate to create prospective customer")}
                >
                    Tambah Calon Pelanggan
                </Button>
            </div>

            <DataTable
                data={prospectiveCustomers}
                columns={prospectiveCustomerColumns}
                globalFilter={tableState.globalFilter}
                onGlobalFilterChange={(value) => setTableState((prev) => ({ ...prev, globalFilter: value }))}
                rowSelection={tableState.rowSelection}
                onRowSelectionChange={(updater) =>
                    setTableState((prev) => ({
                        ...prev,
                        rowSelection: typeof updater === "function" ? updater(prev.rowSelection) : updater,
                    }))
                }
                sorting={tableState.sorting}
                onSortingChange={(updater) =>
                    setTableState((prev) => ({
                        ...prev,
                        sorting: typeof updater === "function" ? updater(prev.sorting) : updater,
                    }))
                }
                pagination={tableState.pagination}
                onPaginationChange={(updater) =>
                    setTableState((prev) => ({
                        ...prev,
                        pagination: typeof updater === "function" ? updater(prev.pagination) : updater,
                    }))
                }
                sortOption={tableState.sortOption} // Keep if useTable provides it
                onSortOptionChange={handleSortOptionChange} // Keep if useTable provides it
                filters={filters}
                onRefresh={() => setProspectiveCustomers(mockProspectiveCustomers)} // Mock refresh
                isLoading={isLoading}
                onBulkDelete={handleBulkDelete}
                isBulkDeletePending={bulkDeleteMutation.isPending}
                selectedCount={Object.keys(tableState.rowSelection).length}
            />

            <DeleteDialog
                open={deleteConfirmation.isOpen && deleteConfirmation.type === "single"}
                onOpenChange={(open) => !open && cancelDelete()}
                onConfirm={handleConfirmDelete}
                isPending={deleteMutation.isPending}
                message={`Anda yakin ingin menghapus calon pelanggan ini? Tindakan ini tidak bisa dibatalkan.`}
            />

            <DeleteDialog
                open={deleteConfirmation.isOpen && deleteConfirmation.type === "bulk"}
                onOpenChange={(open) => !open && cancelDelete()}
                onConfirm={handleConfirmDelete}
                isPending={bulkDeleteMutation.isPending}
                message={`Anda akan menghapus ${Object.keys(tableState.rowSelection).length} calon pelanggan secara permanen. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?`}
            />
        </div>
    );
}

