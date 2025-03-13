import { useEffect, useState } from "react";
import { Input } from "./ui/input";

type DebounceInputProps = {
    value: string;
    onChange: (value: string) => void;
    delay?: number;
    placeholder?: string;
    className?: string;
    type?: string;
};

export const DebounceInput = ({
    value: initialValue,
    onChange,
    delay = 300,
    placeholder,
    className,
    type = "text",
}: DebounceInputProps) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        const handler = setTimeout(() => {
            onChange(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay, onChange]);

    return (
        <Input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={className}
        />
    );
};
