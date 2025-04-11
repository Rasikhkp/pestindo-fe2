import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { DetailedSelect, DetailedOption } from '@/components/ui/detailed-select';
import { Job, Employee } from '@/types/types';
import { z } from "zod";

export const scheduleSchema = z.object({
    job_id: z.number().min(1, "Project harus dipilih"),
    date: z.date({ required_error: "Tanggal harus dipilih" }),
    employee_ids: z.array(z.number()).min(1, "Minimal satu teknisi harus dipilih"),
});

/**
 * Type for schedule form values based on the schema
 */
export type ScheduleFormValues = z.infer<typeof scheduleSchema>;

/**
 * Props for the ScheduleForm component
 */
interface ScheduleFormProps {
    /* Default form values for editing mode */
    defaultValues?: Partial<ScheduleFormValues>;
    /* List of available jobs to select from */
    jobs: Job[];
    /* List of available technicians to select from */
    technicians: Employee[];
    /* Handler for form submission */
    onSubmit: (data: ScheduleFormValues) => void;
    /* Handler for cancellation */
    onCancel: () => void;
    /* Indicates if submission is in progress */
    isSubmitting?: boolean;
    /* Type of form - create or edit */
    type: 'create' | 'edit';
    /* Whether to disable job selection (for single job context) */
    disableJobSelection?: boolean;
}

/**
 * A reusable form component for creating and editing schedules
 */
export const ScheduleForm: React.FC<ScheduleFormProps> = ({
    defaultValues,
    jobs,
    technicians,
    onSubmit,
    onCancel,
    isSubmitting = false,
    type,
    disableJobSelection = false
}) => {
    const { control, handleSubmit, formState: { errors } } = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: defaultValues || {
            job_id: undefined,
            date: new Date(),
            employee_ids: [],
        }
    });

    // Convert jobs to the format expected by DetailedSelect
    const jobOptions: DetailedOption[] = jobs.map(job => ({
        id: job.id,
        primary: `#${job.code}`,
        secondary: job.customer_name
    }));

    // Convert technicians to the format expected by MultiSelect
    const technicianOptions: MultiSelectOption[] = technicians.map(tech => ({
        value: tech.id.toString(),
        label: tech.name
    }));

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
                {/* Job Selection - hidden when disableJobSelection is true */}
                {!disableJobSelection && (
                    <div className="grid gap-2">
                        <Label htmlFor="job_id">
                            Project
                        </Label>
                        <Controller
                            name="job_id"
                            control={control}
                            render={({ field }) => (
                                <DetailedSelect
                                    options={jobOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Pilih Project"
                                    error={errors.job_id?.message}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                        {errors.job_id && (
                            <p className="text-sm text-red-500">{errors.job_id.message}</p>
                        )}
                    </div>
                )}

                {/* Date Selection */}
                <div className="grid gap-2">
                    <Label htmlFor="date">
                        Tanggal
                    </Label>
                    <Controller
                        name="date"
                        control={control}
                        render={({ field }) => (
                            <Input
                                id="date"
                                type="date"
                                value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                                onChange={(e) => {
                                    const date = e.target.value ? new Date(e.target.value) : undefined;
                                    field.onChange(date);
                                }}
                                disabled={isSubmitting}
                            />
                        )}
                    />
                    {errors.date && (
                        <p className="text-sm text-red-500">{errors.date.message}</p>
                    )}
                </div>

                {/* Technician Selection */}
                <div className="grid gap-2">
                    <Label htmlFor="employee_ids">
                        Teknisi
                    </Label>
                    <Controller
                        name="employee_ids"
                        control={control}
                        render={({ field }) => (
                            <MultiSelect
                                options={technicianOptions}
                                selected={field.value?.map(id => id.toString()) || []}
                                onChange={(selected) => {
                                    field.onChange(selected.map(v => parseInt(v, 10)));
                                }}
                                placeholder="Pilih Teknisi"
                            />
                        )}
                    />
                    {errors.employee_ids && (
                        <p className="text-sm text-red-500">{errors.employee_ids.message}</p>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Batal
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Menyimpan...' : type === 'create' ? 'Tambah' : 'Simpan'}
                </Button>
            </DialogFooter>
        </form>
    );
}; 