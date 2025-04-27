import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/service')({
    component: RouteComponent,
})

function RouteComponent() {
    return <Navigate to="/service/job" />
}
