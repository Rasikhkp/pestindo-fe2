import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { PEST_OPTIONS, ACTION_OPTIONS, EQUIPMENT_OPTIONS, BILL_CHEMICAL_OPTIONS } from "@/constants/form-wizard"
import { Badge } from "@/components/ui/badge"
import { convertSnakeToTitleCase } from "@/lib/utils"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export const Route = createFileRoute(
    '/_layout/technician_/service-report_/$service_report_id',
)({
    component: RouteComponent,
})

// Mock data for the service report
const mockServiceReport = {
    id: "123456",
    serviceReportType: "Regular",
    reportDate: "2023-12-15",
    customerName: "PT. ABC Industries",
    picCustomer: "John Doe",
    technician: "Jane Smith",
    jobType: "Service",
    serviceType: "Monthly",
    totalAmount: 1500000,
    locationServices: [
        {
            location: "office_area",
            pests: [
                { code: "rat", count: 3 },
                { code: "cockroach", count: 12 }
            ],
            actions: ["spraying", "baiting", "trapping"],
            equipments: ["sprayer", "fogger"],
            recommendation: "Seal entry points near storage area to prevent rodent access",
            photos: [
                { url: "https://placehold.co/300x200?text=Office+Area+1", alt: "Office area inspection" },
                { url: "https://placehold.co/300x200?text=Office+Area+2", alt: "Office area treatment" }
            ]
        },
        {
            location: "kitchen",
            pests: [
                { code: "cockroach", count: 8 },
                { code: "ant", count: 20 }
            ],
            actions: ["spraying", "gel_application"],
            equipments: ["sprayer", "gel_applicator"],
            recommendation: "Improve sanitation practices in food preparation areas",
            photos: [
                { url: "https://placehold.co/300x200?text=Kitchen+1", alt: "Kitchen inspection" },
                { url: "https://placehold.co/300x200?text=Kitchen+2", alt: "Kitchen treatment" }
            ]
        }
    ],
    photos: [
        { url: "https://placehold.co/300x200?text=General+1", alt: "General inspection" },
        { url: "https://placehold.co/300x200?text=General+2", alt: "Building exterior" },
        { url: "https://placehold.co/300x200?text=General+3", alt: "Treatment application" },
        { url: "https://placehold.co/300x200?text=General+4", alt: "Final assessment" }
    ],
    chemicals: [
        { name: "Cypermethrin", dosage: 250, unit: "ml" },
        { name: "Fipronil", dosage: 100, unit: "g" }
    ],
    billChemicals: ["cypermethrin", "fipronil", "deltamethrin"],
    picSignature: "https://placehold.co/400x100?text=PIC+Signature",
    technicianSignature: "https://placehold.co/400x100?text=Technician+Signature"
}

function RouteComponent() {
    const router = useRouter()
    const data = mockServiceReport

    // Helper function to get label from value
    const getLabelFromValue = (options: { value: string; label: string }[], value: string) => {
        const option = options.find((opt) => opt.value === value)
        return option ? option.label : value
    }

    return (
        <>
            <button
                onClick={() => router.history.back()}
                className="flex items-center gap-3 mb-8 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft size={16} className="transition-all group-hover:-translate-x-1" /> Kembali
            </button>

            <div className="my-2 text-xl font-medium dark:text-gray-300">Laporan Service #{data.id}</div>
            <div className="mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">Detail Laporan Service</div>

            <div className="space-y-6">
                <div className="space-y-6">
                    {/* <div className="text-sm text-gray-600 dark:text-gray-200">
                        <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
                            <div className="p-4 text-lg font-semibold">Tipe Service Report</div>
                            <div className="border-b border-gray-200 dark:border-gray-600"></div>
                            <div className="p-4">
                                <Badge className="text-sm" variant="outline">{data.serviceReportType}</Badge>
                            </div>
                        </div>
                    </div> */}

                    <div className="text-sm text-gray-600 dark:text-gray-200">
                        <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
                            <div className="p-4 text-lg font-semibold">Informasi Dasar</div>
                            <div className="border-b border-gray-200 dark:border-gray-600"></div>
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Tipe Service Report</p>
                                        <p className="text-sm text-muted-foreground">{data.serviceReportType}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Tanggal Laporan</p>
                                        <p className="text-sm text-muted-foreground">{data.reportDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Nama Customer</p>
                                        <p className="text-sm text-muted-foreground">{data.customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">PIC Customer</p>
                                        <p className="text-sm text-muted-foreground">{data.picCustomer}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Teknisi</p>
                                        <p className="text-sm text-muted-foreground">{data.technician}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Tipe Pekerjaan</p>
                                        <p className="text-sm text-muted-foreground">{data.jobType}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Tipe Service</p>
                                        <p className="text-sm text-muted-foreground">{data.serviceType}</p>
                                    </div>
                                    {data.serviceReportType !== "Extra" && (
                                        <div>
                                            <p className="text-sm font-medium">Total Biaya</p>
                                            <p className="text-sm text-muted-foreground">Rp {data.totalAmount.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-200">
                        <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
                            <div className="p-4 text-lg font-semibold">Lokasi</div>
                            <div className="border-b border-gray-200 dark:border-gray-600"></div>
                            <div className="p-4">
                                {data.locationServices.map((location, index) => (
                                    <Accordion type="single" collapsible key={index} className="mb-4">
                                        <AccordionItem value={`location-${index}`}>
                                            <AccordionTrigger>{convertSnakeToTitleCase(location.location)}</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-sm font-medium">Hama Ditemukan</p>
                                                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                                                            {location.pests?.map((pest, i) => (
                                                                <li key={i}>
                                                                    {getLabelFromValue(PEST_OPTIONS, pest.code)} - {pest.count} ditemukan
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-medium">Tindakan Dilakukan</p>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {location.actions?.map((action, i) => (
                                                                <span key={i} className="text-xs bg-muted px-2 py-1 rounded-md">
                                                                    {getLabelFromValue(ACTION_OPTIONS, action)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-medium">Peralatan Digunakan</p>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {location.equipments?.map((equipment, i) => (
                                                                <span key={i} className="text-xs bg-muted px-2 py-1 rounded-md">
                                                                    {getLabelFromValue(EQUIPMENT_OPTIONS, equipment)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {location.recommendation && (
                                                        <div>
                                                            <p className="text-sm font-medium">Rekomendasi</p>
                                                            <p className="text-sm text-muted-foreground mt-2">{location.recommendation}</p>
                                                        </div>
                                                    )}

                                                    {location.photos && location.photos.length > 0 && (
                                                        <div>
                                                            <p className="text-sm font-medium">Foto</p>
                                                            <div className="columns-2 sm:columns-3 gap-2 space-y-2 mt-2">
                                                                {location.photos.map((photo, i) => (
                                                                    <div key={i} className="break-inside-avoid relative mb-2 overflow-hidden rounded-lg border">
                                                                        <img
                                                                            src={photo.url || "/placeholder.svg"}
                                                                            alt={photo.alt}
                                                                            className="w-full h-auto object-contain"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* {data.photos.length > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-200">
                            <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
                                <div className="p-4 text-lg font-semibold">Foto</div>
                                <div className="border-b border-gray-200 dark:border-gray-600"></div>
                                <div className="p-4">
                                    <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
                                        {data.photos.map((photo, index) => (
                                            <div key={index} className="break-inside-avoid relative w-full mb-4 overflow-hidden rounded-lg border">
                                                <img src={photo.url || "/placeholder.svg"} alt={photo.alt} className="w-full h-auto object-contain" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )} */}

                    <div className="text-sm text-gray-600 dark:text-gray-200">
                        <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
                            <div className="p-4 text-lg font-semibold">Chemical</div>
                            <div className="border-b border-gray-200 dark:border-gray-600"></div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium">Chemical Aktual</p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                                            {data.chemicals.map((chemical, index) => (
                                                <li key={index}>
                                                    {chemical.name} - {chemical.dosage} {chemical.unit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium">Chemical Ditagih</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {data.billChemicals.map((chemical, index) => (
                                                <span key={index} className="text-xs bg-muted px-2 py-1 rounded-md">
                                                    {getLabelFromValue(BILL_CHEMICAL_OPTIONS, chemical)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-200">
                        <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
                            <div className="p-4 text-lg font-semibold">Tanda Tangan</div>
                            <div className="border-b border-gray-200 dark:border-gray-600"></div>
                            <div className="p-4">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm font-medium mb-2">PIC Customer: {data.picCustomer}</p>
                                        <div className="border rounded-md overflow-hidden bg-white">
                                            <img
                                                src={data.picSignature}
                                                alt="Tanda tangan PIC Customer"
                                                className="w-full h-32 object-contain"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium mb-2">Teknisi: {data.technician}</p>
                                        <div className="border rounded-md overflow-hidden bg-white">
                                            <img
                                                src={data.technicianSignature}
                                                alt="Tanda tangan Teknisi"
                                                className="w-full h-32 object-contain"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default RouteComponent
