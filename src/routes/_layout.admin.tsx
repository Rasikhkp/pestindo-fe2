import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/admin")({
    component: RouteComponent,
});

function RouteComponent() {
    return <Navigate to="/admin/user" />;
}
