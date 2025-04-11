import { ReactNode, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { authAtom } from "../store/auth";
import { errorAtom } from "../store/error";
import { checkAuth, getApiErrorMessage } from "../lib/utils";
import { LoadingScreen } from "./LoadingScreen";

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [, setAuth] = useAtom(authAtom);
    const [, setError] = useAtom(errorAtom);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const validateAuth = async () => {
            try {
                const { isAuthenticated, error } = await checkAuth();

                if (!isAuthenticated) {
                    setAuth(null);
                    if (error) {
                        setError({ message: error });
                    } else {
                        setError(null);
                    }
                } else {
                    setError(null);
                }
            } catch (err: any) {
                setAuth(null);
                const errorMessage = await getApiErrorMessage(err);
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        validateAuth();
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
};
