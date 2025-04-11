import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ErrorAlert from "@/components/ErrorAlert";

export const Route = createFileRoute("/_layout")({
    component: LayoutComponent,
});

function LayoutComponent() {
    const [openDrawer, setOpenDrawer] = useState(false);
    const { auth } = useAuth();

    console.log('auth', auth)

    if (!auth) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="bg-black">
            <ErrorAlert />
            <div className="hidden h-fit lg:flex dark:bg-[#30334E] bg-white">
                <div className="h-auto z-10">
                    <Sidebar />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="relative max-w-screen-xl min-h-screen px-8 pb-16 mx-auto">
                        <Navbar />
                        <Outlet />
                        <div className="absolute bottom-0 left-0 px-8 py-4 text-sm text-gray-600 dark:text-gray-400">
                            © {new Date().getFullYear()} PT. Pestindo Mandiri Utama. All rights reserved
                        </div>
                    </div>
                </div>
            </div>
            <div className={`${openDrawer ? "scale-95 rounded-xl" : ""} bg-white transition-all duration-500 block min-h-screen px-4 lg:hidden dark:bg-[#30334E]`}>
                <Navbar openDrawer={openDrawer} setOpenDrawer={setOpenDrawer} />
                <Outlet />
                <div className="py-8 mt-8 text-sm text-center text-gray-600 dark:text-gray-400">© {new Date().getFullYear()} PT. Pestindo Mandiri Utama. All rights reserved</div>
            </div>
        </div>
    );
}
