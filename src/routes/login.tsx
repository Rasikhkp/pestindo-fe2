import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SubmitHandler, useForm } from "react-hook-form";
import logoPestindo from "../assets/logo pestindo 2.png";
import { z } from "zod";
import { useState } from "react";
import { useAtom } from "jotai";
import { themeAtom } from "../store/theme";
import { Eye, EyeSlash, Login } from "iconsax-react";
import { Alert } from "@heroui/alert";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export type LoginType = z.infer<typeof loginSchema>;

export type LoginResponse = {
    status: string;
    code: number;
    message: string;
    token: string;
    expires_at: string;
    data: any;
};

export const Route = createFileRoute("/login")({
    component: RouteComponent,
});

function RouteComponent() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginType>({
        resolver: zodResolver(loginSchema),
    });

    const [theme] = useAtom(themeAtom);
    const [showPassword, setShowPassword] = useState(false);
    const { login, error, auth } = useAuth();

    const onSubmit: SubmitHandler<LoginType> = async (data) => {
        await login(data);
    };

    if (auth) return <Navigate to="/dashboard" />;

    return (
        <div className="flex min-h-screen bg-white dark:bg-[#30334E] text-gray-700 dark:text-gray-200">
            <div className="w-full lg:w-[45%] p-8 lg:p-16 flex items-center">
                <div className="w-full max-w-md mx-auto space-y-5">
                    <div className="h-12 mb-16 w-60">
                        <img
                            style={{
                                filter:
                                    theme === "light"
                                        ? ""
                                        : "invert(1) brightness(1)",
                            }}
                            src={logoPestindo}
                            alt="logo pestindo"
                        />
                    </div>

                    <div>
                        <h1 className="text-4xl font-bold text-gray-700 dark:text-gray-100">
                            Welcome back!
                        </h1>
                        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
                            Great to see you again. Let's get you signed in.
                        </p>
                    </div>
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Alert
                                    color="danger"
                                    title={error}
                                    variant="solid"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <div className="space-y-5">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    {...register("email")}
                                    type="email"
                                    className="w-full px-4 py-3 transition-all border border-gray-200 dark:border-gray-600 outline-none rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-[#3A3D5A] dark:focus:ring-blue-400"
                                    placeholder="Enter your email"
                                    required
                                />
                                {errors.email && (
                                    <div className="my-2 text-sm text-red-500">
                                        {errors.email?.message}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        {...register("password")}
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        className="w-full px-4 py-3 pr-12 transition-all border border-gray-200 dark:border-gray-600 outline-none rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-[#3A3D5A] dark:focus:ring-blue-400"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute text-gray-400 transition-colors -translate-y-1/2 dark:text-gray-300 right-3 top-1/2 hover:text-gray-600 dark:hover:text-gray-100"
                                    >
                                        {showPassword ? (
                                            <EyeSlash size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="my-2 text-sm text-red-500">
                                        {errors.password?.message}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium disabled:bg-gray-600 disabled:text-gray-400 text-white transition-all bg-blue-500 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 dark:focus:ring-offset-[#30334E]"
                        >
                            <Login size={20} />
                            <span>
                                {isSubmitting ? "Signing in..." : "Sign in"}
                            </span>
                        </button>
                    </form>
                </div>
            </div>

            <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1491723203629-ac87f78dc19b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center dark:opacity-50" />
            </div>
        </div>
    );
}
