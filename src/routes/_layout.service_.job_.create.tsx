import {
  createFileRoute,
  Navigate,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { errorAtom } from '@/store/error'
import { api, canAccess, getApiErrorMessage } from '@/lib/utils'
import { useEffect } from 'react'
import { JobForm, type JobForm as JobFormType } from '@/components/job/JobForm'
import { Customer } from '@/types/types'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/_layout/service_/job_/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const { auth } = useAuth()

  if (!canAccess(['Bisnis', 'Superadmin'], auth?.user.role || '')) {
    return <Navigate to="/dashboard" />
  }

  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [, setError] = useAtom(errorAtom)

  const { data: customersData, error: customersError } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => api().get('customers').json<{ data: Customer[] }>(),
  })

  const { data: salesData } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => api().get('employee').json<any>(),
  })

  const customers = customersData?.data || []
  const sales = salesData?.data || []

  useEffect(() => {
    if (customersError) {
      getApiErrorMessage(customersError).then((errorMessage) =>
        setError(errorMessage),
      )
    }
  }, [customersError, setError])

  const createJobMutation = useMutation({
    mutationFn: (data: any) => api().post('jobs', { json: data }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      navigate({ from: '/business/job/create', to: '/business/job' })
    },
    onError: async (error: any) => {
      const errorMessage = await getApiErrorMessage(error)
      setError(errorMessage)
    },
  })

  const onSubmit = (data: JobFormType) => {
    const requestBody = {
      type: data.jobType,
      contract_type: data.contractType,
      sales: data.sales,
      customer_id: data.customer,
      po_number: data.poNumber,
      spk_number: data.spkNumber,
      start_date: data.dateRange.from,
      end_date: data.dateRange.to,
      monthly_contract_value:
        data.contractType === 'project' ? data.monthlyContractValue : null,
      total_contract_value: data.totalContract,
      number_of_visit_per_month:
        data.contractType === 'project' ? data.monthlyVisit : null,
      pic_name: data.picName,
      pic_phone: data.picPhone,
      pic_finance_name: data.picFinanceName,
      pic_finance_phone: data.picFinancePhone,
      reference: data.reference,
    }

    createJobMutation.mutate(requestBody)
  }

  return (
    <>
      <button
        onClick={() => {
          if (router.history.length > 1) {
            router.history.back()
          } else {
            navigate({ from: '/business/job/create', to: '/business/job' })
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
          Tambah Pekerjaan
        </h1>
        <p className="text-gray-700 dark:text-gray-400">
          Silakan isi data pekerjaan dengan lengkap dan benar.
        </p>
      </div>
      <JobForm
        onSubmit={onSubmit}
        onCancel={() => {
          if (router.history.length > 1) {
            router.history.back()
          } else {
            navigate({ from: '/business/job/create', to: '/business/job' })
          }
        }}
        isSubmitting={createJobMutation.isPending}
        customers={customers}
        sales={sales}
      />
    </>
  )
}

export default RouteComponent
