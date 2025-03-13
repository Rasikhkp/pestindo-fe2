import { StrictMode, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { createRoot } from "react-dom/client";
import "./index.css";
import { routeTree } from "./routeTree.gen.ts";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { HeroUIProvider } from "@heroui/system";
import { useAtom } from "jotai";
import { themeAtom } from "./store/theme.ts";
import { useAuth } from "./hooks/useAuth.ts";
import { LoadingScreen } from "./components/LoadingScreen.tsx";
import { authAtom } from "./store/auth.ts";
import { checkAuth, getAuthToken, setAuthToken } from "./lib/utils.ts";
import { errorAtom } from "./store/error.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: (error: any) => {
        if (error.response && error.response.status === 401) {
          setAuthToken(null);
          window.location.replace("/login");
        }

        return false;
      },
    },
  },
});

const App = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [theme] = useAtom(themeAtom);
  const [auth, setAuth] = useAtom(authAtom);
  const [_, setError] = useAtom(errorAtom);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

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

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>
        <Toaster className="font-[Inter]" theme={theme} closeButton />
        <RouterProvider router={router} />
      </HeroUIProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
