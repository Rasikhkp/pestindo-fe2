import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { format } from 'date-fns';
import { api, getApiErrorMessage } from '@/lib/utils';
import { errorAtom } from '@/store/error';
import { ScheduleFormValues } from '@/components/schedule/ScheduleForm';
import { Schedule } from '@/types/types';

interface ScheduleCreatePayload {
    job_id: number;
    date: string;
    employee_ids: number[];
}

interface ScheduleUpdatePayload {
    id: number;
    data: ScheduleCreatePayload;
}

interface UseScheduleMutationsOptions {
    onCreateSuccess?: (data: Schedule) => void;
    onUpdateSuccess?: (data: Schedule) => void;
}

/**
 * Custom hook that provides mutation functions for schedule operations
 * 
 * @param options - Optional callbacks for success handlers
 * @returns Object containing mutation functions and their states
 */
export const useScheduleMutations = (options?: UseScheduleMutationsOptions) => {
    const queryClient = useQueryClient();
    const [, setError] = useAtom(errorAtom);

    /**
     * Prepares schedule data for API requests
     */
    const prepareScheduleData = (data: ScheduleFormValues): ScheduleCreatePayload => ({
        job_id: data.job_id,
        date: format(data.date, 'yyyy-MM-dd'),
        employee_ids: data.employee_ids,
    });

    /**
     * Mutation for creating a new schedule
     */
    const createScheduleMutation = useMutation({
        mutationFn: (data: ScheduleFormValues) =>
            api().post("schedules", { json: prepareScheduleData(data) }).json<{ data: Schedule }>(),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ["schedules"] });
            if (options?.onCreateSuccess && response.data) {
                options.onCreateSuccess(response.data);
            }
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error);
            setError(errorMessage);
            console.error("Create schedule error:", error);
        },
    });

    /**
     * Mutation for updating an existing schedule
     */
    const updateScheduleMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: ScheduleFormValues }) =>
            api().put(`schedules/${id}`, { json: prepareScheduleData(data) }).json<{ data: Schedule }>(),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ["schedules"] });
            if (options?.onUpdateSuccess && response.data) {
                options.onUpdateSuccess(response.data);
            }
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error);
            setError(errorMessage);
            console.error("Update schedule error:", error);
        },
    });

    return {
        createSchedule: (data: ScheduleFormValues) => createScheduleMutation.mutate(data),
        updateSchedule: (id: number, data: ScheduleFormValues) => updateScheduleMutation.mutate({ id, data }),
        isCreating: createScheduleMutation.isPending,
        isUpdating: updateScheduleMutation.isPending,
        createError: createScheduleMutation.error,
        updateError: updateScheduleMutation.error,
    };
}; 