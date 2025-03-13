import { motion } from "motion/react";

const SectionTitle = ({
    name,
    isSidebarOpen = true,
}: {
    name: string;
    isSidebarOpen?: boolean;
}) => {
    return (
        <div className="relative my-6 text-sm font-semibold text-gray-400 border-b border-gray-200 dark:border-gray-600 dark:text-gray-500">
            {isSidebarOpen && (
                <motion.div
                    transition={{ delay: 0.1 }}
                    className="absolute bg-white dark:bg-[#30334E] top-0 left-2 -translate-y-1/2 px-2"
                >
                    {name}
                </motion.div>
            )}
        </div>
    );
};

export default SectionTitle;
