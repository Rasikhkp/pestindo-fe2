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
import { useEffect } from 'react'
import { ItemForm } from '@/components/item'
import { ItemForm as ItemFormType } from "@/schemas/itemSchema";
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/_layout/inventory_/item_/edit/$item_id')({
    component: RouteComponent,
    loader: async ({ params }) => {
        try {
            const { data } = await api()
                .get('items/' + params.item_id)
                .json<any>()
            return {
                itemData: {
                    name: data.name,
                    price: data.price,
                    amount: data.amount,
                    type: data.type,
                    unit: data.unit,
                    image: data.image,
                    note: data.note || "",
                },
            }
        } catch (error) {
            const errorMessage = await getApiErrorMessage(error)
            throw new Error(errorMessage.message)
        }
    },
    shouldReload: () => true,
    gcTime: 0,
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
    const { item_id } = Route.useParams()
    const { itemData } = Route.useLoaderData()
    const [, setError] = useAtom(errorAtom)

    const updateItemMutation = useMutation({
        mutationFn: (data: any) => {
            console.log('data', data)
            // If we have a file, use FormData
            if (data.imageFile instanceof File) {
                const formData = new FormData();
                formData.append('_method', 'PATCH'); // Override method for Laravel
                formData.append('name', data.name);
                formData.append('price', String(data.price));
                formData.append('amount', String(data.amount));
                formData.append('type', data.type);
                formData.append('unit', data.unit);
                formData.append('image', data.imageFile);

                if (data.note) formData.append('note', data.note);
                if (data.change_reason) formData.append('change_reason', data.changeReason)

                return api().post(`items/${item_id}`, {
                    body: formData,
                    headers: {
                        'Content-Type': undefined
                    }
                }).json();
            } else {
                // If no file, just send JSON with the URL
                return api().patch(`items/${item_id}`, {
                    json: {
                        name: data.name,
                        price: data.price,
                        amount: data.amount,
                        type: data.type,
                        unit: data.unit,
                        image: data.image,
                        note: data.note,
                        change_reason: data.changeReason
                    }
                }).json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items'] })
            navigate({ from: '/inventory/item/edit/$item_id', to: '/inventory/item' })
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error)
            const errres = await error.response.json()
            console.log('errres', errres)
            setError(errorMessage)
        },
    })

    useEffect(() => {
        if (updateItemMutation.error) {
            getApiErrorMessage(updateItemMutation.error).then((errorMessage) =>
                setError(errorMessage),
            )
        }
    }, [updateItemMutation.error, setError])

    const onSubmit = (data: ItemFormType) => {
        updateItemMutation.mutate(data)
    }

    return (
        <>
            <button
                onClick={() => {
                    if (router.history.length > 1) {
                        router.history.back()
                    } else {
                        navigate({ from: '/inventory/item/edit/$item_id', to: '/inventory/item' })
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
                    Edit Item
                </h1>
                <p className="text-gray-700 dark:text-gray-400">
                    Silakan edit data item dengan lengkap dan benar.
                </p>
            </div>
            <ItemForm
                defaultValues={itemData}
                onSubmit={onSubmit}
                onCancel={() => {
                    if (router.history.length > 1) {
                        router.history.back()
                    } else {
                        navigate({ from: '/inventory/item/edit/$item_id', to: '/inventory/item' })
                    }
                }}
                isSubmitting={updateItemMutation.isPending}
                showNote={true}
                isEdit={true}
            />
        </>
    )
}

export default RouteComponent 