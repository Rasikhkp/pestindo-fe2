import { ColumnDef, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";

export interface BaseEntity {
    id: number;
    code: string;
    created_at: string;
    updated_at: string;
}

export interface TableState {
    globalFilter: string;
    rowSelection: RowSelectionState;
    sorting: SortingState;
    pagination: PaginationState;
    sortOption: string;
    filters: Record<string, string>;
}

export interface TableProps<T extends BaseEntity> {
    title: string;
    description: string;
    createLink: string;
    createButtonText: string;
    columns: ColumnDef<T, any>[];
    data: T[];
    onDelete: (item: T) => void;
    onBulkDelete: (ids: number[]) => void;
    queryKey: string;
    filters?: { id: string; label: string; options: { value: string; label: string }[] }[];
}
