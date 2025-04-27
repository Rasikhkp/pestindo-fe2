import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: number | undefined;
    onChange: (value: number) => void;
    currencySymbol?: string;
    className?: string;
    placeholder?: string;
}

export function CurrencyInput({
    value,
    onChange,
    currencySymbol = "Rp",
    className,
    placeholder = "0",
    ...props
}: CurrencyInputProps) {
    // Track the formatted display value
    const [displayValue, setDisplayValue] = useState("");
    // Track cursor position to handle proper placement after formatting
    const inputRef = useRef<HTMLInputElement>(null);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);

    // Format a number to include thousand separators
    const formatNumber = (num: number | undefined): string => {
        if (num === undefined || isNaN(num)) return "";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // Parse a formatted string back to a number
    const parseFormattedNumber = (formatted: string): number => {
        if (!formatted) return 0;
        // Remove non-numeric characters except for decimal point
        const numericString = formatted.replace(/[^\d]/g, "");
        return parseInt(numericString, 10) || 0;
    };

    // Update the displayed value whenever the actual value changes
    useEffect(() => {
        setDisplayValue(formatNumber(value));
    }, [value]);

    // Restore cursor position after formatting changes the input
    useEffect(() => {
        if (cursorPosition !== null && inputRef.current) {
            // Calculate the proper cursor position after formatting
            const input = inputRef.current;
            try {
                input.setSelectionRange(cursorPosition, cursorPosition);
            } catch (err) {
                // Fallback for edge cases where cursor position is out of bounds
                const endPos = displayValue.length;
                input.setSelectionRange(endPos, endPos);
            }
            setCursorPosition(null);
        }
    }, [displayValue, cursorPosition]);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const inputValue = input.value;

        // Store cursor position before value update
        const currentCursorPosition = input.selectionStart || 0;

        // Count dots before cursor position (to adjust cursor position after formatting)
        const dotsBeforeCursor = (inputValue.substring(0, currentCursorPosition).match(/\./g) || []).length;

        // Get the raw numeric value
        const numericValue = parseFormattedNumber(inputValue);

        // Update the actual value through onChange
        onChange(numericValue);

        // Format and display the value
        const formattedValue = formatNumber(numericValue);
        setDisplayValue(formattedValue);

        // Adjust cursor position for new formatting
        const newDotsBeforeCursor = (formattedValue.substring(0, currentCursorPosition).match(/\./g) || []).length;
        const dotDifference = newDotsBeforeCursor - dotsBeforeCursor;

        // Set new cursor position accounting for added/removed separators
        setCursorPosition(currentCursorPosition + dotDifference);
    };

    // Handle focus to select all text for easier editing
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (props.onFocus) props.onFocus(e);
        e.target.select();
    };

    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500">{currencySymbol}</span>
            </div>
            <Input
                ref={inputRef}
                type="text"
                className={cn("pl-10", className)}
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                placeholder={placeholder}
                {...props}
            />
        </div>
    );
} 