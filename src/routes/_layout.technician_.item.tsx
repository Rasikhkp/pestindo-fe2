import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/technician_/item")({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/_layout/technician_/item"!</div>;
}
