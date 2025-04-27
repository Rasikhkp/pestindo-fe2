"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface ChipOption {
    value: string
    label: string
}

interface ChipSelectProps {
    options: ChipOption[]
    value: string[]
    onChange: (value: string[]) => void
    className?: string
}

export function ChipSelect({ options, value, onChange, className }: ChipSelectProps) {
    const toggleOption = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter((v) => v !== optionValue))
        } else {
            onChange([...value, optionValue])
        }
    }

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {options.map((option) => {
                const isSelected = value.includes(option.value)
                return (
                    <div
                        key={option.value}
                        className={cn(
                            "flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-sm transition-all h-fit",
                            isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 hover:bg-primary/5",
                        )}
                        onClick={() => toggleOption(option.value)}
                    >
                        {isSelected && <Check className="mr-1.5 h-3.5 w-3.5" />}
                        <span>{option.label}</span>
                    </div>
                )
            })}
        </div>
    )
}
