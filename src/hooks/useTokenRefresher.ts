import { accessTokenAtom } from "@/store/auth";
import { useAtom } from "jotai";
import ky from "ky";
import { useEffect } from "react";

type RefreshTokenSuccess = {
    status: "success";
    access_token: string;
    expires_in: string;
    token_type: "Bearer";
};

type RefreshTokenError = {
    status: "error";
    message: string;
    error?: string;
};

type RefreshTokenResponse = RefreshTokenSuccess | RefreshTokenError;

export function useTokenRefresher() {
    const [_, setAccessToken] = useAtom(accessTokenAtom);

    useEffect(() => {
        const refreshTokenRequest = async () => {
            try {
                const data = await ky
                    .post(`${import.meta.env.VITE_API_URL}/api/refresh-token`, {
                        credentials: "include",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },
                    })
                    .json<RefreshTokenResponse>();

                if (data.status === "error") {
                    throw new Error(data.message);
                }

                setAccessToken(data.access_token);
            } catch (error) {
                console.error("Error refreshing token:", error);
                setAccessToken(null);
            }
        };

        refreshTokenRequest();

        const intervalId = setInterval(refreshTokenRequest, 55 * 60 * 1000);

        return () => {
            clearInterval(intervalId);
            setAccessToken(null);
        };
    }, [setAccessToken]);
}
