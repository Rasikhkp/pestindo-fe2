import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/sales_/job_/edit/$job_id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/sales_/job_/edit/$job_id"!</div>
}
