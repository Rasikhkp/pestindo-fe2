import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { HeroUIProvider } from "@heroui/system";
import { useAtom } from "jotai";
import { themeAtom } from "./store/theme";
import "./index.css";

import { router } from "./lib/router";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./components/AuthProvider";

const App = () => {
    const [theme] = useAtom(themeAtom);

    return (
        <QueryClientProvider client={queryClient}>
            <HeroUIProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <Toaster className="font-[Inter]" theme={theme} closeButton />
                        <RouterProvider router={router} />
                    </AuthProvider>
                </ThemeProvider>
            </HeroUIProvider>
        </QueryClientProvider>
    );
};

createRoot(document.getElementById("root")!).render(
    <App />
);
