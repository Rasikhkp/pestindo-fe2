import { createFileRoute, useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArchiveTick, ArrowLeft, Chart, Clock, CloseCircle, Timer, WalletMoney } from "iconsax-react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp } from "iconsax-react";
import { DebounceInput } from "@/components/DebounceInput";
import { api, formatToRupiah, fuzzyFilter } from "@/lib/utils";
import { PaginationControls } from "@/components/PaginationControls";
import { Job } from "@/types/types";

export const Route = createFileRoute("/_layout/sales_/customer_/$customer_id")({
    component: RouteComponent,
    loader: async ({ params }) => {
        const { data } = await api()
            .get("customers/" + params.customer_id)
            .json<any>();
        return data;
    },
});

function RouteComponent() {
    const router = useRouter();
    const { customer_id } = Route.useParams();
    const customer = Route.useLoaderData();

    const idNumberLabel = customer.type === "company" ? "NPWP" : "NIK";
    const addressLabel = customer.type === "company" ? "Alamat NPWP" : "Alamat KTP";
    return (
        <>
            <button
                onClick={() => router.history.back()}
                className="flex items-center gap-3 mb-8 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft size={16} className="transition-all group-hover:-translate-x-1" /> Kembali
            </button>

            <div className="my-2 text-xl font-medium dark:text-gray-300">Kode Pelanggan #{customer.code}</div>
            <div className="mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">Detail Informasi Pelanggan</div>

            <div className="flex flex-col gap-4 mb-4 xl:flex-row">
                <div className="text-sm text-gray-600 dark:text-gray-200">
                    <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
                        <div className="p-4 text-lg font-semibold">Informasi Umum</div>

                        <div className="border-b border-gray-200 dark:border-gray-600 my4"></div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">Tipe</div>
                            <div className="flex-1">{customer.type === "company" ? "Company" : "Individual"}</div>
                        </div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">
                                {customer.type === "company" ? "Nama Perusahaan" : "Nama"}
                            </div>
                            <div className="flex-1">{customer.name}</div>
                        </div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">No HP</div>
                            <div className="flex-1">{customer.phone}</div>
                        </div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">{idNumberLabel}</div>
                            <div className="flex-1">{customer.npwp || customer.nik}</div>
                        </div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">{addressLabel}</div>
                            <div className="flex-1">
                                {customer.type === "company" ? customer.npwp_address : customer.ktp_address}
                            </div>
                        </div>

                        <div className="flex p-4">
                            <div className="w-40 font-medium">Alamat Saat Ini</div>
                            <div className="flex-1">{customer.address}</div>
                        </div>
                    </div>
                </div>
                <motion.div transition={{ duration: 0.8, ease: "easeInOut" }} className="flex flex-wrap gap-4 h-fit">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 1 * 0.1,
                        }}
                        className="flex-1 p-4 space-y-2 text-gray-600 border border-gray-200 dark:border-gray-600 dark:text-gray-200 h-fit basis-80 min-w-80 rounded-xl"
                    >
                        <WalletMoney variant="TwoTone" className="mb-6" />
                        <div className="text-4xl font-bold">Rp 100.050.000</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Nilai Kontrak</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 2 * 0.1,
                        }}
                        className="flex-1 p-4 space-y-2 text-gray-600 border border-gray-200 dark:border-gray-600 dark:text-gray-200 h-fit basis-40 min-w-40 rounded-xl"
                    >
                        <Chart variant="TwoTone" className="mb-6" />
                        <div className="text-4xl font-bold">10</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Pekerjaan</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 3 * 0.1,
                        }}
                        className="flex-1 p-4 space-y-2 text-gray-600 border border-gray-200 dark:border-gray-600 dark:text-gray-200 h-fit basis-40 min-w-40 rounded-xl"
                    >
                        <Clock variant="TwoTone" className="mb-6" />
                        <div className="text-4xl font-bold">1</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Pekerjaan Pending</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 4 * 0.1,
                        }}
                        className="flex-1 p-4 space-y-2 text-gray-600 border border-gray-200 dark:border-gray-600 dark:text-gray-200 h-fit basis-40 min-w-40 rounded-xl"
                    >
                        <Timer variant="TwoTone" className="mb-6" />
                        <div className="text-4xl font-bold">1</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Pekerjaan Berjalan</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 5 * 0.1,
                        }}
                        className="flex-1 p-4 space-y-2 text-gray-600 border border-gray-200 dark:border-gray-600 dark:text-gray-200 h-fit basis-40 min-w-40 rounded-xl"
                    >
                        <ArchiveTick variant="TwoTone" className="mb-6" />
                        <div className="text-4xl font-bold">10</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Pekerjaan Selesai</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 6 * 0.1,
                        }}
                        className="flex-1 p-4 space-y-2 text-gray-600 border border-gray-200 dark:border-gray-600 dark:text-gray-200 h-fit basis-40 min-w-40 rounded-xl"
                    >
                        <CloseCircle variant="TwoTone" className="mb-6" />
                        <div className="text-4xl font-bold">10</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Pekerjaan Dibatalkan</div>
                    </motion.div>
                </motion.div>
            </div>

            <JobTable />
        </>
    );
}

const jobs: Job[] = [
    {
        job_id: 1,
        type: "residency",
        start_date: "2024-01-10",
        end_date: "2024-02-15",
        status: "pending",
        contract_value: 5000,
    },
    {
        job_id: 2,
        type: "commercial",
        start_date: "2024-02-05",
        end_date: "2024-03-20",
        status: "on_progress",
        contract_value: 15000,
    },
    {
        job_id: 3,
        type: "residency",
        start_date: "2024-03-01",
        end_date: "2024-04-10",
        status: "finished",
        contract_value: 7500,
    },
    {
        job_id: 4,
        type: "commercial",
        start_date: "2024-04-12",
        end_date: "2024-05-25",
        status: "canceled",
        contract_value: 20000,
    },
    {
        job_id: 5,
        type: "residency",
        start_date: "2024-05-02",
        end_date: "2024-06-18",
        status: "pending",
        contract_value: 6800,
    },
    {
        job_id: 6,
        type: "commercial",
        start_date: "2024-06-10",
        end_date: "2024-07-30",
        status: "on_progress",
        contract_value: 14000,
    },
    {
        job_id: 7,
        type: "residency",
        start_date: "2024-07-05",
        end_date: "2024-08-15",
        status: "finished",
        contract_value: 8900,
    },
    {
        job_id: 8,
        type: "commercial",
        start_date: "2024-08-20",
        end_date: "2024-09-30",
        status: "canceled",
        contract_value: 21500,
    },
    {
        job_id: 9,
        type: "residency",
        start_date: "2024-09-10",
        end_date: "2024-10-22",
        status: "pending",
        contract_value: 7200,
    },
    {
        job_id: 10,
        type: "commercial",
        start_date: "2024-10-05",
        end_date: "2024-11-25",
        status: "on_progress",
        contract_value: 17500,
    },
    {
        job_id: 11,
        type: "residency",
        start_date: "2024-11-15",
        end_date: "2024-12-28",
        status: "finished",
        contract_value: 9100,
    },
    {
        job_id: 12,
        type: "commercial",
        start_date: "2024-12-10",
        end_date: "2025-01-25",
        status: "canceled",
        contract_value: 19500,
    },
    {
        job_id: 13,
        type: "residency",
        start_date: "2025-01-12",
        end_date: "2025-02-20",
        status: "pending",
        contract_value: 7400,
    },
    {
        job_id: 14,
        type: "commercial",
        start_date: "2025-02-08",
        end_date: "2025-03-30",
        status: "on_progress",
        contract_value: 16500,
    },
    {
        job_id: 15,
        type: "residency",
        start_date: "2025-03-15",
        end_date: "2025-04-28",
        status: "finished",
        contract_value: 8100,
    },
    {
        job_id: 16,
        type: "commercial",
        start_date: "2025-04-10",
        end_date: "2025-05-22",
        status: "canceled",
        contract_value: 18000,
    },
    {
        job_id: 17,
        type: "residency",
        start_date: "2025-05-18",
        end_date: "2025-06-30",
        status: "pending",
        contract_value: 6700,
    },
    {
        job_id: 18,
        type: "commercial",
        start_date: "2025-06-12",
        end_date: "2025-07-25",
        status: "on_progress",
        contract_value: 15500,
    },
    {
        job_id: 19,
        type: "residency",
        start_date: "2025-07-05",
        end_date: "2025-08-20",
        status: "finished",
        contract_value: 9200,
    },
    {
        job_id: 20,
        type: "commercial",
        start_date: "2025-08-10",
        end_date: "2025-09-28",
        status: "canceled",
        contract_value: 21000,
    },
    {
        job_id: 21,
        type: "residency",
        start_date: "2025-09-12",
        end_date: "2025-10-30",
        status: "pending",
        contract_value: 7300,
    },
    {
        job_id: 22,
        type: "commercial",
        start_date: "2025-10-08",
        end_date: "2025-11-20",
        status: "on_progress",
        contract_value: 16000,
    },
];

const getJobColumns = (): ColumnDef<Job, any>[] => [
    {
        accessorKey: "job_id",
        header: () => "ID Pekerjaan",
        filterFn: "fuzzy",
    },
    {
        accessorKey: "type",
        header: () => "Tipe",
        filterFn: (row, colId, filterValue) => filterValue === "all" || filterValue === row.getValue(colId),
    },
    {
        accessorKey: "start_date",
        header: () => "Tanggal",
        cell: ({ row }) => `${row.original.start_date} - ${row.original.end_date}`,
        filterFn: "fuzzy",
    },
    {
        accessorKey: "contract_value",
        header: () => "Nilai Kontrak",
        cell: ({ getValue }) => formatToRupiah(getValue()),
        filterFn: "fuzzy",
    },
];

const JobTable = () => {
    const [data, _setData] = useState(jobs);
    const [globalFilter, setGlobalFilter] = useState("");

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 5,
    });

    const jobColumns = useMemo(() => getJobColumns(), []);

    const table = useReactTable({
        data,
        columns: jobColumns,
        filterFns: { fuzzy: fuzzyFilter },
        globalFilterFn: "fuzzy",
        state: {
            globalFilter,
            pagination,
        },
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });
    return (
        <div className=" bg-white border border-gray-200 rounded-xl dark:bg-[#30334E] dark:border-gray-600">
            <div className="flex flex-col justify-between gap-2 p-4 border-b border-gray-200 sm:items-center sm:flex-row dark:border-gray-600">
                <div className="text-lg font-medium text-gray-600 dark:text-gray-200">Daftar Pekerjaan</div>
                <div className="flex gap-2">
                    <DebounceInput
                        value={globalFilter}
                        onChange={(val) => setGlobalFilter(val)}
                        type="search"
                        placeholder="Cari disini..."
                        className="transition-all outline-none dark:border-gray-600 max-w-96 hover:ring-blue-300 hover:ring-1 dark:hover:ring-gray-700 dark:focus-visible:ring-gray-800"
                    />
                    <div className="flex gap-2">
                        <Select
                            value={table.getColumn("type")?.getFilterValue()?.toString() || "all"}
                            onValueChange={(val) => table.getHeaderGroups()[0].headers[1].column.setFilterValue(val)}
                        >
                            <SelectTrigger className="w-40 dark:border-gray-600">
                                <SelectValue placeholder="Plih Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="residency">Recidency</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup, i) => (
                            <tr
                                key={i}
                                className="text-left text-gray-400  bg-gray-50 dark:bg-[#2e3149] border-b border-gray-200 dark:border-gray-600"
                            >
                                {headerGroup.headers.map((header, i) => (
                                    <th key={i} className="p-3 font-medium">
                                        <div
                                            onClick={header.column.getToggleSortingHandler()}
                                            className="flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                            {{
                                                asc: <ArrowUp size={14} />,
                                                desc: <ArrowDown size={14} />,
                                            }[header.column.getIsSorted() as string] ?? null}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row, i) => (
                            <tr
                                key={i}
                                className="text-left text-gray-600 border-b divide-x divide-gray-200 dark:divide-gray-600 dark:border-gray-600 dark:text-gray-300"
                            >
                                {row.getVisibleCells().map((cell, i) => (
                                    <td className="p-3 whitespace-nowrap" key={i}>
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
};
