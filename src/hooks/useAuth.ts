import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { authAtom } from "@/store/auth";
import { LoginResponse, LoginType } from "@/routes/login";
import ky from "ky";
import { getApiErrorMessage } from "@/lib/utils";

type AuthError = {
    message: string;
    code?: string;
    status?: number;
};

export function useAuth() {
    const [auth, setAuth] = useAtom(authAtom);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<AuthError | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleAuthError = async (err: any): Promise<AuthError> => {
        const errorMessage = await getApiErrorMessage(err);
        return {
            message: errorMessage.message,
            status: errorMessage.statusCode,
            code: errorMessage.errorType,
        };
    };

    const login = async (credentials: LoginType) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await ky
                .post(import.meta.env.VITE_API_URL + "/api/login", {
                    json: credentials,
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                })
                .json<LoginResponse>();

            setIsAuthenticated(true);
            setError(null);
            setAuth({
                token: res.token,
                expires_at: res.expires_at,
                user: res.data,
            });
            sessionStorage.removeItem("loginForm");
        } catch (err: any) {
            console.log('err', err)
            const authError = await handleAuthError(err);
            setError(authError);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await ky
                .post(import.meta.env.VITE_API_URL + "/api/logout", {
                    headers: {
                        Accept: "application/json",
                        Authorization: "Bearer " + auth?.token,
                        "Content-Type": "application/json",
                    },
                })
                .json();

            setAuth(null);
            setIsAuthenticated(false);
            setError(null);
        } catch (err: any) {
            const authError = await handleAuthError(err);

            if (err.response?.status === 401) {
                setAuth(null);
                setIsAuthenticated(false);
                setError(null);
            } else {
                setError(authError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsAuthenticated(!!auth?.token);
        if (auth?.token) {
            setError(null);
        }
    }, [auth]);

    return {
        auth,
        isAuthenticated,
        login,
        logout,
        isLoading,
        error,
        setIsAuthenticated,
    };
}
