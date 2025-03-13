import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/inventory")({
    component: RouteComponent,
});

function RouteComponent() {
    return <Navigate to="/inventory/item" />;
}
