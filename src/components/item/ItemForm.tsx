import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, Radio } from "@heroui/radio";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { itemSchema } from "@/schemas/itemSchema";
import { NumberInput } from "@/components/ui/number-input";
import { Dropzone } from "@/components/ui/dropzone";
import { CurrencyInput } from "../ui/currency-input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Combobox } from "../ui/combobox";

// Constants
const PLACEHOLDER_IMAGE = "https://placehold.co/300x200";
const IMAGE_BASE_URL = import.meta.env.VITE_API_URL + "/storage/";

// Update the schema to include supplier
const extendedItemSchema = itemSchema.extend({
    supplier: z.number().optional()
});

export type ItemForm = z.infer<typeof extendedItemSchema>;

interface FormSectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    required?: boolean;
}

function FormSection({ title, children, className = "", required = false }: FormSectionProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            <h4 className="text-sm font-medium text-gray-700 flex items-start">
                {title}
                {required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            <div>{children}</div>
        </div>
    );
}

interface ItemFormProps {
    defaultValues?: Partial<ItemForm>;
    onSubmit: (data: ItemForm) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    showNote?: boolean;
    isEdit?: boolean;
    suppliers?: { id: number; name: string }[];
}

export function ItemForm({
    defaultValues,
    onSubmit,
    onCancel,
    isSubmitting,
    showNote = false,
    isEdit = false,
    suppliers = []
}: ItemFormProps) {
    const [initialAmount, setInitialAmount] = useState<number>(defaultValues?.amount || 0);
    const [amountChanged, setAmountChanged] = useState<boolean>(false);
    const [imagePreview, setImagePreview] = useState<{ url: string; alt: string }[]>([]);

    // Initial form setup
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        trigger,
        formState: { errors },
    } = useForm<ItemForm>({
        resolver: zodResolver(extendedItemSchema),
        defaultValues: {
            name: "",
            price: 0,
            amount: 0,
            type: "chemical",
            unit: "",
            image: "",
            note: "",
            changeReason: "",
            supplier: undefined,
            ...defaultValues
        },
    });

    const amount = watch("amount");
    const image = watch("image");

    // Set initial amount for tracking changes
    useEffect(() => {
        if (defaultValues?.amount !== undefined) {
            setInitialAmount(defaultValues.amount);
        }
    }, [defaultValues?.amount]);

    // Update amount changed state when amount changes
    useEffect(() => {
        const hasChanged = amount !== initialAmount;
        setAmountChanged(hasChanged);

        // Trigger validation to ensure notes are required when amount changes in edit mode
        if (hasChanged && isEdit) {
            trigger(["note", "changeReason"]);
        }
    }, [amount, initialAmount, isEdit, trigger]);

    // Initialize image preview when component mounts or default image changes
    useEffect(() => {
        if (defaultValues?.image && imagePreview.length === 0) {
            const imageUrl = defaultValues.image.startsWith('http')
                ? defaultValues.image
                : `${IMAGE_BASE_URL}${defaultValues.image}`;

            setImagePreview([{ url: imageUrl, alt: defaultValues.name || "Item image" }]);
        }
    }, [defaultValues, imagePreview.length]);

    // Handle file upload through dropzone
    const handleDrop = useCallback((files: File[]) => {
        if (files.length > 0) {
            const file = files[0]; // Only use the first file
            setValue("imageFile", file, { shouldValidate: true });

            // Create a preview URL
            const previewUrl = URL.createObjectURL(file);
            setImagePreview([{ url: previewUrl, alt: "Item preview" }]);

            // Clear the image string since we're using a file
            setValue("image", "", { shouldValidate: true });
        }
    }, [setValue]);

    // Handle removing the uploaded image
    const handleRemoveImage = useCallback((index: number) => {
        // Revoke object URL to avoid memory leaks
        if (imagePreview[index]?.url && imagePreview[index].url.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview[index].url);
        }

        setImagePreview([]);
        setValue("imageFile", undefined, { shouldValidate: true });
        setValue("image", "", { shouldValidate: true });
    }, [imagePreview, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
            {/* Basic Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Dasar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Tipe Item */}
                    <FormSection title="Tipe Item" required>
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup size="sm" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                                    <Radio value="chemical">Chemical</Radio>
                                    <Radio value="equipment">Equipment</Radio>
                                    <Radio value="asset">Asset</Radio>
                                </RadioGroup>
                            )}
                        />
                        {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>}
                    </FormSection>

                    {/* Nama Item */}
                    <FormSection title="Nama Item" required>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="Nama Item" />}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                    </FormSection>

                    {/* Supplier */}
                    <FormSection title="Supplier">
                        <Controller
                            name="supplier"
                            control={control}
                            render={({ field }) => (
                                <Combobox
                                    value={field.value || 0}
                                    onValueChange={field.onChange}
                                    data={suppliers}
                                    placeholder="Pilih supplier"
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.supplier && <p className="mt-1 text-xs text-red-500">{errors.supplier.message}</p>}
                    </FormSection>

                    {/* Harga */}
                    <FormSection title="Harga" required>
                        <Controller
                            name="price"
                            control={control}
                            render={({ field }) => (
                                <CurrencyInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Harga"
                                    className="max-w-xs"
                                    currencySymbol="Rp"
                                />
                            )}
                        />
                        {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
                    </FormSection>

                    {/* Jumlah & Satuan */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <FormSection title="Jumlah" required>
                                <Controller
                                    name="amount"
                                    control={control}
                                    render={({ field }) => (
                                        <NumberInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            min={0}
                                            className="max-w-xs"
                                        />
                                    )}
                                />
                                {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
                            </FormSection>
                        </div>
                        <div className="space-y-2">
                            <FormSection title="Satuan" required>
                                <Controller
                                    name="unit"
                                    control={control}
                                    render={({ field }) => <Input {...field} placeholder="Satuan (pcs, kg, box, dll)" />}
                                />
                                {errors.unit && <p className="mt-1 text-xs text-red-500">{errors.unit.message}</p>}
                            </FormSection>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Image Upload Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Gambar Item</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormSection title="Gambar Item">
                        <Controller
                            name="imageFile"
                            control={control}
                            render={({ fieldState }) => (
                                <div className={fieldState.error ? 'border border-red-500 rounded-lg p-1' : ''}>
                                    <Dropzone
                                        onDrop={handleDrop}
                                        files={imagePreview}
                                        onRemove={handleRemoveImage}
                                        className="w-full"
                                    />
                                    {fieldState.error && (
                                        <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                                    )}
                                </div>
                            )}
                        />
                    </FormSection>
                </CardContent>
            </Card>

            {/* Conditional Card for Notes - only show when needed */}
            {(showNote || (amountChanged && isEdit)) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Catatan & Perubahan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Show change reason and note when amount changes (only in edit mode) */}
                        {amountChanged && isEdit && (
                            <div className="space-y-3 border-l-2 border-primary pl-4">
                                <div className="space-y-2">
                                    <Label htmlFor="changeReason">Change Reason</Label>
                                    <Controller
                                        name="changeReason"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value || ""}
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    trigger("changeReason");
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a reason" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="order">Order</SelectItem>
                                                    <SelectItem value="check_in">Check-in</SelectItem>
                                                    <SelectItem value="check_out">Check-out</SelectItem>
                                                    <SelectItem value="adjustment">Adjustment</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.changeReason && <p className="mt-1 text-xs text-red-500">{errors.changeReason.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="note">Catatan</Label>
                                    <Controller
                                        name="note"
                                        control={control}
                                        render={({ field }) => <Textarea {...field} placeholder="Catatan" rows={3} />}
                                    />
                                    {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* Note - only show when showNote is true AND amount hasn't changed */}
                        {showNote && !amountChanged && (
                            <>
                                <FormSection title="Change Reason">
                                    <Controller
                                        name="changeReason"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value || ""} onValueChange={field.onChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a reason" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="order">Order</SelectItem>
                                                    <SelectItem value="check_in">Check-in</SelectItem>
                                                    <SelectItem value="check_out">Check-out</SelectItem>
                                                    <SelectItem value="adjustment">Adjustment</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.changeReason && <p className="mt-1 text-xs text-red-500">{errors.changeReason.message}</p>}
                                </FormSection>
                                <FormSection title="Catatan">
                                    <Controller
                                        name="note"
                                        control={control}
                                        render={({ field }) => <Textarea {...field} placeholder="Catatan" rows={4} />}
                                    />
                                    {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note.message}</p>}
                                </FormSection>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

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