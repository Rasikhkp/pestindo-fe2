import { Add, Moon, Notification, SearchNormal, Sun1, TextalignJustifycenter, UserSquare } from "iconsax-react";
import { useAtom } from "jotai";
import { AnimatePresence, useAnimate, useMotionValueEvent, useScroll, motion } from "motion/react";
import { Dispatch, forwardRef, Fragment, SetStateAction, useEffect, useRef, useState } from "react";
import { themeAtom } from "../store/theme";
import { Link, useNavigate } from "@tanstack/react-router";
import { menuData, MenuItem } from "./Sidebar";
import { Drawer } from "vaul";
import { useAuth } from "@/hooks/useAuth";

const Navbar = ({ openDrawer, setOpenDrawer }: { openDrawer?: boolean; setOpenDrawer?: Dispatch<SetStateAction<boolean>> }) => {
    const { scrollY } = useScroll();
    const [scope, animate] = useAnimate();
    const [isOnTop, setIsOnTop] = useState(true);
    const [openProfileDropdown, setOpenProfileDropdown] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement | null>(null);
    const profileDropdownRef = useRef<HTMLDivElement | null>(null);

    const handleClickOutside = (e: MouseEvent) => {
        if (!profileDropdownRef.current?.contains(e.target as Node) && !profileButtonRef.current?.contains(e.target as Node)) {
            setOpenProfileDropdown(false);
        }
    };

    useMotionValueEvent(scrollY, "change", (current) => {
        setIsOnTop(current <= 1);
    });

    useEffect(() => {
        if (isOnTop) {
            animate("nav", { padding: "12px 0px", borderWidth: 0 }, { borderWidth: { duration: 0 } });
        } else {
            animate(
                "nav",
                {
                    padding: "12px 12px",
                    borderWidth: 1,
                },
                { borderWidth: { delay: 0.1 } },
            );
        }
    }, [isOnTop]);

    useEffect(() => {
        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);
    return (
        <>
            <div ref={scope} className="sticky top-0 z-50">
                <nav className="flex justify-between py-4 bg-white dark:bg-[#30334E] rounded-b-xl border-gray-200 dark:border-gray-600 border-0">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setOpenDrawer && setOpenDrawer(true)}
                            className="block p-2 transition-all rounded-full lg:hidden dark:text-gray-200 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-700"
                        >
                            <TextalignJustifycenter />
                        </button>
                        <SearchBar />
                    </div>
                    <div className="flex items-center gap-5 text-gray-600 dark:text-gray-300">
                        <Notification size={20} className="hidden lg:block" />
                        <ThemeToggle />
                        <button
                            ref={profileButtonRef}
                            onClick={() => setOpenProfileDropdown(!openProfileDropdown)}
                            className="transition-all bg-blue-300 rounded-full size-10 active:scale-90"
                        ></button>
                        <AnimatePresence>{openProfileDropdown && <ProfileDropdown ref={profileDropdownRef} />}</AnimatePresence>
                    </div>
                </nav>
            </div>

            <Drawer.Root open={openDrawer} onOpenChange={setOpenDrawer}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                    <Drawer.Content className="bg-gray-100 flex flex-col rounded-t-[10px] mt-24 h-fit fixed bottom-0 left-0 right-0 outline-none">
                        <div className="p-4 bg-white rounded-t-[10px] flex-1">
                            <div aria-hidden className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />

                            <div className="overflow-y-scroll text-sm h-80">
                                {menuData.map((section, index) => (
                                    <Fragment key={index}>
                                        {section.title && <div className="my-4 font-semibold text-gray-600">{section.title}</div>}

                                        {section.items.map((item, index) => (
                                            <Link
                                                to={item.path}
                                                key={index}
                                                activeProps={{
                                                    className: "text-gray-600 font-semibold",
                                                }}
                                                onClick={() => setOpenDrawer && setOpenDrawer(false)}
                                                className="block my-3 text-gray-500"
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </>
    );
};

const ProfileDropdown = forwardRef<HTMLDivElement, {}>((_, ref) => {
    const { logout, isLoading } = useAuth();

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 bg-white border border-gray-200 shadow top-16 rounded-xl dark:bg-[#30334E] dark:border-gray-600"
        >
            <div className="flex justify-center gap-2 px-4 py-3 text-gray-600 dark:text-gray-200">
                <div className="bg-blue-300 rounded-full size-10"></div>
                <div>
                    <div className="text-sm font-semibold">Rasikh Khalil Pasha</div>
                    <div className="text-xs">Rasikh Khalil Pasha</div>
                </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-600"></div>

            <div className="p-2">
                <Link to="/my-profile" className="flex items-center gap-2 p-2 text-sm font-medium transition-all rounded-lg hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-[#2b2d46] dark:active:bg-[#24263b] duration-100">
                    <UserSquare size={20} />
                    Profile Saya
                </Link>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-600"></div>

            <div className="p-2">
                <button
                    onClick={logout}
                    disabled={isLoading}
                    className="w-full py-2 text-sm disabled:bg-gray-100 disabled:dark:bg-[#24263b] transition-all border border-gray-200 rounded-lg dark:border-gray-600 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-[#2b2d46] dark:active:bg-[#24263b] duration-100 active:scale-95"
                >
                    {isLoading ? "Logging out..." : "Log out"}
                </button>
            </div>
        </motion.div>
    );
});

const SearchBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    const searchRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsContainerRef = useRef<HTMLDivElement>(null);

    const scrollToSelected = () => {
        const container = resultsContainerRef.current;
        const selectedElement = container?.children[selectedIndex] as HTMLElement;

        if (container && selectedElement) {
            const containerHeight = container.clientHeight;
            const elementHeight = selectedElement.offsetHeight;
            const containerScrollTop = container.scrollTop;
            const elementTop = selectedElement.offsetTop;

            if (elementTop + elementHeight > containerScrollTop + containerHeight) {
                container.scrollTop = elementTop + elementHeight - containerHeight;
            } else if (elementTop < containerScrollTop) {
                container.scrollTop = elementTop;
            }
        }
    };

    const performSearch = (term: string) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }

        const results: MenuItem[] = [];
        menuData.forEach((section) => {
            section.items.forEach((item) => {
                if (item.name.toLowerCase().includes(term.toLowerCase())) {
                    results.push({
                        ...item,
                        section: section.title,
                    });
                }
            });
        });

        setSearchResults(results);
        setSelectedIndex(0);
    };

    const handleSelectItem = (item: MenuItem) => {
        navigate({ to: item.path });
        setIsOpen(false);
        setSearchTerm("");
        setSearchResults([]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
            setIsOpen(false);
        }

        if (e.ctrlKey && e.key === "/") {
            e.preventDefault();
            setIsOpen(true);
        }

        if (!isOpen || searchResults.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
                break;
            case "Enter":
                e.preventDefault();
                if (searchResults[selectedIndex]) {
                    handleSelectItem(searchResults[selectedIndex]);
                }
                break;
        }
    };

    const handleClickOutside = (e: MouseEvent) => {
        if (!searchRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        scrollToSelected();
    }, [selectedIndex]);

    useEffect(() => {
        performSearch(searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY;
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = "100%";
            inputRef.current?.focus();
        } else {
            const scrollY = document.body.style.top;
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.width = "";
            window.scrollTo(0, parseInt(scrollY || "0") * -1);
            setSearchTerm("");
            setSearchResults([]);
        }

        document.addEventListener("click", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, searchResults.length, selectedIndex]);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(true)}
                className="items-center gap-4 lg:px-4 text-sm text-gray-600 dark:text-gray-200 transition-all rounded-lg hover:bg-gray-50 active:bg-gray-100 flex dark:hover:bg-[#282a41] dark:active:bg-[#1a1b2b]"
            >
                <SearchNormal size={20} />
                <div className="hidden text-gray-400 lg:block">Search (Ctrl+/)</div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="fixed inset-0 flex items-center justify-center w-screen h-screen bg-black/50 backdrop-blur-sm"
                    >
                        <div ref={searchRef} className="w-[500px] rounded-xl bg-white dark:bg-[#30334E] -translate-y-20 lg:-translate-y-0">
                            <div className="flex items-center gap-4 p-4 text-gray-600 dark:text-gray-200">
                                <SearchNormal className="m-2" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full text-sm bg-transparent outline-none"
                                />
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 transition-all rounded-full hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-700"
                                >
                                    <Add className="rotate-45" />
                                </button>
                            </div>

                            <div className="border-b border-gray-200 dark:border-gray-600"></div>

                            <div className="relative">
                                <div className="absolute top-0 left-0 right-0 z-10 h-4 bg-gradient-to-b from-white dark:from-[#30334E] to-transparent" />

                                <div ref={resultsContainerRef} className="px-6 py-4 my-5 overflow-y-auto h-96 scroll-smooth scrollbar-none">
                                    {searchTerm ? (
                                        searchResults.length > 0 ? (
                                            searchResults.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleSelectItem(item)}
                                                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${index === selectedIndex ? "bg-gray-100 dark:bg-blue-500" : "hover:bg-gray-50 dark:hover:bg-blue-500"
                                                        }`}
                                                >
                                                    <div className="flex items-center flex-1 gap-4 text-gray-600 dark:text-gray-200">
                                                        {item.icon}
                                                        <span className="text-sm ">{item.name}</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-200">{item.section}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-4 text-center text-gray-500 dark:text-gray-200">No results found</div>
                                        )
                                    ) : (
                                        menuData.map((section, index) => (
                                            <div key={index}>
                                                {section.title && <div className="my-2 text-xs font-semibold text-gray-400">{section.title}</div>}

                                                {section.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() =>
                                                            handleSelectItem({
                                                                ...item,
                                                                section: section.title,
                                                            })
                                                        }
                                                        className="flex items-center gap-4 p-3 text-gray-600 rounded-lg cursor-pointer dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-blue-500"
                                                    >
                                                        {item.icon}
                                                        <span className="text-sm">{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 z-10 h-4 bg-gradient-to-t from-white dark:from-[#30334E] to-transparent" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const ThemeToggle = () => {
    const [theme, setTheme] = useAtom(themeAtom);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    return (
        <button onClick={toggleTheme} className="p-2 transition-all rounded-full hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-700">
            {theme === "dark" ? <Sun1 size={20} /> : <Moon size={20} />}
        </button>
    );
};

export default Navbar;
