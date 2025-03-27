import { ReactNode, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { authAtom } from "../store/auth";
import { errorAtom } from "../store/error";
import { checkAuth } from "../lib/utils";
import { LoadingScreen } from "./LoadingScreen";

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isChecking, setIsChecking] = useState(true);
    const [auth, setAuth] = useAtom(authAtom);
    const [_, setError] = useAtom(errorAtom);

    useEffect(() => {
        checkAuth(auth).then(({ isAuthenticated, error }) => {
            if (!isAuthenticated && error === "unauthorized") {
                setAuth(null);
            } else if (!isAuthenticated && error !== "unauthorized") {
                setError(error);
            }
            setIsChecking(false);
        });
    }, []);

    if (isChecking) return <LoadingScreen />;

    return <>{children}</>;
};