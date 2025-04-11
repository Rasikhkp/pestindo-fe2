import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/utils";
import { toast } from "sonner";
import { TableState } from "@/types/table";

interface UseTableOptions<T> {
    onDeleteSuccess?: (deletedId: number) => void;
    onBulkDeleteSuccess?: (deletedIds: number[]) => void;
}

export function useTable<T extends { id: number }>(queryKey: string, options?: UseTableOptions<T>) {
    const queryClient = useQueryClient();
    const [tableState, setTableState] = useState<TableState>({
        globalFilter: "",
        rowSelection: {},
        sorting: [{ id: "id", desc: true }],
        pagination: { pageIndex: 0, pageSize: 5 },
        sortOption: "newest",
        filters: {},
    });
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        type: "single" | "bulk";
        item?: T;
        ids?: number[];
    }>({
        isOpen: false,
        type: "single",
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => api().delete(`${queryKey}/${id}`).json(),
        onSuccess: (_, id) => {
            toast.success(`1 data berhasil dihapus`);
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            setTableState((prev) => ({ ...prev, rowSelection: {} }));
            setDeleteConfirmation({ isOpen: false, type: "single" });

            if (options?.onDeleteSuccess) {
                options.onDeleteSuccess(id);
            }
        },
        onError: (error) => {
            toast.error(`Gagal menghapus`);
            console.error("Delete error:", error);
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: number[]) => api().post(`${queryKey}/delete-many`, { json: { ids } }).json(),
        onSuccess: (_, ids) => {
            toast.success(`${Object.keys(tableState.rowSelection).length} ${queryKey} berhasil dihapus`);
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            setTableState((prev) => ({ ...prev, rowSelection: {} }));
            setDeleteConfirmation({ isOpen: false, type: "bulk" });

            if (options?.onBulkDeleteSuccess) {
                options.onBulkDeleteSuccess(ids);
            }
        },
        onError: (error) => {
            toast.error(`Gagal menghapus ${queryKey}`);
            console.error("Bulk delete error:", error);
            (error as any).response.json().then((err: any) => console.log("Error details:", err));
        },
    });

    const handleSortOptionChange = (value: string) => {
        setTableState((prev) => ({
            ...prev,
            sortOption: value,
            sorting: [{ id: "id", desc: value === "newest" }],
        }));
    };

    const handleSingleDelete = (item: T) => {
        setTimeout(() => {
            setDeleteConfirmation({ isOpen: true, type: "single", item });
        }, 100);
    };

    const handleBulkDelete = () => {
        const selectedIds = Object.keys(tableState.rowSelection).map(Number);
        if (selectedIds.length > 0) {
            setTimeout(() => {
                setDeleteConfirmation({ isOpen: true, type: "bulk", ids: selectedIds });
            }, 100);
        }
    };

    const confirmDelete = () => {
        if (deleteConfirmation.type === "single" && deleteConfirmation.item) {
            deleteMutation.mutate(deleteConfirmation.item.id);
        } else if (deleteConfirmation.type === "bulk" && deleteConfirmation.ids) {
            bulkDeleteMutation.mutate(deleteConfirmation.ids);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({ isOpen: false, type: "single" });
    };

    return {
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
    };
}
