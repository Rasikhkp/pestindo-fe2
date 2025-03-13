import { AuthType } from "@/store/auth";
import { rankItem } from "@tanstack/match-sorter-utils";
import { FilterFn } from "@tanstack/react-table";
import { clsx, type ClassValue } from "clsx";
import ky from "ky";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
};

export const formatToRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
};

export const api = () => {
    const config: any = {
        prefixUrl: import.meta.env.VITE_API_URL + "/api",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        hooks: {
            beforeRequest: [
                (request: any) => {
                    const token = getAuthToken();
                    if (token) {
                        request.headers.set("Authorization", `Bearer ${token}`);
                    }
                },
            ],
        },
    };

    return ky.create(config);
};

export const checkAuth = async (auth: AuthType | null) => {
    if (!auth?.token) {
        return { isAuthenticated: false, error: "unauthorized" };
    }

    try {
        await ky
            .get(import.meta.env.VITE_API_URL + "/api/check-auth", {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
            })
            .json();

        return { isAuthenticated: true, error: null };
    } catch (err: any) {
        return { isAuthenticated: false, error: await getApiErrorMessage(err) };
    }
};

export const getAuthToken = () => JSON.parse(localStorage.getItem("auth") || "")?.token;

export const setAuthToken = (data: any) => localStorage.setItem("auth", data);

export const getApiErrorMessage = async (err: any) => {
    if (err.response) {
        const { status } = err.response;

        if (status === 422) {
            try {
                const errorData = await err.response.json();

                if (errorData?.errors && typeof errorData.errors === "object") {
                    return "Invalid input. Please check your information and try again.";
                }

                return errorData?.message || "Unable to process the request.";
            } catch {
                return "Unable to process the request.";
            }
        }

        if (status === 401) return "unauthorized";
        if (status === 403) return "forbidden: you don't have access to this resource";
        if (status === 429) return "too many requests: please slow down";
        if (status >= 400 && status < 500) return `client error: ${status}`;
        if (status >= 500) return "server error: something went wrong on our end";

        try {
            const errorData = await err.response.json();
            return errorData?.message || `Error ${status}`;
        } catch {
            return "Server error: Unable to parse response";
        }
    }

    if (err.name === "FetchError" || err.message.includes("Failed to fetch")) {
        return "Network error: Unable to reach the server";
    }

    if (err.message.includes("ECONNREFUSED")) {
        return "Server is not responding";
    }

    if (err.message.includes("timeout")) {
        return "Request timed out. Please check your internet connection.";
    }

    return err?.message || "An unknown error occurred";
};

export const convertSnakeToTitleCase = (str: string) => {
    return str
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};
