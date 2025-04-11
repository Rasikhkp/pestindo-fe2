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
import { OrderForm, OrderFormValues } from '@/components/inventory/OrderForm'
import { useAuth } from '@/hooks/useAuth'
import { Order } from '@/types/types'

export const Route = createFileRoute('/_layout/inventory_/order_/edit/$order_id')({
    component: RouteComponent,
    loader: async ({ params }) => {
        try {
            const { data } = await api()
                .get(`orders/${params.order_id}`)
                .json<{ data: Order }>();

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
    const { order_id } = Route.useParams();
    const { data: orderData } = Route.useLoaderData();

    // if (!canAccess(['Inventory', 'Superadmin'], auth?.user.role || '')) {
    //     return <Navigate to="/dashboard" />;
    // }

    const router = useRouter();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [, setError] = useAtom(errorAtom);

    // Fetch suppliers
    const {
        data: suppliersResponse,
        isLoading: isLoadingSuppliers,
        error: suppliersError
    } = useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => api().get("suppliers").json<{
            data: Array<{ id: number; code: string; name: string }>
        }>(),
    });

    // Fetch items
    const {
        data: itemsResponse,
        isLoading: isLoadingItems,
        error: itemsError
    } = useQuery({
        queryKey: ["items"],
        queryFn: async () => api().get("items").json<{
            data: Array<{ id: number; code: string; name: string; price: number; unit: string }>
        }>(),
    });

    // Handle API errors
    useEffect(() => {
        if (suppliersError) {
            getApiErrorMessage(suppliersError).then(message => setError(message));
        }
        if (itemsError) {
            getApiErrorMessage(itemsError).then(message => setError(message));
        }
    }, [suppliersError, itemsError, setError]);

    const updateOrderMutation = useMutation({
        mutationFn: (data: OrderFormValues) => {
            return api().patch(`orders/${order_id}`, {
                json: {
                    supplier_id: data.supplier_id,
                    items: data.items.map(item => ({
                        item_id: item.item_id,
                        amount: item.amount,
                        price: item.price
                    }))
                }
            }).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders', order_id] });
            navigate({ to: '/inventory/order' });
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error);
            setError(errorMessage);
        },
    });

    useEffect(() => {
        if (updateOrderMutation.error) {
            getApiErrorMessage(updateOrderMutation.error).then((errorMessage) =>
                setError(errorMessage)
            );
        }
    }, [updateOrderMutation.error, setError]);

    const onSubmit = (data: OrderFormValues) => {
        updateOrderMutation.mutate(data);
    };

    const isLoading = isLoadingSuppliers || isLoadingItems;

    return (
        <>
            <button
                onClick={() => {
                    if (router.history.length > 1) {
                        router.history.back();
                    } else {
                        navigate({ to: '/inventory/order' });
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
                    Edit Order #{orderData.code}
                </h1>
                <p className="text-gray-700 dark:text-gray-400">
                    Silakan edit data order dengan lengkap dan benar.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <OrderForm
                    suppliers={suppliersResponse?.data || []}
                    items={itemsResponse?.data || []}
                    defaultValues={orderData}
                    onSubmit={onSubmit}
                    onCancel={() => {
                        if (router.history.length > 1) {
                            router.history.back();
                        } else {
                            navigate({ to: '/inventory/order' });
                        }
                    }}
                    isSubmitting={updateOrderMutation.isPending}
                />
            )}
        </>
    );
}

export default RouteComponent;