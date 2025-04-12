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
import { InventoryRequest } from '@/types/types'

export const Route = createFileRoute('/_layout/technician_/request_/edit/$request_id')({
    component: RouteComponent,
    loader: async ({ params }) => {
        try {
            const { data } = await api()
                .get(`inventory-requests/${params.request_id}`)
                .json<{ data: InventoryRequest }>();

            return { data };
        } catch (error) {
            const errorMessage = await getApiErrorMessage(error);
            throw new Error(errorMessage.message);
        }
    },
    shouldReload: () => true,
    gcTime: 0,
})

function RouteComponent() {
    const { auth } = useAuth();
    const { request_id } = Route.useParams();
    const { data: requestData } = Route.useLoaderData();

    console.log('requestData', requestData)
    const isSuperadmin = auth?.user?.role === "Superadmin";

    if (!canAccess(["Teknisi", "Superadmin"], auth?.user?.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    // Check if request is editable (only if status is "requested")
    if (requestData.status !== "requested") {
        return <Navigate to="/technician/request" />;
    }

    const router = useRouter();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [, setError] = useAtom(errorAtom);

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
            const response = await api().get("employee").json<{ data: Array<{ id: number; code: string; name: string; role_name: string }> }>();
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

    const updateRequestMutation = useMutation({
        mutationFn: (data: RequestFormValues) => {
            return api().patch(`inventory-requests/${request_id}`, {
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
        if (updateRequestMutation.error) {
            getApiErrorMessage(updateRequestMutation.error).then((errorMessage) =>
                setError(errorMessage)
            );
        }
    }, [updateRequestMutation.error, setError]);

    const onSubmit = (data: RequestFormValues) => {
        updateRequestMutation.mutate(data);
    };

    // Format request data for the form
    const defaultValues = {
        type: requestData.type,
        employee_id: requestData.employee.id,
        items: requestData.items.map(item => ({
            item_id: item.id,
            amount: item.amount
        }))
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
                    Edit Request #{requestData.code}
                </h1>
                <p className="text-gray-700 dark:text-gray-400">
                    Silakan edit data permintaan dengan lengkap dan benar.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <RequestForm
                    items={itemsResponse?.data || []}
                    employees={employeesResponse?.data || []}
                    defaultValues={defaultValues}
                    onSubmit={onSubmit}
                    onCancel={() => {
                        if (router.history.length > 1) {
                            router.history.back();
                        } else {
                            navigate({ to: '/technician/request' });
                        }
                    }}
                    isSubmitting={updateRequestMutation.isPending}
                    showEmployeeSelect={isSuperadmin}
                />
            )}
        </>
    );
}

export default RouteComponent; 