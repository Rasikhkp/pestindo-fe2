import { rankItem } from "@tanstack/match-sorter-utils";
import { FilterFn } from "@tanstack/react-table";
import { clsx, type ClassValue } from "clsx";
import ky, { HTTPError, TimeoutError } from "ky";
import { twMerge } from "tailwind-merge";
import { encryptData, decryptData } from "./encryption";

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

let errorCallback: ((message: string) => void) | null = null;

export const setErrorCallback = (callback: ((message: string) => void) | null) => {
    errorCallback = callback;
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
            afterResponse: [
                async (_request: any, _options: any, response: any) => {
                    if (response.status === 401) {
                        setAuthToken(null);
                        window.location.replace("/login");
                        return response;
                    }
                    return response;
                },
            ],
            afterError: [
                async (error: any) => {
                    const errorMessage = await getApiErrorMessage(error);
                    if (errorCallback) {
                        errorCallback(errorMessage.message);
                    }
                    return error;
                },
            ],
        },
    };

    return ky.create(config);
};

export const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
        return { isAuthenticated: false, error: null };
    }

    try {
        const res = await ky
            .get(import.meta.env.VITE_API_URL + "/api/check-auth", {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })
            .json();

        console.log('res', res)

        return { isAuthenticated: true, error: null };
    } catch (err: any) {
        const errorMessage = await getApiErrorMessage(err);
        return { isAuthenticated: false, error: errorMessage.message };
    }
};

export const getAuthToken = () => {
    const encryptedAuth = localStorage.getItem("auth");
    if (!encryptedAuth) return null;

    try {
        const decryptedAuth = decryptData(encryptedAuth);
        const auth = JSON.parse(decryptedAuth);
        return auth?.token;
    } catch (error) {
        console.error("Error getting auth token:", error);
        return null;
    }
};

export const setAuthToken = (data: any) => {
    if (!data) {
        localStorage.removeItem("auth");
        return;
    }

    try {
        const encryptedData = encryptData(JSON.stringify(data));
        localStorage.setItem("auth", encryptedData);
    } catch (error) {
        console.error("Error setting auth token:", error);
        throw new Error("Failed to encrypt auth data");
    }
};

export const getApiErrorMessage = async (error: unknown) => {
    // HTTP errors (4xx, 5xx)
    if (error instanceof HTTPError) {
        const statusCode = error.response.status;

        // Client errors (4xx)
        if (statusCode >= 400 && statusCode < 500) {
            switch (statusCode) {
                case 400:
                    return {
                        message: 'Invalid request. Please check your input and try again.',
                        statusCode,
                        errorType: 'BadRequest',
                        originalError: error
                    };
                case 401:
                    return {
                        message: 'Authentication required. Please log in and try again.',
                        statusCode,
                        errorType: 'Unauthorized',
                        originalError: error
                    };
                case 403:
                    return {
                        message: 'You don\'t have permission to access this resource.',
                        statusCode,
                        errorType: 'Forbidden',
                        originalError: error
                    };
                case 404:
                    return {
                        message: 'The requested resource was not found.',
                        statusCode,
                        errorType: 'NotFound',
                        originalError: error
                    };
                case 409:
                    return {
                        message: 'Request conflict with the current state of the resource.',
                        statusCode,
                        errorType: 'Conflict',
                        originalError: error
                    };
                case 422:
                    return {
                        message: 'Validation failed. Please check your input.',
                        statusCode,
                        errorType: 'ValidationError',
                        originalError: error
                    };
                case 429:
                    return {
                        message: 'Too many requests. Please try again later.',
                        statusCode,
                        errorType: 'RateLimited',
                        originalError: error
                    };
                default:
                    return {
                        message: `Request error (${statusCode}). Please try again.`,
                        statusCode,
                        errorType: 'ClientError',
                        originalError: error
                    };
            }
        }

        // Server errors (5xx)
        if (statusCode >= 500) {
            return {
                message: 'Server error. Please try again later.',
                statusCode,
                errorType: 'ServerError',
                originalError: error
            };
        }
    }

    // Timeout errors
    if (error instanceof TimeoutError) {
        return {
            message: 'Request timed out. Please check your connection and try again.',
            errorType: 'Timeout',
            originalError: error
        };
    }

    // Network errors (offline, DNS failure, etc.)
    if (error instanceof TypeError &&
        (error.message.includes('NetworkError') ||
            error.message.includes('Failed to fetch'))) {
        return {
            message: 'Network error. Please check your internet connection.',
            errorType: 'NetworkError',
            originalError: error
        };
    }

    // CORS errors
    if (error instanceof TypeError && error.message.includes('CORS')) {
        return {
            message: 'Cross-origin request blocked. Please contact support.',
            errorType: 'CorsError',
            originalError: error
        };
    }

    // JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return {
            message: 'Error processing server response. Please try again later.',
            errorType: 'ParseError',
            originalError: error
        };
    }

    // AbortError (request was cancelled)
    if (error instanceof DOMException && error.name === 'AbortError') {
        return {
            message: 'Request was cancelled.',
            errorType: 'Aborted',
            originalError: error
        };
    }

    // Fallback for any other errors
    return {
        message: 'An unexpected error occurred. Please try again later.',
        errorType: 'UnknownError',
        originalError: error
    }
};

export const convertSnakeToTitleCase = (str: string) => {
    return str
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export const canAccess = (allowedRoles: string[], userRole: string) => {
    return allowedRoles.some(role => role === userRole);
}