import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";
import { Alert } from "@heroui/alert";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_layout")({
    component: LayoutComponent,
});

function LayoutComponent() {
    const [openDrawer, setOpenDrawer] = useState(false);
    const { auth } = useAuth();
    const [error, setError] = useAtom(errorAtom);

    if (!auth) return <Navigate to="/login" />;

    return (
        <div className="bg-black">
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed z-[99] bg-blue-400 top-2 left-1/2 -translate-x-1/2"
                    >
                        <Alert
                            color="danger"
                            description={error}
                            title="Error Alert"
                            variant="solid"
                            endContent={
                                <Button
                                    onClick={() => setError("")}
                                    variant="destructive"
                                >
                                    Close
                                </Button>
                            }
                            className="fixed z-[99] -translate-x-1/2 w-[500px] top-5 left-1/2"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="hidden h-fit lg:flex dark:bg-[#30334E] bg-white">
                <div className="h-auto">
                    <Sidebar />
                </div>
                <div className="flex-1">
                    <div className="relative max-w-screen-xl min-h-screen px-8 pb-16 mx-auto">
                        <Navbar />
                        <Outlet />
                        <div className="absolute bottom-0 left-0 px-8 py-4 text-sm text-gray-600 dark:text-gray-400">
                            © {new Date().getFullYear()} PT. Pestindo Mandiri
                            Utama. All rights reserved
                        </div>
                    </div>
                </div>
            </div>
            <div
                className={`${openDrawer ? "scale-95 rounded-xl" : ""} bg-white transition-all duration-500 block min-h-screen px-4 lg:hidden dark:bg-[#30334E]`}
            >
                <Navbar openDrawer={openDrawer} setOpenDrawer={setOpenDrawer} />
                <Outlet />
                <div className="py-8 mt-8 text-sm text-center text-gray-600 dark:text-gray-400">
                    © {new Date().getFullYear()} PT. Pestindo Mandiri Utama.
                    All rights reserved
                </div>
            </div>
        </div>
    );
}
