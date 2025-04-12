import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { useMemo } from "react";
import { SearchableSelect, SearchableOption } from "@/components/ui/searchable-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const requestSchema = z.object({
    employee_id: z.number().optional(),
    type: z.enum(["in", "out"]),
    items: z.array(z.object({
        item_id: z.number().min(1, "Item harus dipilih"),
        amount: z.coerce.number().min(1, "Jumlah harus minimal 1"),
    })).min(1, "Minimal harus ada satu item"),
});

export type RequestFormValues = z.infer<typeof requestSchema>;

interface RequestFormProps {
    defaultValues?: {
        employee_id?: number;
        type: "in" | "out";
        items: Array<{
            item_id: number;
            amount: number;
        }>;
    };
    employees?: Array<{ id: number; code: string; name: string }>;
    items: Array<{ id: number; code: string; name: string; unit: string }>;
    onSubmit: (data: RequestFormValues) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    showEmployeeSelect?: boolean;
}

export function RequestForm({
    defaultValues,
    employees = [],
    items,
    onSubmit,
    onCancel,
    isSubmitting = false,
    showEmployeeSelect = false
}: RequestFormProps) {
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<RequestFormValues>({
        resolver: zodResolver(requestSchema),
        defaultValues: {
            employee_id: defaultValues?.employee_id,
            type: defaultValues?.type || "out",
            items: defaultValues?.items || [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const watchItems = watch("items");

    // Convert employees to the format expected by SearchableSelect
    const employeeOptions = useMemo(() => employees.map(employee => ({
        value: employee.id,
        label: employee.name,
        searchableText: [employee.code], // Also search by code
        meta: { code: employee.code }
    })), [employees]);

    // Track already selected items
    const selectedItemIds = useMemo(() =>
        watchItems
            ?.filter(item => item.item_id)
            .map(item => item.item_id),
        [watchItems]
    );

    // Get items that are available for selection in a specific row
    const getItemOptions = (currentItemId?: number) => {
        // For an existing item, we need to include its own ID in the available options
        const filteredItems = items.filter(item =>
            !selectedItemIds.includes(item.id) || item.id === currentItemId
        );

        return filteredItems.map(item => ({
            value: item.id,
            label: item.name,
            searchableText: [item.code], // Also search by code
            meta: {
                code: item.code,
                unit: item.unit
            }
        }));
    };

    const handleIncrement = (index: number) => {
        const currentAmount = watchItems[index]?.amount || 0;
        setValue(`items.${index}.amount`, currentAmount + 1);
    };

    const handleDecrement = (index: number) => {
        const currentAmount = watchItems[index]?.amount || 0;
        if (currentAmount > 1) {
            setValue(`items.${index}.amount`, currentAmount - 1);
        }
    };

    // Custom display for employee select
    const renderEmployeeDisplay = (option?: SearchableOption) => {
        if (!option) return "";
        return `${option.meta?.code ? `#${option.meta.code} - ` : ''}${option.label}`;
    };

    // Custom display for item select
    const renderItemDisplay = (option?: SearchableOption) => {
        if (!option) return "";
        return `${option.meta?.code ? `#${option.meta.code} - ` : ''}${option.label}`;
    };

    const buttonDisabled = () => {
        const isLastItemSelected = watchItems?.length ? watchItems[watchItems.length - 1]?.item_id !== undefined : true;
        const isAllItemsAlreadySelected = items.every(item => watchItems?.find(watchItem => watchItem.item_id === item.id));

        return isAllItemsAlreadySelected || !isLastItemSelected;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
            {/* Employee Selection - Only shown for Superadmin */}
            {showEmployeeSelect && (
                <div className="space-y-2">
                    <Label htmlFor="employee_id">Teknisi</Label>
                    <Controller
                        name="employee_id"
                        control={control}
                        render={({ field }) => (
                            <SearchableSelect
                                options={employeeOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Pilih Teknisi"
                                error={errors.employee_id?.message}
                                disabled={isSubmitting}
                                displayValue={renderEmployeeDisplay}
                            />
                        )}
                    />
                </div>
            )}

            {/* Type Selection */}
            <div className="space-y-2">
                <Label htmlFor="type">Tipe</Label>
                <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex gap-6 mt-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="in" id="option-in" />
                                <Label htmlFor="option-in" className="cursor-pointer">Masuk</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="out" id="option-out" />
                                <Label htmlFor="option-out" className="cursor-pointer">Keluar</Label>
                            </div>
                        </RadioGroup>
                    )}
                />
            </div>

            {/* Dynamic Item List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Items</Label>
                    <Button
                        type="button"
                        disabled={buttonDisabled()}
                        onClick={() => append({ item_id: undefined as unknown as number, amount: 1 })}
                        className="flex items-center gap-1 text-gray-200 transition-all bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Tambah Item
                    </Button>
                </div>

                {errors.items && typeof errors.items.message === 'string' && (
                    <p className="mt-1 text-xs text-red-500">{errors.items.message}</p>
                )}

                {fields.map((field, index) => {
                    // Get item options for this field, excluding already selected items except this one
                    const itemOptions = getItemOptions(watchItems[index]?.item_id);

                    return (
                        <div key={field.id} className="p-4 space-y-4 border rounded-lg">
                            <div className="flex justify-between">
                                <h3 className="font-medium">Item #{index + 1}</h3>
                                {fields.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Item Selection */}
                            <div className="space-y-2">
                                <Label htmlFor={`items.${index}.item_id`}>Item</Label>
                                <Controller
                                    name={`items.${index}.item_id`}
                                    control={control}
                                    render={({ field }) => (
                                        <SearchableSelect
                                            options={itemOptions}
                                            value={field.value}
                                            onChange={(value) => field.onChange(value)}
                                            placeholder="Pilih Item"
                                            error={errors.items?.[index]?.item_id?.message}
                                            disabled={isSubmitting}
                                            displayValue={renderItemDisplay}
                                        />
                                    )}
                                />
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <Label htmlFor={`items.${index}.amount`}>Jumlah</Label>
                                <div className="flex items-center max-w-xs">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDecrement(index)}
                                        className="rounded-r-none"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <Controller
                                        name={`items.${index}.amount`}
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                type="number"
                                                className="text-center rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                            />
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleIncrement(index)}
                                        className="rounded-l-none"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {errors.items?.[index]?.amount && (
                                    <p className="mt-1 text-xs text-red-500">{errors.items?.[index]?.amount?.message}</p>
                                )}
                            </div>

                            {/* Item Unit */}
                            {watchItems[index]?.item_id && (
                                <div className="text-sm text-gray-500">
                                    Unit: {items.find(item => item.id === watchItems[index]?.item_id)?.unit}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-end gap-4 sm:flex-row">
                <Button type="button" onClick={onCancel} variant="destructive" className="hover:bg-red-600 active:scale-95">
                    Batalkan
                </Button>
                <Button type="submit" disabled={isSubmitting} variant="default" className="hover:bg-gray-900 active:scale-95">
                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
            </div>
        </form>
    );
} 