import { ArrowLeft2, ArrowRight2, Activity, ArrangeHorizontalSquare, Briefcase, Calendar, Category, ChemicalGlass, Key, Note, Profile2User, Truck, User, ShoppingBag } from "iconsax-react";
import logoPestindo from "../assets/logo pestindo 2.png";
import { Fragment, useState } from "react";
import { useAnimate } from "motion/react";
import Menu from "./Menu";
import SectionTitle from "./SectionTitle";
import { useAtom } from "jotai";
import { themeAtom } from "../store/theme";

export type MenuItem = {
    id: string;
    name: string;
    icon: React.ReactNode;
    path: string;
    section: string;
};

export type Section = {
    title: string;
    items: Omit<MenuItem, "section">[];
};

export const menuData: Section[] = [
    {
        title: "",
        items: [
            {
                id: "dashboard",
                name: "Dashboard",
                icon: <Category size={20} />,
                path: "/dashboard",
            },
        ],
    },
    {
        title: "SALES",
        items: [
            {
                id: "customers",
                name: "Pelanggan",
                icon: <Profile2User size={20} />,
                path: "/sales/customer",
            },
            {
                id: "suppliers",
                name: "Supplier",
                icon: <Truck size={20} />,
                path: "/sales/supplier",
            },
            {
                id: "activities",
                name: "Aktivitas",
                icon: <Activity size={20} />,
                path: "/sales/activity",
            },
            {
                id: "sales-jobs",
                name: "Pekerjaan",
                icon: <Briefcase size={20} />,
                path: "/sales/job",
            },
        ],
    },
    {
        title: "BISNIS",
        items: [
            {
                id: "business-jobs",
                name: "Pekerjaan",
                icon: <Briefcase size={20} />,
                path: "/business/job",
            },
            {
                id: "schedule",
                name: "Jadwal",
                icon: <Calendar size={20} />,
                path: "/business/schedule",
            },
        ],
    },
    {
        title: "INVENTARIS",
        items: [
            {
                id: "items",
                name: "Barang",
                icon: <ChemicalGlass size={20} />,
                path: "/inventory/item",
            },
            {
                id: "requests",
                name: "Pengajuan",
                icon: <ArrangeHorizontalSquare size={20} />,
                path: "/inventory/request",
            },
            {
                id: "logs",
                name: "Log",
                icon: <Note size={20} />,
                path: "/inventory/log",
            },
            {
                id: "orders",
                name: "Orders",
                icon: <ShoppingBag size={20} />,
                path: "/inventory/order",
            },
        ],
    },
    {
        title: "TEKNISI",
        items: [
            {
                id: "technician-jobs",
                name: "Pekerjaan",
                icon: <Briefcase size={20} />,
                path: "/technician/job",
            },
            {
                id: "technician-items",
                name: "Barang",
                icon: <ChemicalGlass size={20} />,
                path: "/technician/item",
            },
            {
                id: "technician-request",
                name: "Pengajuan",
                icon: <ArrangeHorizontalSquare size={20} />,
                path: "/technician/request",
            },
        ],
    },
    {
        title: "ADMIN",
        items: [
            {
                id: "users",
                name: "User",
                icon: <User size={20} />,
                path: "/admin/user",
            },
            {
                id: "roles",
                name: "Role",
                icon: <Key size={20} />,
                path: "/admin/role",
            },
        ],
    },
];

const Sidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [scope, animate] = useAnimate();
    const [theme, _] = useAtom(themeAtom);

    const toggleSidebar = () => {
        if (isSidebarOpen) {
            const sequence: any = [
                ["#menu-name", { display: "none", opacity: 0 }, { duration: 0 }],
                ["#menu-button", { padding: "12px 12px" }, { duration: 0 }],
                ["#logo", { width: 41 }, { duration: 0.3, at: 0, ease: [0.39, 0.24, 0.3, 1] }],
            ];
            animate(sequence);
        } else {
            const sequence: any = [
                ["#menu-button", { padding: "12px 16px" }, { delay: 0.1 }],
                ["#menu-name", { display: "block" }, { duration: 0.1, at: 0.1 }],
                ["#menu-name", { opacity: 100 }, { duration: 0.1 }],
                ["#logo", { width: 200 }, { duration: 0.3, at: 0, ease: [0.39, 0.24, 0.3, 1] }],
            ];
            animate(sequence);
        }
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div ref={scope} className="sticky top-0 h-screen p-4 border-r border-gray-200 dark:border-gray-600">
            <button
                onClick={toggleSidebar}
                className="absolute right-0 p-2 text-gray-500 transition-all translate-x-1/2 bg-white dark:bg-[#30334E] border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-[#282a41] active:bg-gray-200 dark:active:bg-[#1a1b2b] top-7"
            >
                {isSidebarOpen ? <ArrowLeft2 size={16} /> : <ArrowRight2 size={16} />}
            </button>

            <img
                id="logo"
                src={logoPestindo}
                style={{
                    filter: theme === "light" ? "" : "invert(1) brightness(1)",
                }}
                alt="logo pestindo"
                className="w-[200px] mb-5 h-[61px] object-left object-cover"
            />

            <div className="relative">
                <div className="absolute top-0 left-0 right-0 z-10 w-full h-4 bg-gradient-to-b from-white dark:from-[#30334E] to-transparent" />
            </div>

            <div className="h-[calc(100vh-160px)] overflow-y-scroll scrollbar-none py-4">
                {menuData.map((section, index) => (
                    <Fragment key={index}>
                        {section.title && <SectionTitle name={section.title} isSidebarOpen={isSidebarOpen} />}

                        {section.items.map((item, index) => (
                            <Menu key={index} icon={item.icon} menuName={item.name} isSidebarOpen={isSidebarOpen} path={item.path} />
                        ))}
                    </Fragment>
                ))}
            </div>
            <div className="relative">
                <div className="absolute top-0 left-0 right-0 z-10 w-full h-4 bg-gradient-to-t -translate-y-[100%] from-white dark:from-[#30334E] to-transparent" />
            </div>
        </div>
    );
};

export default Sidebar;
