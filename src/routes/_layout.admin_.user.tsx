import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/admin_/user")({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/_layout/admin_/user"!</div>;
}
