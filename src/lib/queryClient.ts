import { QueryClient } from "@tanstack/react-query";
import { setAuthToken } from "./utils";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            throwOnError: (error: any) => {
                if (error.response && error.response.status === 401) {
                    setAuthToken(null);
                    window.location.replace("/login");
                }
                return false;
            },
        },
    },
});