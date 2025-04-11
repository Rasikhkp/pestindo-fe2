import React, { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

export interface DetailedOption<T = number> {
    id: T;
    primary: string;
    secondary: string;
}

interface DetailedSelectProps<T = number> {
    options: DetailedOption<T>[];
    value: T | undefined;
    onChange: (value: T) => void;
    placeholder?: string;
    isLoading?: boolean;
    className?: string;
    error?: string;
    disabled?: boolean;
}

/**
 * A dropdown select component that displays two lines of information for each option:
 * a primary label (like name) and a secondary label (like role, code, etc.)
 */
export function DetailedSelect<T = number>({
    options,
    value,
    onChange,
    placeholder = "Select option",
    isLoading = false,
    className = "",
    error,
    disabled = false
}: DetailedSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);

    // Find the selected option for display
    const selectedOption = options.find(option => option.id === value);

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex w-full justify-between rounded-md border bg-transparent px-3 py-2 text-sm ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
            >
                {selectedOption ? (
                    <div className="flex flex-col items-start">
                        <span>{selectedOption.primary}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{selectedOption.secondary}</span>
                    </div>
                ) : (
                    <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white text-gray-900 shadow-md animate-in fade-in-80 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    <div className="p-1">
                        {isLoading ? (
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none">
                                <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                                Loading...
                            </div>
                        ) : options.length === 0 ? (
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-gray-500 dark:text-gray-400">
                                No options available
                            </div>
                        ) : (
                            <>
                                {options.map((option) => (
                                    <div
                                        key={String(option.id)}
                                        className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 ${value === option.id ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100' : ''}`}
                                        onClick={() => {
                                            onChange(option.id);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span>{option.primary}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{option.secondary}</span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop - close when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
} 