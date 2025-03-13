import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/business")({
    component: RouteComponent,
});

function RouteComponent() {
    return <Navigate to="/business/job" />;
}
