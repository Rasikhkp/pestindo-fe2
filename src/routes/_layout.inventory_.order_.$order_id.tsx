import {
    createFileRoute,
    Navigate,
    useNavigate,
    useRouter,
    Link
} from '@tanstack/react-router'
import { ArrowLeft, Edit, Trash2, Wallet, BarChart3, Package } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { errorAtom } from '@/store/error'
import { api, canAccess, formatToRupiah, getApiErrorMessage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { DeleteDialog } from '@/components/DeleteDialog'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/_layout/inventory_/order_/$order_id')({
    component: RouteComponent,
    loader: async ({ params }) => {
        try {
            const { data } = await api()
                .get(`orders/${params.order_id}`)
                .json<{
                    data: {
                        id: number;
                        code: string;
                        supplier_id: number;
                        supplier_name: string;
                        supplier_code: string;
                        supplier: {
                            name: string;
                            code: string;
                            address: string;
                            phone: string;
                        };
                        items: Array<{
                            id: number;
                            item_id: number;
                            code: string;
                            name: string;
                            amount: number;
                            price: number;
                            unit: string;
                        }>;
                        total_amount: number;
                        total_price: number;
                        created_at: string;
                    }
                }>();
            return data;
        } catch (error) {
            const errorMessage = await getApiErrorMessage(error);
            throw new Error(errorMessage.message);
        }
    },
    shouldReload: () => true,
    gcTime: 0,
})

function RouteComponent() {
    const { auth } = useAuth()
    const { order_id } = Route.useParams()
    const order = Route.useLoaderData()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // if (!canAccess(['Inventory', 'Superadmin'], auth?.user.role || '')) {
    //     return <Navigate to="/dashboard" />
    // }

    const router = useRouter()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [, setError] = useAtom(errorAtom)

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => api().delete(`orders/${order_id}`).json(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            navigate({ to: '/inventory/order' })
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error)
            setError(errorMessage)
        },
    });

    const handleDelete = () => {
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        deleteMutation.mutate();
        setIsDeleteDialogOpen(false);
    };

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
                className="flex items-center gap-3 mb-8 text-sm text-gray-600 dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft
                    size={16}
                    className="transition-all group-hover:-translate-x-1"
                />
                Kembali
            </button>


            <div className="flex items-center justify-between">
                <div>
                    <div className="my-2 text-xl font-medium dark:text-gray-300">Kode Order #{order.code}</div>
                    <div className="mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">Detail Informasi Order</div>
                </div>

                <div className="flex items-center gap-4">
                    <Link to="/inventory/order/edit/$order_id" params={{ order_id }}>
                        <Button variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    </Link>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4 mb-4 xl:flex-row">
                <div className="text-sm text-gray-600 dark:text-gray-200">
                    <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
                        <div className="p-4 text-lg font-semibold">Informasi Supplier</div>

                        <div className="border-b border-gray-200 dark:border-gray-600"></div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">Nama</div>
                            <div className="flex-1">{order.supplier?.name || order.supplier_name}</div>
                        </div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">Kode</div>
                            <div className="flex-1">#{order.supplier?.code || order.supplier_code}</div>
                        </div>

                        {order.supplier?.phone && (
                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">No HP</div>
                                <div className="flex-1">{order.supplier.phone}</div>
                            </div>
                        )}

                        {order.supplier?.address && (
                            <div className="flex p-4">
                                <div className="w-40 font-medium">Alamat</div>
                                <div className="flex-1">{order.supplier.address}</div>
                            </div>
                        )}
                    </div>
                </div>

                <motion.div transition={{ duration: 0.8, ease: "easeInOut" }} className="flex flex-wrap gap-4 h-fit">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 1 * 0.1,
                        }}
                        className="flex-1 p-4 space-y-2 text-gray-600 border border-gray-200 dark:border-gray-600 dark:text-gray-200 h-fit basis-80 min-w-80 rounded-xl"
                    >
                        <Wallet size={24} className="mb-6 text-blue-500" />
                        <div className="text-4xl font-bold">{formatToRupiah(order.total_price || 0)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Nilai Order</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 2 * 0.1,
                        }}
                        className="flex-1 p-4 space-y-2 text-gray-600 border border-gray-200 dark:border-gray-600 dark:text-gray-200 h-fit basis-40 min-w-40 rounded-xl"
                    >
                        <Package size={24} className="mb-6 text-blue-500" />
                        <div className="text-4xl font-bold">{order.items?.length || 0}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Jenis Barang</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 2 * 0.1,
                        }}
                        className="flex-1 p-4 space-y-2 text-gray-600 border border-gray-200 dark:border-gray-600 dark:text-gray-200 h-fit basis-40 min-w-40 rounded-xl"
                    >
                        <BarChart3 size={24} className="mb-6 text-blue-500" />
                        <div className="text-4xl font-bold">{order.total_amount || 0}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Jumlah</div>
                    </motion.div>
                </motion.div>
            </div>

            <div className="mt-8 border border-gray-200 rounded-xl dark:border-gray-600">
                <div className="p-4 text-lg text-gray-600 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-600">
                    Daftar Item
                </div>
                <div className="p-4">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Barang</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Harga</TableHead>
                                    <TableHead>Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items?.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">#{item.code}</TableCell>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.amount} {item.unit}</TableCell>
                                        <TableCell>{formatToRupiah(item.price)}</TableCell>
                                        <TableCell>{formatToRupiah(item.price * item.amount)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell className="font-medium">Total</TableCell>
                                    <TableCell>{formatToRupiah(order.total_price)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <DeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                isPending={deleteMutation.isPending}
                message={`Anda yakin ingin menghapus order #${order?.code}? Tindakan ini tidak bisa dibatalkan.`}
            />
        </>
    )
}

export default RouteComponent 