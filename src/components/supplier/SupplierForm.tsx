import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const supplierSchema = z.object({
    name: z.string().min(1, "Nama harus diisi"),
    phone: z.string().min(1, "Nomor telepon harus diisi"),
    address: z.string().min(1, "Alamat harus diisi"),
});

export type SupplierFormType = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
    defaultValues?: Partial<SupplierFormType>;
    onSubmit: (data: SupplierFormType) => void;
    onCancel: () => void;
    submitLabel?: string;
    isSubmitting?: boolean;
}

export function SupplierForm({ defaultValues, onSubmit, onCancel, submitLabel = "Simpan", isSubmitting = false }: SupplierFormProps) {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<SupplierFormType>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: "",
            phone: "",
            address: "",
            ...defaultValues,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-fit">
            <div className="space-y-1">
                <Label htmlFor="name">Nama</Label>
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Masukkan nama supplier" />}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
                <Label htmlFor="phone">No HP</Label>
                <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Masukkan nomor telepon" />}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
                <Label htmlFor="address">Alamat</Label>
                <Controller
                    name="address"
                    control={control}
                    render={({ field }) => <Textarea {...field} placeholder="Masukkan alamat" />}
                />
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
            </div>

            <div className="flex gap-2">
                <Button type="button" onClick={onCancel} variant="destructive" className="transition-all hover:bg-red-600 active:scale-95">
                    Batalkan
                </Button>
                <Button type="submit" disabled={isSubmitting} variant="default" className="transition-all hover:bg-gray-900 active:scale-95">
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
} 