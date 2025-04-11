import { motion } from "motion/react";
import logoPestindo from "../assets/logo pestindo 2.png";
import { useAtom } from "jotai";
import { themeAtom } from "@/store/theme";
import "../styles/fonts.css";

export function LoadingScreen() {
    const [theme, _] = useAtom(themeAtom);

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#30334E]">
            <div className="relative flex flex-col items-center">
                <img
                    id="logo"
                    src={logoPestindo}
                    style={{
                        filter: theme === "light" ? "" : "invert(1) brightness(1)",
                    }}
                    alt="logo pestindo"
                    className="w-[250px] md:w-[400px] mb-5 object-left object-cover"
                />

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="mt-12">
                    <div className="relative h-0.5 w-48 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{
                                x: "100%",
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut",
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-[#FF5722] via-[#1a237e] to-[#FF5722]"
                        />
                    </div>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="mt-4 text-center text-gray-600 dark:text-gray-400">
                        Mohon tunggu sebentar...
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
