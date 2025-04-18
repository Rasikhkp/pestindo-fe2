import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/technician")({
    component: RouteComponent,
});

function RouteComponent() {
    return <Navigate to="/technician/job" />;
}
