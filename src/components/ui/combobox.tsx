import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { Button } from "./button";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
    value: string | number;
    onValueChange: (val: string | number) => void;
    data: { id: number | string; name: string }[];
    className?: string;
    placeholder?: string;
}

export function Combobox({
    value,
    onValueChange,
    data,
    className,
    placeholder = "Pilih",
}: ComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredData = search
        ? data.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
        : data;

    const selectedItem = data.find((item) => String(item.id) === String(value));
    const displayValue = selectedItem?.name || "";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("justify-between", className)}
                >
                    {displayValue
                        ? data.find((item) => item.id === value)?.name
                        : placeholder}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                <Command>
                    <CommandInput
                        placeholder="Cari..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {filteredData.length === 0 ? (
                            <CommandEmpty>Tidak ada data</CommandEmpty>
                        ) : (
                            filteredData.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    onSelect={() => {
                                        onValueChange(item.id);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    {item.name}
                                </CommandItem>
                            ))
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
} 