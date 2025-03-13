import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/inventory_/log')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/inventory_/log"!</div>
}
