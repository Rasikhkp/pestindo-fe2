import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { formatToRupiah } from "@/lib/utils";
import { SearchableSelect, SearchableOption } from "@/components/ui/searchable-select";
import { Order } from "@/types/types";

export const orderSchema = z.object({
    supplier_id: z.number().min(1, "Supplier harus dipilih"),
    items: z.array(z.object({
        item_id: z.number().min(1, "Item harus dipilih"),
        amount: z.coerce.number().min(1, "Jumlah harus minimal 1"),
        price: z.coerce.number().min(1, "Harga harus diisi"),
    })).min(1, "Minimal harus ada satu item"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
    defaultValues?: Order;
    suppliers: Array<{ id: number; code: string; name: string }>;
    items: Array<{ id: number; code: string; name: string; price: number; unit: string }>;
    onSubmit: (data: OrderFormValues) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export function OrderForm({ defaultValues, suppliers, items, onSubmit, onCancel, isSubmitting = false }: OrderFormProps) {
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            supplier_id: defaultValues?.supplier.id,
            items: defaultValues?.items.map(item => ({
                item_id: item.id,
                amount: item.amount,
                price: item.price,
            })),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const watchItems = watch("items");

    const totalPrice = watchItems?.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.amount || 0);
    }, 0);

    // Convert suppliers to the format expected by SearchableSelect
    const supplierOptions = useMemo(() => suppliers.map(supplier => ({
        value: supplier.id,
        label: supplier.name,
        searchableText: [supplier.code], // Also search by code
        meta: { code: supplier.code }
    })), []);

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
                price: item.price,
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

    // Custom display for supplier select
    const renderSupplierDisplay = (option?: SearchableOption) => {
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
            {/* Supplier Selection */}
            <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier</Label>
                <Controller
                    name="supplier_id"
                    control={control}
                    render={({ field }) => (
                        <SearchableSelect
                            options={supplierOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Pilih Supplier"
                            error={errors.supplier_id?.message}
                            disabled={isSubmitting}
                            displayValue={renderSupplierDisplay}
                        />
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
                        onClick={() => append({ item_id: undefined as unknown as number, amount: 1, price: 0 })}
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

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                                {/* Price */}
                                <div className="space-y-2">
                                    <Label htmlFor={`items.${index}.price`}>Harga</Label>
                                    <Controller
                                        name={`items.${index}.price`}
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                type="number"
                                                placeholder="Harga"
                                            />
                                        )}
                                    />
                                    {errors.items?.[index]?.price && (
                                        <p className="mt-1 text-xs text-red-500">{errors.items?.[index]?.price?.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Item Subtotal */}
                            <div className="pt-2 text-right text-sm text-gray-600">
                                Subtotal: {formatToRupiah((watchItems[index]?.price || 0) * (watchItems[index]?.amount || 0))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Total */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-semibold text-right">
                    Total: {formatToRupiah(totalPrice)}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-end gap-4 sm:flex-row">
                <Button type="button" onClick={onCancel} variant="destructive" className="hover:bg-red-600 active:scale-95">
                    Batalkan
                </Button>
                <Button type="submit" disabled={isSubmitting} variant="default" className="hover:bg-gray-900 active:scale-95">
                    Simpan
                </Button>
            </div>
        </form>
    );
} 