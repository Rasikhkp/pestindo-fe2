import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { authAtom } from "@/store/auth";
import { LoginResponse, LoginType } from "@/routes/login";
import ky from "ky";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";

export function useAuth() {
  const [auth, setAuth] = useAtom(authAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const login = async (credentials: LoginType) => {
    setIsLoading(true);
    setError("");

    try {
      console.log("sebelum res");
      const res = await ky
        .post(import.meta.env.VITE_API_URL + "/api/login", {
          json: credentials,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })
        .json<LoginResponse>();

      console.log("setelah res");
      console.log("res", res);

      setAuth({
        token: res.token,
        expires_at: res.expires_at,
        user: res.data,
      });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.error("err", err);

      if (err.response) {
        try {
          const errorData = await err.response.json();
          console.log("errorData", errorData);
          setError(errorData.message || "An unknown error occurred");
        } catch (parseError) {
          console.error("Failed to parse error response", parseError);
          setError("An unknown error occurred");
        }
      } else {
        setError(err.message || "An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError("");

    try {
      await ky
        .post(import.meta.env.VITE_API_URL + "/api/logout", {
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + auth?.token,
            "Content-Type": "application/json",
          },
        })
        .json();

      setAuth(null);
      navigate({ to: "/login" });
    } catch (err: any) {
      console.error("err", err);

      if (err.response.status == 401) {
        setAuth(null);
        navigate({ to: "/login" });
      }

      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    auth,
    isAuthenticated,
    login,
    logout,
    isLoading,
    error,
    setIsAuthenticated,
  };
}
