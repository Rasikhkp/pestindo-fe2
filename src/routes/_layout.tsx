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
            <div className={`${openDrawer ? "scale-95 rounded-xl" : ""} h-fit lg:flex dark:bg-[#30334E] bg-white transition-all duration-500 px-4 lg:px-0`}>
                <div className="h-auto z-10 hidden lg:block">
                    <Sidebar />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="relative max-w-screen-xl min-h-screen px-0 lg:px-8 pb-16 mx-auto">
                        <Navbar openDrawer={openDrawer} setOpenDrawer={setOpenDrawer} />
                        <Outlet />
                        <div className="absolute bottom-0 text-center text-sm left-0 px-8 py-4 w-full text-gray-600 dark:text-gray-400">
                            © {new Date().getFullYear()} PT. Pestindo Mandiri Utama. All rights reserved
                        </div>
                    </div>
                </div>
            </div>
            {/* <div className={`${openDrawer ? "scale-95 rounded-xl" : ""} bg-white transition-all duration-500 block min-h-screen px-4 lg:hidden dark:bg-[#30334E]`}>
                <Navbar openDrawer={openDrawer} setOpenDrawer={setOpenDrawer} />
                <Outlet />
                <div className="py-8 mt-8 text-sm text-center text-gray-600 dark:text-gray-400">© {new Date().getFullYear()} PT. Pestindo Mandiri Utama. All rights reserved</div>
            </div> */}
        </div>
    );
}
