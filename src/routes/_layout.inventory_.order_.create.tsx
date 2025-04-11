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

export const Route = createFileRoute('/_layout/inventory_/order_/create')({
    component: RouteComponent,
})

function RouteComponent() {
    const { auth } = useAuth()

    // if (!canAccess(['Inventory', 'Superadmin'], auth?.user.role || '')) {
    //     return <Navigate to="/dashboard" />
    // }

    const router = useRouter()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [, setError] = useAtom(errorAtom)

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

    const createOrderMutation = useMutation({
        mutationFn: (data: OrderFormValues) => {
            return api().post('orders', {
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
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            navigate({ to: '/inventory/order' })
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error)
            setError(errorMessage)
        },
    })

    useEffect(() => {
        if (createOrderMutation.error) {
            getApiErrorMessage(createOrderMutation.error).then((errorMessage) =>
                setError(errorMessage)
            );
        }
    }, [createOrderMutation.error, setError]);

    const onSubmit = (data: OrderFormValues) => {
        createOrderMutation.mutate(data)
    }

    const isLoading = isLoadingSuppliers || isLoadingItems;

    return (
        <>
            <button
                onClick={() => {
                    if (router.history.length > 1) {
                        router.history.back()
                    } else {
                        navigate({ to: '/inventory/order' })
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
                    Tambah Order
                </h1>
                <p className="text-gray-700 dark:text-gray-400">
                    Silakan isi data order dengan lengkap dan benar.
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
                    onSubmit={onSubmit}
                    onCancel={() => {
                        if (router.history.length > 1) {
                            router.history.back()
                        } else {
                            navigate({ to: '/inventory/order' })
                        }
                    }}
                    isSubmitting={createOrderMutation.isPending}
                />
            )}
        </>
    )
}

export default RouteComponent 