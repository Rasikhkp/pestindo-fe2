import { ReactNode, useEffect } from "react";
import { useAtom } from "jotai";
import { themeAtom } from "../store/theme";

type ThemeProviderProps = {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [theme] = useAtom(themeAtom);

    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    return <>{children}</>;
};