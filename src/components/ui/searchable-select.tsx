import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableOption {
    value: string | number;
    label: string;
    searchableText?: string[];  // Additional searchable fields beyond label
    meta?: Record<string, any>;  // Additional metadata
}

interface SearchableSelectProps {
    options: SearchableOption[];
    value?: string | number | null;
    onChange: (value: string | number) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    className?: string;
    emptyMessage?: string;
    noOptionsMessage?: string;
    displayValue?: (option: SearchableOption | undefined) => string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    disabled = false,
    error,
    className,
    emptyMessage = "No results found.",
    noOptionsMessage = "No options available.",
    displayValue,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Find the selected option
    const selectedOption = options.find(
        (option) => option.value === value
    );

    // When value changes externally, reset the search
    useEffect(() => {
        setSearchQuery("");
    }, [value]);

    // Filter options based on search
    const filteredOptions = options.filter((option) => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();

        // Search in the label first
        if (option.label.toLowerCase().includes(query)) return true;

        // Search in additional searchable fields if available
        if (option.searchableText && option.searchableText.length > 0) {
            return option.searchableText.some(text =>
                text && text.toLowerCase().includes(query)
            );
        }

        return false;
    });

    // Handle display text for the selected value
    const getDisplayValue = () => {
        if (!selectedOption) return placeholder;
        if (displayValue) return displayValue(selectedOption);
        return selectedOption.label;
    };

    return (
        <div className="relative">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        ref={triggerRef}
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between",
                            !selectedOption && "text-muted-foreground",
                            error && "border-red-500 focus-visible:ring-red-500",
                            className
                        )}
                        disabled={disabled}
                    >
                        <span className="truncate">{getDisplayValue()}</span>
                        <div className="flex items-center">
                            <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="p-0 w-[var(--radix-popover-trigger-width)]"
                    align="start"
                >
                    <Command shouldFilter={false}>
                        <div className="flex items-center border-b px-3">
                            <CommandInput
                                placeholder="Search..."
                                className="h-9 flex-1"
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                            />
                        </div>
                        <CommandList>
                            {options.length === 0 ? (
                                <CommandEmpty>{noOptionsMessage}</CommandEmpty>
                            ) : filteredOptions.length === 0 ? (
                                <CommandEmpty>{emptyMessage}</CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {filteredOptions.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value.toString()}
                                            onSelect={(currentValue) => {
                                                onChange(
                                                    option.value
                                                );
                                                setOpen(false);
                                            }}
                                            disabled={disabled}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    option.value === value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
} 