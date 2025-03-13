import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/sales_/activity')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>sales activity</div>
}
