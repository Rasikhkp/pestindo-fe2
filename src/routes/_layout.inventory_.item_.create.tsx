import {
    createFileRoute,
    Navigate,
    useNavigate,
    useRouter,
} from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { errorAtom } from '@/store/error'
import { api, canAccess, getApiErrorMessage } from '@/lib/utils'
import { ItemForm, type ItemForm as ItemFormType } from '@/components/inventory/ItemForm'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/_layout/inventory_/item_/create')({
    component: RouteComponent,
})

function RouteComponent() {
    const { auth } = useAuth()

    if (
        !canAccess(['Inventory', 'Superadmin'], auth?.user.role || '')
    ) {
        return <Navigate to="/dashboard" />
    }

    const router = useRouter()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [, setError] = useAtom(errorAtom)

    const createItemMutation = useMutation({
        mutationFn: (data: any) => {
            // If we have a file, use FormData
            if (data.imageFile instanceof File) {
                const formData = new FormData();
                formData.append('name', data.name);
                formData.append('price', String(data.price));
                formData.append('amount', String(data.amount));
                formData.append('type', data.type);
                formData.append('unit', data.unit);
                formData.append('image', data.imageFile);

                return api().post('items', {
                    body: formData,
                    headers: {
                        'Content-Type': undefined
                    }
                }).json();
            } else {
                // If no file, just send JSON
                return api().post('items', {
                    json: {
                        name: data.name,
                        price: data.price,
                        amount: data.amount,
                        type: data.type,
                        unit: data.unit,
                        image: data.image,
                    }
                }).json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items'] })
            navigate({ from: '/inventory/item/create', to: '/inventory/item' })
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error)
            setError(errorMessage)
        },
    })

    const onSubmit = (data: ItemFormType) => {
        createItemMutation.mutate(data)
    }

    return (
        <>
            <button
                onClick={() => {
                    if (router.history.length > 1) {
                        router.history.back()
                    } else {
                        navigate({ from: '/inventory/item/create', to: '/inventory/item' })
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
                    Tambah Item
                </h1>
                <p className="text-gray-700 dark:text-gray-400">
                    Silakan isi data item dengan lengkap dan benar.
                </p>
            </div>
            <ItemForm
                onSubmit={onSubmit}
                onCancel={() => {
                    if (router.history.length > 1) {
                        router.history.back()
                    } else {
                        navigate({ from: '/inventory/item/create', to: '/inventory/item' })
                    }
                }}
                isSubmitting={createItemMutation.isPending}
            />
        </>
    )
}

export default RouteComponent 