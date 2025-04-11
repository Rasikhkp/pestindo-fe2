import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, Radio } from "@heroui/radio";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, X, Upload } from "lucide-react";
import { useState, DragEvent, useEffect, useRef } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const IMAGE_BASE_URL = import.meta.env.VITE_API_URL + "/storage/";
const PLACEHOLDER_IMAGE = "https://placehold.co/300x200";

export const itemSchema = z.object({
    name: z.string().min(1, "Nama item wajib diisi"),
    price: z.coerce.number().min(1, "Harga item wajib diisi"),
    amount: z.coerce.number().min(0, "Jumlah item tidak boleh negatif"),
    type: z.enum(["chemical", "equipment", "asset"]),
    unit: z.string().min(1, "Satuan wajib diisi"),
    image: z.string().optional(),
    imageFile: z
        .instanceof(File)
        .optional()
        .refine(file => file === undefined || file.size <= MAX_FILE_SIZE, `Ukuran gambar maksimal 5MB.`)
        .refine(
            file => file === undefined || ACCEPTED_IMAGE_TYPES.includes(file.type),
            "Format yang didukung: .jpg, .jpeg, .png, dan .webp."
        ),
    note: z.string().optional(),
    changeReason: z.string().optional(),
});

export type ItemForm = z.infer<typeof itemSchema>;

interface ItemFormProps {
    defaultValues?: Partial<ItemForm>;
    onSubmit: (data: ItemForm) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    showNote?: boolean;
    isEdit?: boolean;
}

export function ItemForm({ defaultValues, onSubmit, onCancel, isSubmitting, showNote = false, isEdit = false }: ItemFormProps) {
    // Keep track of whether the image is from a local file upload (blob URL) or a server path
    const [isLocalImage, setIsLocalImage] = useState<boolean>(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [initialAmount, setInitialAmount] = useState<number>(defaultValues?.amount || 0);
    const [amountChanged, setAmountChanged] = useState<boolean>(false);

    const formSchema = useRef(
        z.object({
            name: z.string().min(1, "Nama item wajib diisi"),
            price: z.coerce.number().min(1, "Harga item wajib diisi"),
            amount: z.coerce.number().min(0, "Jumlah item tidak boleh negatif"),
            type: z.enum(["chemical", "equipment", "asset"]),
            unit: z.string().min(1, "Satuan wajib diisi"),
            image: z.string().optional(),
            imageFile: z
                .instanceof(File)
                .optional()
                .refine(file => file === undefined || file.size <= MAX_FILE_SIZE, `Ukuran gambar maksimal 5MB.`)
                .refine(
                    file => file === undefined || ACCEPTED_IMAGE_TYPES.includes(file.type),
                    "Format yang didukung: .jpg, .jpeg, .png, dan .webp."
                ),
            note: z.string().optional(),
            changeReason: z.string().optional(),
        })
    );

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        trigger,
        formState: { errors },
    } = useForm<ItemForm>({
        resolver: zodResolver(formSchema.current),
        defaultValues: defaultValues || {
            name: "",
            price: 0,
            amount: 0,
            type: "chemical",
            unit: "",
            image: "",
            note: "",
            changeReason: "",
        },
    });

    const amount = watch("amount");
    const imageUrl = watch("image");
    const imageFile = watch("imageFile");

    // Update schema when amount changes
    useEffect(() => {
        const amountHasChanged = amount !== initialAmount;
        setAmountChanged(amountHasChanged);

        // Dynamically change schema validation based on amount change
        if (amountHasChanged && isEdit) {
            formSchema.current = z.object({
                name: z.string().min(1, "Nama item wajib diisi"),
                price: z.coerce.number().min(1, "Harga item wajib diisi"),
                amount: z.coerce.number().min(0, "Jumlah item tidak boleh negatif"),
                type: z.enum(["chemical", "equipment", "asset"]),
                unit: z.string().min(1, "Satuan wajib diisi"),
                image: z.string().optional(),
                imageFile: z
                    .instanceof(File)
                    .optional()
                    .refine(file => file === undefined || file.size <= MAX_FILE_SIZE, `Ukuran gambar maksimal 5MB.`)
                    .refine(
                        file => file === undefined || ACCEPTED_IMAGE_TYPES.includes(file.type),
                        "Format yang didukung: .jpg, .jpeg, .png, dan .webp."
                    ),
                note: z.string().min(1, "Catatan wajib diisi saat jumlah item berubah"),
                changeReason: z.string().min(1, "Alasan perubahan wajib diisi saat jumlah item berubah"),
            });
        } else {
            formSchema.current = z.object({
                name: z.string().min(1, "Nama item wajib diisi"),
                price: z.coerce.number().min(1, "Harga item wajib diisi"),
                amount: z.coerce.number().min(0, "Jumlah item tidak boleh negatif"),
                type: z.enum(["chemical", "equipment", "asset"]),
                unit: z.string().min(1, "Satuan wajib diisi"),
                image: z.string().optional(),
                imageFile: z
                    .instanceof(File)
                    .optional()
                    .refine(file => file === undefined || file.size <= MAX_FILE_SIZE, `Ukuran gambar maksimal 5MB.`)
                    .refine(
                        file => file === undefined || ACCEPTED_IMAGE_TYPES.includes(file.type),
                        "Format yang didukung: .jpg, .jpeg, .png, dan .webp."
                    ),
                note: z.string().optional(),
                changeReason: z.string().optional(),
            });
        }

        // Re-trigger validation when amount changes
        trigger();
    }, [amount, initialAmount, trigger]);

    // Initialize preview if default image URL exists
    useEffect(() => {
        if (imageUrl && !imagePreview) {
            setImagePreview(imageUrl);
            setIsLocalImage(false);
        }

        // Set initial amount to track changes
        if (defaultValues?.amount !== undefined) {
            setInitialAmount(defaultValues.amount);
        }
    }, []);

    // Clean up preview URL when component unmounts
    useEffect(() => {
        return () => {
            if (imagePreview && isLocalImage) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview, isLocalImage]);

    const handleIncrement = () => {
        setValue("amount", amount + 1);
    };

    const handleDecrement = () => {
        if (amount > 0) {
            setValue("amount", amount - 1);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                setValue("imageFile", file, { shouldValidate: true });

                // Revoke previous blob URL to avoid memory leaks
                if (imagePreview && isLocalImage) {
                    URL.revokeObjectURL(imagePreview);
                }

                const previewUrl = URL.createObjectURL(file);
                setImagePreview(previewUrl);
                setIsLocalImage(true); // Mark as local image (blob URL)
                setValue("image", ""); // Clear the URL field as we're using a file
            }
        }
        e.target.value = '';
    };

    const removeUploadedFile = () => {
        // If it's a local image (blob URL), revoke it
        if (isLocalImage && imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setValue("imageFile", undefined, { shouldValidate: true });
        setValue("image", "", { shouldValidate: true });
        setImagePreview(null);
    };

    // Drag and drop handlers
    const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                setValue("imageFile", file, { shouldValidate: true });

                // Revoke previous blob URL to avoid memory leaks
                if (imagePreview && isLocalImage) {
                    URL.revokeObjectURL(imagePreview);
                }

                const previewUrl = URL.createObjectURL(file);
                setImagePreview(previewUrl);
                setIsLocalImage(true); // Mark as local image (blob URL)
                setValue("image", ""); // Clear the URL field as we're using a file
            }
            e.dataTransfer.clearData();
        }
    };

    // Helper to get the correct image URL for preview
    const getImagePreviewUrl = () => {
        if (!imagePreview) return PLACEHOLDER_IMAGE;

        // If it's a local file (blob URL), use it directly
        if (isLocalImage) {
            return imagePreview;
        }

        // If it's a server path, prepend the base URL
        return imagePreview.startsWith('http') ? imagePreview : `${IMAGE_BASE_URL}${imagePreview}`;
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
            {/* Tipe Item */}
            <div className="space-y-2">
                <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup size="sm" label="Tipe Item" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                            <Radio value="chemical">Chemical</Radio>
                            <Radio value="equipment">Equipment</Radio>
                            <Radio value="asset">Asset</Radio>
                        </RadioGroup>
                    )}
                />
            </div>

            {/* Nama Item */}
            <div className="space-y-2">
                <Label htmlFor="name">Nama Item</Label>
                <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Nama Item" />} />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Harga */}
            <div className="space-y-2">
                <Label htmlFor="price">Harga</Label>
                <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            type="number"
                            placeholder="Harga"
                            className="max-w-xs"
                        />
                    )}
                />
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
            </div>

            {/* Jumlah & Satuan */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="amount">Jumlah</Label>
                    <div className="flex items-center max-w-xs">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleDecrement}
                            className="rounded-r-none"
                        >
                            <Minus className="w-4 h-4" />
                        </Button>
                        <Controller
                            name="amount"
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
                            onClick={handleIncrement}
                            className="rounded-l-none"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}

                    {/* Show change reason and note when amount changes (only in edit mode) */}
                    {amountChanged && isEdit && (
                        <div className="mt-4 space-y-3 border-l-2 border-primary pl-4">
                            <div className="space-y-2">
                                <Label htmlFor="changeReason">Change Reason</Label>
                                <Controller name="changeReason" control={control} render={({ field }) => (
                                    <Select
                                        {...field}
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
                                )} />
                                {errors.changeReason && <p className="mt-1 text-xs text-red-500">{errors.changeReason.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="note">Catatan</Label>
                                <Controller name="note" control={control} render={({ field }) => <Textarea {...field} placeholder="Catatan" rows={3} />} />
                                {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note.message}</p>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unit">Satuan</Label>
                    <Controller name="unit" control={control} render={({ field }) => <Input {...field} placeholder="Satuan (pcs, kg, box, dll)" />} />
                    {errors.unit && <p className="mt-1 text-xs text-red-500">{errors.unit.message}</p>}
                </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
                <Label htmlFor="image">Gambar Item</Label>

                {/* Display image preview if exists */}
                {imagePreview && (
                    <div className="relative mb-4">
                        <div className="relative w-full max-w-md h-56 overflow-hidden rounded-lg border dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <img
                                src={getImagePreviewUrl()}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 bg-black/70 hover:bg-black/90 text-white rounded-full"
                                onClick={removeUploadedFile}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* File Upload Dropzone - only show if no preview */}
                {!imagePreview && (
                    <Controller
                        name="imageFile"
                        control={control}
                        render={({ fieldState }) => (
                            <>
                                <label
                                    htmlFor="file-upload"
                                    className={`p-8 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDraggingOver ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'} ${fieldState.error ? 'border-red-500' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                                        <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Drag & drop gambar atau klik untuk browse</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Format: JPG, JPEG, PNG, WEBP (maks. 5MB)
                                        </span>
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                                {fieldState.error && (
                                    <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                                )}
                            </>
                        )}
                    />
                )}
            </div>

            {/* Note - only show when showNote is true AND amount hasn't changed */}
            {showNote && !amountChanged && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="changeReason">Change Reason</Label>
                        <Controller name="changeReason" control={control} render={({ field }) => (
                            <Select {...field}>
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
                        )} />
                        {errors.changeReason && <p className="mt-1 text-xs text-red-500">{errors.changeReason.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="note">Catatan</Label>
                        <Controller name="note" control={control} render={({ field }) => <Textarea {...field} placeholder="Catatan" rows={4} />} />
                        {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note.message}</p>}
                    </div>
                </>
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