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
import { useAuth } from '@/hooks/useAuth'
import {
  SupplierForm,
  SupplierFormType,
} from '@/components/supplier/SupplierForm'

export const Route = createFileRoute('/_layout/inventory_/supplier_/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const { auth } = useAuth()

  if (
    !canAccess(['Sales', 'Superadmin', 'Manager Sales'], auth?.user.role || '')
  ) {
    return <Navigate to="/dashboard" />
  }

  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [, setError] = useAtom(errorAtom)

  const createSupplierMutation = useMutation({
    mutationFn: (data: SupplierFormType) =>
      api().post('suppliers', { json: data }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })

      navigate({ from: '/sales/inventory/create', to: '/sales/inventory' })
    },
    onError: async (error: any) => {
      const errorMessage = await getApiErrorMessage(error)
      setError(errorMessage)
    },
  })

  const onSubmit = (data: SupplierFormType) => {
    createSupplierMutation.mutate(data)
  }

  return (
    <>
      <button
        onClick={() => {
          if (router.history.length > 1) {
            router.history.back()
          } else {
            navigate({ from: '/sales/inventory/create', to: '/sales/inventory' })
          }
        }}
        className="flex items-center gap-3 mb-4 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
      >
        <ArrowLeft
          size={16}
          className="transition-all group-hover:-translate-x-1"
        />
        Kembali
      </button>
      <div className="my-2 text-xl font-medium dark:text-gray-300">
        Tambah Supplier
      </div>
      <div className="mt-2 mb-4 text-sm text-gray-700 dark:text-gray-400">
        Tambah Daftar Supplier Baru
      </div>

      <div className="p-6 bg-white border border-gray-200 rounded-xl dark:bg-[#30334E] dark:border-gray-600">
        <SupplierForm
          onSubmit={onSubmit}
          onCancel={() => {
            if (router.history.length > 1) {
              router.history.back()
            } else {
              navigate({
                from: '/sales/inventory/create',
                to: '/sales/inventory',
              })
            }
          }}
          isSubmitting={createSupplierMutation.isPending}
        />
      </div>
    </>
  )
}
