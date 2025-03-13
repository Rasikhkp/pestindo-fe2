import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/business_/schedule')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/business_/schedule"!</div>
}
