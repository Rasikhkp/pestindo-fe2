import { z } from "zod"

// Define the pest schema
const pestSchema = z.object({
    code: z.string().min(1, "Kode hama tidak boleh kosong"),
    count: z.number().min(0, "Jumlah hama tidak boleh kosong"),
})

// Define the chemical schema
const chemicalSchema = z.object({
    name: z.string().min(1, "Nama chemical tidak boleh kosong"),
    dosage: z.string().min(1, "Dosis tidak boleh kosong"),
    unit: z.string().optional(),
})

// Define the bill chemical schema
const billChemicalSchema = z.string().min(1, "Chemical ditagih tidak boleh kosong")

// Define the photo schema
const photoSchema = z.object({
    url: z.string().min(1, "URL foto tidak boleh kosong"),
    alt: z.string().optional().default(""),
})

// Define the location service schema
const locationServiceSchema = z.object({
    location: z.string().min(1, "Nama lokasi tidak boleh kosong"),
    pests: z.array(pestSchema).min(1, "Minimal satu hama harus ditambahkan"),
    actions: z.array(z.string()).min(1, "Minimal satu tindakan harus ditambahkan"),
    equipments: z.array(z.string()).min(1, "Minimal satu peralatan harus ditambahkan"),
    recommendation: z.string().optional().default(""),
    photos: z.array(photoSchema).optional().default([]),
})

// Define custom file validation
const fileSchema = z.any()
    .refine(value => value instanceof File || value === null, {
        message: "Harus berupa file",
    })
    .refine(value => !value || value instanceof File, {
        message: "Harus berupa file",
    })

// Define the report data schema
export const reportSchema = z.object({
    serviceReportType: z.string().min(1, "Tipe laporan tidak boleh kosong"),
    reportDate: z.string().min(1, "Tanggal laporan tidak boleh kosong"),
    customerName: z.string().min(1, "Nama customer tidak boleh kosong"),
    picCustomer: z.string().min(1, "PIC customer tidak boleh kosong"),
    technician: z.string().min(1, "Nama teknisi tidak boleh kosong"),
    jobType: z.string().min(1, "Tipe pekerjaan tidak boleh kosong"),
    serviceType: z.string().min(1, "Tipe layanan tidak boleh kosong"),
    totalAmount: z.number().min(0, "Total biaya harus positif"),
    locationServices: z.array(locationServiceSchema).min(1, "Minimal satu lokasi harus ditambahkan"),
    photos: z.array(photoSchema).optional().default([]),
    chemicals: z.array(chemicalSchema).min(1, "Minimal satu chemical harus ditambahkan"),
    billChemicals: z.array(billChemicalSchema).min(1, "Minimal satu chemical ditagih harus ditambahkan"),
    picSignature: fileSchema.refine(value => value instanceof File, {
        message: "Tanda tangan PIC customer diperlukan",
    }),
    technicianSignature: fileSchema.refine(value => value instanceof File, {
        message: "Tanda tangan teknisi diperlukan",
    }),
})

// Export the type
export type ReportData = z.infer<typeof reportSchema>
