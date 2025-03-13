import { atomWithStorage } from "jotai/utils";

export type AuthType = {
    user: {
        code: string;
        name: string;
        phone: number;
        email: string;
    };
    token: string;
    expires_at: string;
};

export const authAtom = atomWithStorage<AuthType | null>(
    "auth",
    JSON.parse(localStorage.getItem("auth") || "null")
);
