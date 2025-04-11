import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/DataTable';
import { DeleteDialog } from '@/components/DeleteDialog';
import { api, getApiErrorMessage } from '@/lib/utils';
import { useTable } from '@/hooks/useTable';
import { errorAtom } from '@/store/error';
import { useScheduleMutations } from '@/hooks/useScheduleMutations';
import { CustomCalendar } from '@/components/calendar/CustomCalendar';
import { ScheduleForm, ScheduleFormValues } from '@/components/schedule/ScheduleForm';
import { ScheduleDetail } from '@/components/schedule/ScheduleDetail';
import { Schedule, Employee, CalendarEvent } from '@/types/types';
import { ColumnDef } from '@tanstack/react-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@heroui/checkbox';
import { More } from 'iconsax-react';

interface JobScheduleContainerProps {
    jobId: number;
    schedules: Schedule[];
    onCreateSchedule?: (schedule: Schedule) => void;
    onUpdateSchedule?: (schedule: Schedule) => void;
    onDeleteSchedule?: (scheduleId: number) => void;
    onBulkDeleteSchedules?: (scheduleIds: number[]) => void;
}

const getScheduleColumns = (onEdit: (schedule: Schedule) => void, onDelete: (schedule: Schedule) => void): ColumnDef<Schedule, any>[] => [
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
        accessorKey: 'date',
        header: () => 'Tanggal',
        cell: ({ row }) => format(new Date(row.original.date), 'dd MMMM yyyy'),
        filterFn: 'fuzzy',
    },
    {
        accessorKey: 'employee_names',
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
                    <DropdownMenuItem onClick={() => onEdit(row.original)} className="cursor-pointer">
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(row.original)} className="cursor-pointer">
                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];

export const JobScheduleContainer: React.FC<JobScheduleContainerProps> = ({ jobId, schedules: initialSchedules, onCreateSchedule, onUpdateSchedule, onDeleteSchedule, onBulkDeleteSchedules }) => {
    // State for displaying modals
    const [activeTab, setActiveTab] = useState('table');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [, setError] = useAtom(errorAtom);
    const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);

    // Get employees for technician selection
    const {
        data: employeesResponse,
        error: employeesError,
    } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => api().get('employee').json<{ data: Employee[] }>(),
    });

    // Get mutations from custom hook
    const {
        createSchedule,
        updateSchedule,
        isCreating,
        isUpdating
    } = useScheduleMutations({
        onCreateSuccess: (newSchedule: Schedule) => {
            // Add the new schedule to the state
            setSchedules(prev => [...prev, newSchedule]);
            if (onCreateSchedule) {
                onCreateSchedule(newSchedule);
            }
        },
        onUpdateSuccess: (updatedSchedule: Schedule) => {
            // Update the schedule in the state
            setSchedules(prev =>
                prev.map(schedule => schedule.id === updatedSchedule.id ? updatedSchedule : schedule)
            );
            if (onUpdateSchedule) {
                onUpdateSchedule(updatedSchedule);
            }
        }
    });

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
    } = useTable<Schedule>('schedules', {
        onDeleteSuccess: (deletedId: number) => {
            // Remove the deleted schedule from the state
            setSchedules(prev => prev.filter(schedule => schedule.id !== deletedId));
            if (onDeleteSchedule) {
                onDeleteSchedule(deletedId);
            }
        },
        onBulkDeleteSuccess: (deletedIds: number[]) => {
            // Remove the deleted schedules from the state
            setSchedules(prev => prev.filter(schedule => !deletedIds.includes(schedule.id)));
            if (onBulkDeleteSchedules) {
                onBulkDeleteSchedules(deletedIds);
            }
        }
    });

    // Filter technicians
    const technicians = useMemo(() => {
        if (!employeesResponse?.data) return [];
        return employeesResponse.data.filter(emp => emp.role_name === 'Teknisi');
    }, [employeesResponse?.data]);

    // Format calendar events
    const calendarEvents = useMemo<CalendarEvent[]>(() => {
        if (!schedules) return [];
        return schedules.map(schedule => ({
            id: schedule.id,
            title: `${format(new Date(schedule.date), 'dd/MM')} - ${schedule.employees.map(e => e.name).join(', ')}`,
            start: new Date(schedule.date),
            end: new Date(schedule.date),
            resource: schedule,
        }));
    }, [schedules]);

    // Handle API errors
    useEffect(() => {
        if (employeesError) {
            getApiErrorMessage(employeesError).then(message => setError(message));
            console.error('Employees error:', employeesError);
        }
    }, [employeesError, setError]);

    // Event handlers - memoize with useCallback
    const handleCreateSchedule = useCallback((data: ScheduleFormValues) => {
        // Override job_id with current job
        const scheduleData = { ...data, job_id: jobId };
        createSchedule(scheduleData);
        setIsCreateModalOpen(false);
    }, [jobId, createSchedule]);

    const handleUpdateSchedule = useCallback((data: ScheduleFormValues) => {
        if (!selectedSchedule) return;
        // Override job_id with current job
        const scheduleData = { ...data, job_id: jobId };
        updateSchedule(selectedSchedule.id, scheduleData);
        setIsEditModalOpen(false);
    }, [jobId, selectedSchedule, updateSchedule]);

    const handleEdit = useCallback((schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setTimeout(() => {
            setIsEditModalOpen(true);
        }, 100);
    }, []);

    const handleViewDetails = useCallback((schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setIsDetailModalOpen(true);
    }, []);

    const handleCalendarEventClick = useCallback((event: CalendarEvent) => {
        handleViewDetails(event.resource);
    }, [handleViewDetails]);

    const handleCalendarDateClick = useCallback((date: Date) => {
        setSelectedDate(date);
        setIsCreateModalOpen(true);
    }, []);

    const handleCreateNew = useCallback(() => {
        setIsCreateModalOpen(true);
    }, []);

    const handleEditFromDetail = useCallback(() => {
        setIsDetailModalOpen(false);
        handleEdit(selectedSchedule!);
    }, [handleEdit, selectedSchedule]);

    const handleDeleteFromDetail = useCallback(() => {
        setIsDetailModalOpen(false);
        handleSingleDelete(selectedSchedule!);
    }, [handleSingleDelete, selectedSchedule]);

    // Extract employee IDs from selected schedule
    const getEmployeeIdsFromSchedule = (schedule: Schedule): number[] => {
        return schedule.employees.map(employee => employee.id);
    };

    // DataTable columns definition
    const scheduleColumns = useMemo<ColumnDef<Schedule, any>[]>(
        () => getScheduleColumns(handleEdit, handleSingleDelete),
        []
    );

    return (
        <div>
            {/* Tab Navigation */}
            <Tabs defaultValue="table" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="table">Tabel</TabsTrigger>
                    <TabsTrigger value="calendar">Kalender</TabsTrigger>
                </TabsList>

                {/* Table View */}
                <TabsContent value="table">
                    <Button
                        onClick={handleCreateNew}
                        className="text-gray-200 transition-all mb-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95"
                    >
                        Tambah Jadwal
                    </Button>

                    {/* Schedule Data Table */}
                    <DataTable
                        data={schedules || []}
                        columns={scheduleColumns}
                        globalFilter={tableState.globalFilter}
                        onGlobalFilterChange={(value) => setTableState((prev) => ({ ...prev, globalFilter: value }))}
                        rowSelection={tableState.rowSelection}
                        onRowSelectionChange={(value) =>
                            setTableState((prev) => ({
                                ...prev,
                                rowSelection: typeof value === 'function' ? value(prev.rowSelection) : value,
                            }))
                        }
                        sorting={tableState.sorting}
                        onSortingChange={(value) =>
                            setTableState((prev) => ({
                                ...prev,
                                sorting: typeof value === 'function' ? value(prev.sorting) : value,
                            }))
                        }
                        pagination={tableState.pagination}
                        onPaginationChange={(value) =>
                            setTableState((prev) => ({
                                ...prev,
                                pagination: typeof value === 'function' ? value(prev.pagination) : value,
                            }))
                        }
                        sortOption={tableState.sortOption}
                        onSortOptionChange={handleSortOptionChange}
                        isLoading={false}
                        onBulkDelete={handleBulkDelete}
                        isBulkDeletePending={bulkDeleteMutation.isPending}
                        selectedCount={Object.keys(tableState.rowSelection).length}
                    />
                </TabsContent>

                {/* Calendar View */}
                <TabsContent value="calendar">
                    <Button
                        onClick={handleCreateNew}
                        className="text-gray-200 transition-all mb-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95"
                    >
                        Tambah Jadwal
                    </Button>

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
                        jobs={[]} // Not needed as job is fixed
                        technicians={technicians}
                        onSubmit={handleCreateSchedule}
                        onCancel={() => setIsCreateModalOpen(false)}
                        isSubmitting={isCreating}
                        type="create"
                        defaultValues={{
                            job_id: jobId, // Pre-set job ID
                            date: selectedDate || new Date(),
                            employee_ids: [],
                        }}
                        disableJobSelection
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
                            jobs={[]} // Not needed as job is fixed
                            technicians={technicians}
                            onSubmit={handleUpdateSchedule}
                            onCancel={() => setIsEditModalOpen(false)}
                            isSubmitting={isUpdating}
                            type="edit"
                            defaultValues={{
                                job_id: jobId, // Pre-set job ID
                                date: new Date(selectedSchedule.date),
                                employee_ids: getEmployeeIdsFromSchedule(selectedSchedule),
                            }}
                            disableJobSelection
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
    );
}; 