import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { PaginationState } from "@tanstack/react-table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PaginationControls = ({ table, pagination, setPageSize }: { table: any; pagination: PaginationState; setPageSize: (size: number) => void }) => {
    const totalRows = table.getFilteredRowModel().rows.length;
    const startRow = pagination.pageIndex * pagination.pageSize + 1;
    const endRow = Math.min(startRow + pagination.pageSize - 1, totalRows);
    const summary = totalRows > 1 ? `${startRow} - ${endRow} of ${totalRows}` : `${totalRows} of ${totalRows}`;

    const createPageArray = (n: number) => Array.from({ length: n }, (_, i) => i);

    const getPageButtons = () => {
        const pageCount = table.getPageCount();
        if (pageCount > 3) {
            if (pagination.pageIndex === 0) return [0, 1, 2, "last"];
            if (pagination.pageIndex === pageCount - 1) return ["first", pageCount - 3, pageCount - 2, pageCount - 1];
            return ["first", pagination.pageIndex - 1, pagination.pageIndex, pagination.pageIndex + 1, "last"];
        }
        return createPageArray(pageCount);
    };

    const pageButtons = getPageButtons();

    return (
        <div className="flex flex-col items-center justify-between gap-4 p-4 text-sm sm:flex-row-reverse">
            <div className="flex flex-col items-center gap-4 text-gray-600 sm:flex-row dark:text-gray-200">
                <div className="text-gray-500">{summary}</div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="flex items-center justify-center transition-all rounded size-6 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-700"
                    >
                        <ArrowLeft2 size={14} />
                    </button>
                    {pageButtons.map((btn, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (btn === "first") table.firstPage();
                                else if (btn === "last") table.lastPage();
                                else table.setPageIndex(Number(btn));
                            }}
                            className={`flex items-center justify-center transition-all rounded size-6 dark:hover:bg-gray-600 dark:active:bg-gray-700 hover:bg-gray-100 active:bg-gray-200 ${
                                pagination.pageIndex === btn ? "bg-gray-100 dark:bg-gray-600" : ""
                            }`}
                        >
                            {btn === "first" || btn === "last" ? "..." : Number(btn) + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="flex items-center justify-center transition-all rounded size-6 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-700"
                    >
                        <ArrowRight2 size={14} />
                    </button>
                </div>
            </div>
            <p className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                Rows per page:
                <Select value={pagination.pageSize.toString()} onValueChange={(val) => setPageSize(Number(val))}>
                    <SelectTrigger className="w-20 dark:border-gray-600">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </p>
        </div>
    );
};
