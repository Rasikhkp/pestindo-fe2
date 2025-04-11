import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

export interface MultiSelectOption {
    value: string
    label: string
}

export interface MultiSelectProps {
    options: MultiSelectOption[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    className?: string
}

/**
 * Custom multi-select component that allows searching and selecting multiple options
 * Built with pure HTML, Tailwind, and React state management
 */
export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select options...",
    className = ""
}: MultiSelectProps) {
    // State management
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on search input
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()) &&
        !selected.includes(option.value)
    );

    // Get selected option labels for display
    const selectedLabels = selected.map(value => {
        const option = options.find(opt => opt.value === value);
        return option ? option.label : value;
    });

    // Handle clicks outside to close dropdown
    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Toggle selection of an option
    const toggleOption = (value: string) => {
        // If already selected, remove it
        if (selected.includes(value)) {
            onChange(selected.filter(item => item !== value));
        }
        // Otherwise add it to selection
        else {
            onChange([...selected, value]);
        }
    };

    // Remove a selected item
    const removeItem = (value: string, e?: React.MouseEvent) => {
        e?.stopPropagation(); // Prevent dropdown from opening when removing
        onChange(selected.filter(item => item !== value));
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Main trigger button/display area */}
            <div
                className="flex min-h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1 w-full">
                    {/* Show selected items as badges */}
                    {selected.length > 0 ? (
                        <>
                            {selectedLabels.map((label, index) => (
                                <span
                                    key={selected[index]}
                                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded flex items-center text-xs"
                                >
                                    {label}
                                    <button
                                        onClick={(e) => removeItem(selected[index], e)}
                                        className="ml-1 hover:text-blue-500 focus:outline-none"
                                        aria-label={`Remove ${label}`}
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </>
                    ) : (
                        // Show placeholder when nothing is selected
                        <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
                    )}
                </div>

                {/* Dropdown indicator */}
                <div className="ml-auto flex items-center">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    {/* Search input */}
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        <input
                            autoFocus
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300"
                        />
                    </div>

                    {/* Option list */}
                    <div className="max-h-60 overflow-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No options found</div>
                        ) : (
                            filteredOptions.map(option => (
                                <div
                                    key={option.value}
                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm flex items-center"
                                    onClick={() => toggleOption(option.value)}
                                >
                                    {option.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 