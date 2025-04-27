import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/DataTable'
import { DeleteDialog } from '@/components/DeleteDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api, canAccess, getApiErrorMessage } from '@/lib/utils'
import { useTable } from '@/hooks/useTable'
import { errorAtom } from '@/store/error'
import { useAuth } from '@/hooks/useAuth'
import { useScheduleMutations } from '@/hooks/useScheduleMutations'
import { CustomCalendar } from '@/components/calendar/CustomCalendar'
import {
  ScheduleForm,
  ScheduleFormValues,
} from '@/components/schedule/ScheduleForm'
import { ScheduleDetail } from '@/components/schedule/ScheduleDetail'
import { Schedule, Job, Employee, CalendarEvent } from '@/types/types'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@heroui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { More } from 'iconsax-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/_layout/service_/schedule')({
  component: RouteComponent,
})

const getScheduleColumns = (
  onEdit: (schedule: Schedule) => void,
  onDelete: (schedule: Schedule) => void,
): ColumnDef<Schedule, any>[] => [
  {
    id: 'select',
    accessorKey: 'id',
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
    accessorKey: 'job.code',
    header: () => 'ID Pekerjaan',
    filterFn: 'fuzzy',
  },
  {
    accessorKey: 'job.customer.name',
    header: () => 'Nama Pelanggan',
    filterFn: 'fuzzy',
  },
  {
    accessorKey: 'date',
    header: () => 'Tanggal',
    cell: ({ row }) => format(new Date(row.original.date), 'dd MMMM yyyy'),
    filterFn: 'fuzzy',
  },
  {
    accessorKey: 'employees',
    header: () => 'Teknisi',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.employees.map((employee, index) => (
          <span
            key={index}
            className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
          >
            {employee.name}
          </span>
        ))}
      </div>
    ),
    filterFn: 'fuzzy',
  },
  {
    accessorKey: 'id',
    header: '',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 transition-all rounded hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-700">
            <More className="rotate-90" size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => onEdit(row.original)}
            className="cursor-pointer"
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(row.original)}
            className="cursor-pointer"
          >
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

/**
 * Main component for the business schedule page
 * Contains both table and calendar views for schedule management
 */
function RouteComponent() {
  // const { auth } = useAuth();

  // // Redirect if not authorized
  // if (!canAccess(["Superadmin", "Manager Operasional"], auth?.user.role || "")) {
  //     return <Navigate to="/dashboard" />;
  // }

  // State for displaying modals
  const [activeTab, setActiveTab] = useState('table')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  )
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [, setError] = useAtom(errorAtom)

  // API data fetching
  const {
    data: schedulesResponse,
    refetch: refetchSchedules,
    isLoading: isLoadingSchedules,
    isRefetching: isRefetchingSchedules,
    error: schedulesError,
  } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => api().get('schedules').json<{ data: Schedule[] }>(),
  })

  const { data: jobsResponse, error: jobsError } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => api().get('jobs').json<{ data: Job[] }>(),
  })

  const { data: employeesResponse, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => api().get('employee').json<{ data: Employee[] }>(),
  })

  // Get mutations from custom hook
  const { createSchedule, updateSchedule, isCreating, isUpdating } =
    useScheduleMutations()

  // DataTable setup
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
  } = useTable<Schedule>('schedules')

  // Create form for schedule inputs
  const createForm = useForm<ScheduleFormValues>()

  // Edit form for schedule updates
  const editForm = useForm<ScheduleFormValues>()

  // Filter technicians
  const technicians = useMemo(() => {
    if (!employeesResponse?.data) return []
    return employeesResponse.data.filter((emp) => emp.role_name === 'Teknisi')
  }, [employeesResponse?.data])

  // Format calendar events
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    if (!schedulesResponse?.data) return []
    return schedulesResponse.data.map((schedule) => ({
      id: schedule.id,
      title: `#${schedule.job.code} - ${schedule.job.customer.name}`,
      start: new Date(schedule.date),
      end: new Date(schedule.date),
      resource: schedule,
    }))
  }, [schedulesResponse?.data])

  // Handle API errors
  useEffect(() => {
    if (schedulesError) {
      getApiErrorMessage(schedulesError).then((message) => setError(message))
      console.error('Schedules error:', schedulesError)
    }
    if (jobsError) {
      getApiErrorMessage(jobsError).then((message) => setError(message))
      console.error('Jobs error:', jobsError)
    }
    if (employeesError) {
      getApiErrorMessage(employeesError).then((message) => setError(message))
      console.error('Employees error:', employeesError)
    }
  }, [schedulesError, jobsError, employeesError, setError])

  // Event handlers
  const handleCreateSchedule = (data: ScheduleFormValues) => {
    createSchedule(data)
    setIsCreateModalOpen(false)
  }

  const handleUpdateSchedule = (data: ScheduleFormValues) => {
    if (!selectedSchedule) return
    updateSchedule(selectedSchedule.id, data)
    setIsEditModalOpen(false)
  }

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setTimeout(() => {
      setIsEditModalOpen(true)
    }, 100)
  }

  const handleViewDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setIsDetailModalOpen(true)
  }

  const handleCalendarEventClick = (event: CalendarEvent) => {
    handleViewDetails(event.resource)
  }

  const handleCalendarDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsCreateModalOpen(true)
  }

  const handleCreateFromTable = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditFromDetail = () => {
    setIsDetailModalOpen(false)
    handleEdit(selectedSchedule!)
  }

  const handleDeleteFromDetail = () => {
    setIsDetailModalOpen(false)
    handleSingleDelete(selectedSchedule!)
  }

  // Extract employee IDs from the selected schedule
  const getEmployeeIdsFromSchedule = (schedule: Schedule): number[] => {
    return schedule.employees.map((employee) => employee.id)
  }

  // DataTable columns definition
  const scheduleColumns = useMemo<ColumnDef<Schedule, any>[]>(
    () => getScheduleColumns(handleEdit, handleSingleDelete),
    [],
  )

  console.log('tes')
  return (
    <div>
      {/* Tab Navigation */}
      <Tabs
        defaultValue="table"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="table">Tabel</TabsTrigger>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
        </TabsList>

        {/* Table View */}
        <TabsContent value="table">
          <h2 className="my-2 text-xl font-medium dark:text-gray-300">
            Jadwal
          </h2>
          <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
            Daftar dan Informasi Jadwal Pekerjaan
            <Button
              onClick={handleCreateFromTable}
              className="text-gray-200 transition-all bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95"
            >
              Tambah Jadwal
            </Button>
          </div>

          {/* Schedule Data Table */}
          <DataTable
            data={schedulesResponse?.data || []}
            columns={scheduleColumns}
            globalFilter={tableState.globalFilter}
            onGlobalFilterChange={(value) =>
              setTableState((prev) => ({ ...prev, globalFilter: value }))
            }
            rowSelection={tableState.rowSelection}
            onRowSelectionChange={(value) =>
              setTableState((prev) => ({
                ...prev,
                rowSelection:
                  typeof value === 'function'
                    ? value(prev.rowSelection)
                    : value,
              }))
            }
            sorting={tableState.sorting}
            onSortingChange={(value) =>
              setTableState((prev) => ({
                ...prev,
                sorting:
                  typeof value === 'function' ? value(prev.sorting) : value,
              }))
            }
            pagination={tableState.pagination}
            onPaginationChange={(value) =>
              setTableState((prev) => ({
                ...prev,
                pagination:
                  typeof value === 'function' ? value(prev.pagination) : value,
              }))
            }
            sortOption={tableState.sortOption}
            onSortOptionChange={handleSortOptionChange}
            onRefresh={refetchSchedules}
            isLoading={isLoadingSchedules || isRefetchingSchedules}
            onBulkDelete={handleBulkDelete}
            isBulkDeletePending={bulkDeleteMutation.isPending}
            selectedCount={Object.keys(tableState.rowSelection).length}
          />
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <h2 className="my-2 text-xl font-medium dark:text-gray-300">
            Jadwal
          </h2>
          <div className="mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
            Daftar dan Informasi Jadwal Pekerjaan
          </div>

          {/* Custom Calendar Component */}
          <CustomCalendar
            events={calendarEvents}
            onSelectEvent={handleCalendarEventClick}
            onSelectSlot={({ start }) => handleCalendarDateClick(start)}
          />
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Jadwal</DialogTitle>
            <DialogDescription>
              Silakan isi data jadwal dengan lengkap dan benar.
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm
            jobs={jobsResponse?.data || []}
            technicians={technicians}
            onSubmit={handleCreateSchedule}
            onCancel={() => setIsCreateModalOpen(false)}
            isSubmitting={isCreating}
            type="create"
            defaultValues={{
              job_id: undefined,
              date: selectedDate || new Date(),
              employee_ids: [],
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Jadwal</DialogTitle>
            <DialogDescription>
              Ubah data jadwal sesuai kebutuhan.
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <ScheduleForm
              jobs={jobsResponse?.data || []}
              technicians={technicians}
              onSubmit={handleUpdateSchedule}
              onCancel={() => setIsEditModalOpen(false)}
              isSubmitting={isUpdating}
              type="edit"
              defaultValues={{
                job_id: selectedSchedule.job.id,
                date: new Date(selectedSchedule.date),
                employee_ids: getEmployeeIdsFromSchedule(selectedSchedule),
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detail Jadwal</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <ScheduleDetail
              schedule={selectedSchedule}
              onEdit={handleEditFromDetail}
              onDelete={handleDeleteFromDetail}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteConfirmation.isOpen && deleteConfirmation.type === 'single'}
        onOpenChange={(open) => !open && cancelDelete()}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
        message="Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak bisa dibatalkan."
      />

      <DeleteDialog
        open={deleteConfirmation.isOpen && deleteConfirmation.type === 'bulk'}
        onOpenChange={(open) => !open && cancelDelete()}
        onConfirm={confirmDelete}
        isPending={bulkDeleteMutation.isPending}
        message={`Anda akan menghapus ${Object.keys(tableState.rowSelection).length} jadwal secara permanen. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?`}
      />
    </div>
  )
}

export default RouteComponent
