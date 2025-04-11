import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Schedule, Employee } from '@/types/types';

/**
 * Props for the ScheduleDetail component
 */
interface ScheduleDetailProps {
    /* The schedule to display details for */
    schedule: Schedule;
    /* Handler for edit button click */
    onEdit: () => void;
    /* Handler for delete button click */
    onDelete: () => void;
}

/**
 * Component to display the details of a schedule in a modal
 */
export const ScheduleDetail: React.FC<ScheduleDetailProps> = ({
    schedule,
    onEdit,
    onDelete
}) => {
    return (
        <div className="space-y-4">
            {/* Job and Date Info */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Project</h4>
                    <p className="text-base dark:text-gray-200">#{schedule.job.code}</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tanggal</h4>
                    <p className="text-base dark:text-gray-200">{schedule.date}</p>
                </div>
            </div>

            {/* Customer Info */}
            <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Pelanggan</h4>
                <p className="text-base dark:text-gray-200">{schedule.job.customer.name}</p>
            </div>

            {/* Technicians Info */}
            <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Teknisi</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                    {schedule.employees.map((employee, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        >
                            {employee.name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <DialogFooter className="gap-2">
                <Button
                    onClick={onEdit}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Edit
                </Button>
                <Button
                    onClick={onDelete}
                    variant="destructive"
                >
                    Hapus
                </Button>
            </DialogFooter>
        </div>
    );
}; 