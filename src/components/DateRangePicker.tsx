import * as React from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerWithRangeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    value?: DateRange | undefined;
    onChange?: (value: DateRange | undefined) => void;
}

export function DatePickerWithRange({ className, value: propValue, onChange: propOnChange }: DatePickerWithRangeProps) {
    // Fallback internal state if no value/onChange are provided.
    const [internalValue, setInternalValue] = React.useState<DateRange | undefined>({
        from: new Date(2022, 0, 20),
        to: addDays(new Date(2022, 0, 20), 20),
    });

    // Use controlled props if provided, otherwise fallback to internal state.
    const value = propValue !== undefined ? propValue : internalValue;
    const onChange = propOnChange ? propOnChange : setInternalValue;

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button id="date" variant="outline" className={cn("w-[300px] justify-start text-left font-normal", !value && "text-muted-foreground")}>
                        <CalendarIcon />
                        {value?.from ? (
                            value.to ? (
                                <>
                                    {format(value.from, "LLL dd, y")} - {format(value.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(value.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={value?.from} selected={value} onSelect={onChange} numberOfMonths={2} />
                </PopoverContent>
            </Popover>
        </div>
    );
}
