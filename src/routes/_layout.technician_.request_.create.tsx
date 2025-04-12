import {
    createFileRoute,
    Navigate,
    useNavigate,
    useRouter,
} from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { errorAtom } from '@/store/error'
import { api, canAccess, getApiErrorMessage } from '@/lib/utils'
import { RequestForm, RequestFormValues } from '@/components/inventory/RequestForm'
import { useAuth } from '@/hooks/useAuth'
import { Employee } from '@/types/types'

export const Route = createFileRoute('/_layout/technician_/request_/create')({
    component: RouteComponent,
})

function RouteComponent() {
    const { auth } = useAuth();

    if (!canAccess(["Teknisi", "Superadmin"], auth?.user?.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    const router = useRouter();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [, setError] = useAtom(errorAtom);

    // Get the employee ID from auth
    const employeeId = auth?.user.id;
    const isSuperadmin = auth?.user?.role === "Superadmin";

    // Fetch items
    const {
        data: itemsResponse,
        isLoading: isLoadingItems,
        error: itemsError
    } = useQuery({
        queryKey: ["items"],
        queryFn: async () => api().get("items").json<{
            data: Array<{ id: number; code: string; name: string; unit: string }>
        }>(),
    });

    // Fetch technician employees when superadmin
    const {
        data: employeesResponse,
        isLoading: isLoadingEmployees,
        error: employeesError
    } = useQuery({
        queryKey: ["technician-employees"],
        queryFn: async () => {
            const response = await api().get("employee").json<{ data: Employee[] }>();
            // Filter for technician employees only
            return {
                data: response.data.filter(emp => emp.role_name === "Teknisi")
            };
        },
        enabled: isSuperadmin // Only fetch if superadmin
    });

    // Handle API errors
    useEffect(() => {
        if (itemsError) {
            getApiErrorMessage(itemsError).then(message => setError(message));
        }
        if (employeesError) {
            getApiErrorMessage(employeesError).then(message => setError(message));
        }
    }, [itemsError, employeesError, setError]);

    const createRequestMutation = useMutation({
        mutationFn: (data: RequestFormValues) => {
            return api().post('inventory-requests', {
                json: {
                    type: data.type,
                    employee_id: data.employee_id, // Include employee_id for superadmin
                    items: data.items.map(item => ({
                        item_id: item.item_id,
                        amount: item.amount
                    }))
                }
            }).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-requests'] });
            navigate({ to: '/technician/request' });
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error);
            setError(errorMessage);
        },
    });

    useEffect(() => {
        if (createRequestMutation.error) {
            getApiErrorMessage(createRequestMutation.error).then((errorMessage) =>
                setError(errorMessage)
            );
        }
    }, [createRequestMutation.error, setError]);

    const onSubmit = (data: RequestFormValues) => {
        createRequestMutation.mutate(data);
    };

    const isLoading = isLoadingItems || (isSuperadmin && isLoadingEmployees);

    return (
        <>
            <button
                onClick={() => {
                    if (router.history.length > 1) {
                        router.history.back();
                    } else {
                        navigate({ to: '/technician/request' });
                    }
                }}
                className="flex items-center gap-3 mb-6 text-sm text-gray-600 dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft
                    size={16}
                    className="transition-all group-hover:-translate-x-1"
                />
                Kembali
            </button>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold dark:text-gray-300">
                    Tambah Request
                </h1>
                <p className="text-gray-700 dark:text-gray-400">
                    Silakan isi data permintaan dengan lengkap dan benar.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <RequestForm
                    defaultValues={{
                        employee_id: employeeId,
                        type: "out",
                        items: []
                    }}
                    items={itemsResponse?.data || []}
                    employees={employeesResponse?.data || []}
                    onSubmit={onSubmit}
                    onCancel={() => {
                        if (router.history.length > 1) {
                            router.history.back();
                        } else {
                            navigate({ to: '/technician/request' });
                        }
                    }}
                    isSubmitting={createRequestMutation.isPending}
                    showEmployeeSelect={isSuperadmin}
                />
            )}
        </>
    );
}

export default RouteComponent; 