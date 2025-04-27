import type React from "react"

import { cn } from "@/lib/utils"
import { Minus, Plus } from "lucide-react"
import { useState } from "react"

interface NumberInputProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    unit?: string
    disabled?: boolean
    className?: string
}

export function NumberInput({
    value,
    onChange,
    min = 0,
    max = Number.POSITIVE_INFINITY,
    step = 1,
    unit,
    disabled = false,
    className,
}: NumberInputProps) {
    const [inputValue, setInputValue] = useState(value.toString())

    const increment = () => {
        const newValue = Math.min(max, value + step)
        onChange(newValue)
        setInputValue(newValue.toString())
    }

    const decrement = () => {
        const newValue = Math.max(min, value - step)
        onChange(newValue)
        setInputValue(newValue.toString())
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)

        const newValue = Number.parseFloat(e.target.value)
        if (!isNaN(newValue)) {
            onChange(newValue)
        }
    }

    const handleBlur = () => {
        const newValue = Number.parseFloat(inputValue)
        if (isNaN(newValue)) {
            setInputValue(value.toString())
        } else {
            const clampedValue = Math.max(min, Math.min(max, newValue))
            onChange(clampedValue)
            setInputValue(clampedValue.toString())
        }
    }

    return (
        <>

            <div
                className={cn(
                    "flex h-9 w-full items-center  rounded-md border border-input bg-background",
                    disabled && "opacity-50",
                    className,
                )}
            >
                <button
                    type="button"
                    className="flex h-full items-center justify-center px-3 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none"
                    onClick={decrement}
                    disabled={disabled || value <= min}
                >
                    <Minus className="h-4 w-4" />
                </button>
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={disabled}
                        className="h-full w-full border-none bg-transparent text-center focus:outline-none focus:ring-0"
                    />

                </div>
                <button
                    type="button"
                    className="flex h-full items-center justify-center px-3 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none"
                    onClick={increment}
                    disabled={disabled || value >= max}
                >
                    <Plus className="h-4 w-4" />
                </button>

            </div>
            {unit && (
                <div className="pointer-events-none whitespace-nowrap text-xs text-muted-foreground">
                    {unit}
                </div>
            )}
        </>
    )
}
