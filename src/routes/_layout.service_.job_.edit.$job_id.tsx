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

export const Route = createFileRoute('/_layout/service_/job_/edit/$job_id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    try {
      const { data } = await api()
        .get('jobs/' + params.job_id)
        .json<any>()
      return {
        jobData: {
          jobType: data.type,
          contractType: data.contract_type,
          customer: data.customer.id,
          sales: data.sales.id,
          poNumber: data.po_number,
          spkNumber: data.spk_number,
          dateRange: {
            from: new Date(data.start_date),
            to: new Date(data.end_date),
          },
          monthlyContractValue: data.monthly_contract_value,
          totalContract: data.total_contract_value,
          monthlyVisit: data.number_of_visit_per_month,
          picName: data.pic_name,
          picPhone: data.pic_phone,
          picFinanceName: data.pic_finance_name,
          picFinancePhone: data.pic_finance_phone,
          reference: data.reference,
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

  if (!canAccess(['Bisnis', 'Superadmin'], auth?.user.role || '')) {
    return <Navigate to="/dashboard" />
  }

  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { job_id } = Route.useParams()
  const { jobData } = Route.useLoaderData()
  const [, setError] = useAtom(errorAtom)

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => api().get('customers').json<{ data: Customer[] }>(),
  })

  const { data: salesData } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => api().get('employee').json<any>(),
  })

  const customers = customersData?.data || []
  const sales = salesData?.data || []

  const updateJobMutation = useMutation({
    mutationFn: (data: any) =>
      api()
        .patch('jobs/' + job_id, { json: data })
        .json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      navigate({ from: '/business/job/edit/$job_id', to: '/business/job' })
    },
    onError: async (error: any) => {
      const errorMessage = await getApiErrorMessage(error)
      setError(errorMessage)
    },
  })

  useEffect(() => {
    if (updateJobMutation.error) {
      getApiErrorMessage(updateJobMutation.error).then((errorMessage) =>
        setError(errorMessage),
      )
    }
  }, [updateJobMutation.error, setError])

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

    updateJobMutation.mutate(requestBody)
  }

  return (
    <>
      <button
        onClick={() => {
          if (router.history.length > 1) {
            router.history.back()
          } else {
            navigate({
              from: '/business/job/edit/$job_id',
              to: '/business/job',
            })
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
          Edit Pekerjaan
        </h1>
        <p className="text-gray-700 dark:text-gray-400">
          Silakan edit data pekerjaan dengan lengkap dan benar.
        </p>
      </div>
      <JobForm
        defaultValues={jobData}
        onSubmit={onSubmit}
        onCancel={() => {
          if (router.history.length > 1) {
            router.history.back()
          } else {
            navigate({
              from: '/business/job/edit/$job_id',
              to: '/business/job',
            })
          }
        }}
        isSubmitting={updateJobMutation.isPending}
        customers={customers}
        sales={sales}
      />
    </>
  )
}

export default RouteComponent
