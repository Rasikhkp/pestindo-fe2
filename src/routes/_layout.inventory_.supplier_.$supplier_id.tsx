import { createFileRoute, Navigate, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArchiveTick, ArrowLeft, Chart, WalletMoney } from 'iconsax-react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowDown, ArrowUp } from 'iconsax-react'
import { DebounceInput } from '@/components/DebounceInput'
import {
  api,
  canAccess,
  formatToRupiah,
  fuzzyFilter,
  getApiErrorMessage,
} from '@/lib/utils'
import { PaginationControls } from '@/components/PaginationControls'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute(
  '/_layout/inventory_/supplier_/$supplier_id',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    try {
      const { data } = await api()
        .get('suppliers/' + params.supplier_id)
        .json<any>()
      return data
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error)
      throw new Error(errorMessage.message)
    }
  },
})

function RouteComponent() {
  const { auth } = useAuth()

  if (
    !canAccess(['Sales', 'Superadmin', 'Manager Sales'], auth?.user.role || '')
  ) {
    return <Navigate to="/dashboard" />
  }

  const router = useRouter()
  const supplier = Route.useLoaderData()

  return (
    <>
      <button
        onClick={() => router.history.back()}
        className="flex items-center gap-3 mb-8 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
      >
        <ArrowLeft
          size={16}
          className="transition-all group-hover:-translate-x-1"
        />{' '}
        Kembali
      </button>

      <div className="my-2 text-xl font-medium dark:text-gray-300">
        Kode Supplier #{supplier.code}
      </div>
      <div className="mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
        Detail Informasi Supplier
      </div>

      <div className="flex flex-col gap-4 mb-4 xl:flex-row">
        <div className="text-sm text-gray-600 dark:text-gray-200">
          <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
            <div className="p-4 text-lg font-semibold">Informasi Umum</div>

            <div className="border-b border-gray-200 dark:border-gray-600 my4"></div>

            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="w-40 font-medium">Nama</div>
              <div className="flex-1">{supplier.name}</div>
            </div>

            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="w-40 font-medium">No HP</div>
              <div className="flex-1">{supplier.phone}</div>
            </div>

            <div className="flex p-4">
              <div className="w-40 font-medium">Alamat</div>
              <div className="flex-1">{supplier.address}</div>
            </div>
          </div>
        </div>
        <motion.div
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="flex flex-wrap gap-4 h-fit"
        >
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
            <div className="text-4xl font-bold">
              {formatToRupiah(supplier.total_order_price || 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Nilai Order
            </div>
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
            <div className="text-4xl font-bold">
              {supplier.total_orders || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Order
            </div>
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
            <ArchiveTick variant="TwoTone" className="mb-6" />
            <div className="text-4xl font-bold">
              {supplier.total_completed_orders || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Order Selesai
            </div>
          </motion.div>
        </motion.div>
      </div>

      <OrderTable />
    </>
  )
}

const getOrderColumns = (): ColumnDef<any, any>[] => [
  {
    accessorKey: 'code',
    header: () => 'Kode Order',
    filterFn: 'fuzzy',
  },
  {
    accessorKey: 'total_item',
    header: () => 'Total Item',
    filterFn: 'fuzzy',
  },
  {
    accessorKey: 'total_price',
    header: () => 'Total Harga',
    cell: ({ getValue }) => formatToRupiah(getValue()),
    filterFn: 'fuzzy',
  },
  {
    accessorKey: 'created_at',
    header: () => 'Tanggal Dibuat',
    cell: ({ row }) => {
      const date = new Date(row.original.created_at)
      return format(date, 'dd/MM/yyyy', { locale: id })
    },
    filterFn: 'fuzzy',
  },
  {
    accessorKey: 'status',
    header: () => 'Status',
    filterFn: (row, colId, filterValue) =>
      filterValue === 'all' || filterValue === row.getValue(colId),
    cell: ({ row }) => {
      const status = row.original.status
      let badgeStyle = ''
      let statusText = ''
      if (status === 'pending') {
        badgeStyle = 'bg-yellow-100 text-yellow-800'
        statusText = 'Pending'
      } else if (status === 'in_progress') {
        badgeStyle = 'bg-blue-100 text-blue-800'
        statusText = 'Dalam Proses'
      } else if (status === 'completed') {
        badgeStyle = 'bg-green-100 text-green-800'
        statusText = 'Selesai'
      } else if (status === 'cancelled') {
        badgeStyle = 'bg-red-100 text-red-800'
        statusText = 'Dibatalkan'
      }
      return (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${badgeStyle}`}
        >
          {statusText}
        </span>
      )
    },
  },
]

const OrderTable = () => {
  const supplier = Route.useLoaderData()
  const [data, _setData] = useState(supplier.orders || [])
  const [globalFilter, setGlobalFilter] = useState('')

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  const orderColumns = useMemo(() => getOrderColumns(), [])

  const table = useReactTable({
    data,
    columns: orderColumns,
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: 'fuzzy',
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
  })
  return (
    <div className=" bg-white border border-gray-200 rounded-xl dark:bg-[#30334E] dark:border-gray-600">
      <div className="flex flex-col justify-between gap-2 p-4 border-b border-gray-200 sm:items-center sm:flex-row dark:border-gray-600">
        <div className="text-lg font-medium text-gray-600 dark:text-gray-200">
          Daftar Order
        </div>
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
              value={
                table.getColumn('status')?.getFilterValue()?.toString() || 'all'
              }
              onValueChange={(val) =>
                table.getHeaderGroups()[0].headers[4].column.setFilterValue(val)
              }
            >
              <SelectTrigger className="w-40 dark:border-gray-600">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">Dalam Proses</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
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
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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

      <PaginationControls
        table={table}
        pagination={pagination}
        setPageSize={(size) => table.setPageSize(size)}
      />
    </div>
  )
}
