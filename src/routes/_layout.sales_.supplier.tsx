import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/sales_/supplier')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/sales/supplier"!</div>
}
