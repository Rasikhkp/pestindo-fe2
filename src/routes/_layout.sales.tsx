import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/sales")({
    component: RouteComponent,
});

function RouteComponent() {
    return <Navigate to="/sales/customer" />;
}
