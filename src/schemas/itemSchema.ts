import { z } from "zod";

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

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

// Function to create a schema with required note and changeReason
export const createItemSchemaWithRequiredNoteAndReason = () => {
    return z.object({
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
};

export type ItemForm = z.infer<typeof itemSchema>; 