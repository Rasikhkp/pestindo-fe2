import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/technician_/request')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/technician_/request"!</div>
}
