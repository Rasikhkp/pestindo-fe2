import { atomWithStorage } from "jotai/utils";
import { getAuthToken, setAuthToken } from "@/lib/utils";

export type AuthType = {
    user: {
        id: number;
        code: string;
        name: string;
        phone: number;
        email: string;
        role: string;
    };
    token: string;
    expires_at: string;
};

const storage = {
    getItem: (key: string): AuthType | null => {
        if (key === "auth") {
            const token = getAuthToken();
            return token ? { token, user: { id: 0, code: "", name: "", phone: 0, email: "", role: "" }, expires_at: "" } : null;
        }
        return null;
    },
    setItem: (key: string, value: AuthType | null): void => {
        if (key === "auth") {
            setAuthToken(value);
        }
    },
    removeItem: (key: string): void => {
        if (key === "auth") {
            setAuthToken(null);
        }
    },
};

export const authAtom = atomWithStorage<AuthType | null>("auth", null, storage);
