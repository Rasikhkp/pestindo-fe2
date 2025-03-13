import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/inventory_/item')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/inventory_/item"!</div>
}
