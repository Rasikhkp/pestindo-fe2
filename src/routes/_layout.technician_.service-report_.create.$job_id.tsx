import { ReportWizard } from '@/components/service-report/ReportWizard'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute(
  '/_layout/technician_/service-report_/create/$job_id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  return (
    <>
      <button
        onClick={() => router.history.back()}
        className="flex items-center gap-3 mb-8 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
      >
        <ArrowLeft
          size={16}
          className="transition-all group-hover:-translate-x-1"
        />{' '}
        Kembali
      </button>
      <div>
        <h2 className="my-2 text-xl font-medium dark:text-gray-300">Buat Laporan</h2>
        <div className="flex justify-between mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
          Buat laporan untuk job ini
        </div>
      </div>

      <ReportWizard />
    </>
  )
}
