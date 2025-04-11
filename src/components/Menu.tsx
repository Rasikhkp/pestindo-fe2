import { Link, ReactNode } from "@tanstack/react-router";
import { useState } from "react";

const Menu = ({
    isSidebarOpen = true,
    icon,
    menuName,
    path,
}: {
    isSidebarOpen?: boolean;
    icon: ReactNode;
    menuName: string;
    isActive?: boolean;
    width?: string | number;
    path: string;
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <Link
            to={path}
            onMouseOver={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            id="menu-button"
            activeProps={{ className: "bg-gray-200 dark:bg-blue-500" }}
            className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 duration-100 dark:text-gray-200 hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-blue-500 dark:active:bg-blue-600 active:scale-95 transition-all my-1 rounded-lg`}
        >
            {icon}
            <div id="menu-name">{menuName}</div>
            {!isSidebarOpen && showTooltip && (
                <div className="absolute px-3 py-2 duration-100 translate-x-10 bg-white dark:bg-[#30334E] border border-gray-200 dark:border-gray-600 rounded-lg">{menuName}</div>
            )}
        </Link>
    );
};

export default Menu;
