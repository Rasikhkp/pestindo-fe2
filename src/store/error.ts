import { atom } from "jotai";

export interface ErrorState {
    message: string;
    statusCode?: number;
    errorType?: string;
}

export const errorAtom = atom<ErrorState | null>(null);
