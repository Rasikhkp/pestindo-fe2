import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/utils";
import { errorAtom } from "@/store/error";
import { createFileRoute } from "@tanstack/react-router";
import { useAtom } from "jotai";

export const Route = createFileRoute("/_layout/dashboard")({
    component: RouteComponent,
});

function RouteComponent() {
    const { auth, logout } = useAuth();
    const [_, setError] = useAtom(errorAtom);

    const getCustomers = async () => {
        console.log("clicked");
        try {
            const res = await api(logout, null, auth?.token)
                .get("customers")
                .json();
            console.log("res", res);
        } catch (e: any) {
            console.log("e.message", e.message);

            if (e.response?.status !== 401) {
                setError(e.message);
            }
        }
    };

    return (
        <div>
            <Button onClick={() => getCustomers()}>get customers</Button>
        </div>
    );
}
