import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type React from "react"

interface SelectableCardProps {
    value: string
    label: string
    description?: string
    selected: boolean
    icon?: React.ReactNode
    onClick: () => void
}

export function SelectableCard({ value, label, description = 'tes satu dua tiga', selected, icon, onClick }: SelectableCardProps) {
    return (
        <div
            className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-5 transition-all",
                selected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/30 hover:bg-primary/3",
            )}
            onClick={onClick}
        >
            {selected && (
                <div className="absolute right-3 top-3 rounded-full bg-primary p-1 text-white shadow-sm">
                    <Check className="h-3.5 w-3.5" />
                </div>
            )}
            {icon && <div className="mb-3">{icon}</div>}
            <div className="text-center">
                <div className="font-medium">{label}</div>
                {description && <div className="mt-1.5 text-xs text-muted-foreground max-w-[180px]">{description}</div>}
            </div>
        </div>
    )
}
