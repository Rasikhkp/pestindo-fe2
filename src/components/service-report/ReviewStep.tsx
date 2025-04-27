import { useFormContext } from "react-hook-form"
import { PEST_OPTIONS, ACTION_OPTIONS, EQUIPMENT_OPTIONS, BILL_CHEMICAL_OPTIONS } from "@/constants/form-wizard"
import type { ReportData } from "@/validations/form-wizard"
import { Badge } from "../ui/badge"
import { convertSnakeToTitleCase } from "@/lib/utils"
import { useEffect, useState } from "react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"


export function ReviewStep() {
    const { watch } = useFormContext<ReportData>()
    const [picSignatureUrl, setPicSignatureUrl] = useState<string | null>(null)
    const [techSignatureUrl, setTechSignatureUrl] = useState<string | null>(null)

    const data = watch()
    const serviceReportType = data.serviceReportType
    const locationServices = data.locationServices || []
    const photos = data.photos || []
    const chemicals = data.chemicals || []
    const billChemicals = data.billChemicals || []
    const picSignature = data.picSignature
    const technicianSignature = data.technicianSignature

    // Helper function to get label from value
    const getLabelFromValue = (options: { value: string; label: string }[], value: string) => {
        const option = options.find((opt) => opt.value === value)
        return option ? option.label : value
    }

    // Convert File objects to URLs for display
    useEffect(() => {
        if (picSignature instanceof File) {
            const url = URL.createObjectURL(picSignature)
            setPicSignatureUrl(url)
            return () => URL.revokeObjectURL(url)
        }
    }, [picSignature])

    useEffect(() => {
        if (technicianSignature instanceof File) {
            const url = URL.createObjectURL(technicianSignature)
            setTechSignatureUrl(url)
            return () => URL.revokeObjectURL(url)
        }
    }, [technicianSignature])

    return (
        <div className="space-y-6">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-2">Tipe Service Report</h3>
                    <Badge className="text-sm" variant="outline">{serviceReportType}</Badge>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-2">Informasi Dasar</h3>
                    <div className="grid grid-cols-2 gap-2">
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
                            <p className="text-sm font-medium">Tipe Pekerjaan</p>
                            <p className="text-sm text-muted-foreground">{data.serviceType}</p>
                        </div>
                        {serviceReportType !== "Extra" && (
                            <div>
                                <p className="text-sm font-medium">Total Biaya</p>
                                <p className="text-sm text-muted-foreground">Rp {data.totalAmount.toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium">Lokasi</h3>
                    <div>
                        {locationServices.map((location, index) => (
                            <Accordion type="single" collapsible key={index}>
                                <AccordionItem value={`location-${index}`}>
                                    <AccordionTrigger>{convertSnakeToTitleCase(location.location)}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-medium">Hama Ditemukan</p>
                                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                    {location.pests?.map((pest, i) => (
                                                        <li key={i}>
                                                            {getLabelFromValue(PEST_OPTIONS, pest.code)} - {pest.count} ditemukan
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium">Tindakan Dilakukan</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {location.actions?.map((action, i) => (
                                                        <span key={i} className="text-xs bg-muted px-2 py-1 rounded-md">
                                                            {getLabelFromValue(ACTION_OPTIONS, action)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium">Peralatan Digunakan</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
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
                                                    <p className="text-sm text-muted-foreground">{location.recommendation}</p>
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

                {photos.length > 0 && (
                    <div>
                        <h3 className="text-lg font-medium mb-2">Foto</h3>
                        <div className=" columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
                            {photos.map((photo, index) => (
                                <div key={index} className="break-inside-avoid relative w-full mb-4 overflow-hidden rounded-lg border">
                                    <img src={photo.url || "/placeholder.svg"} alt={photo.alt} className="w-full h-auto object-contain" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-medium mb-2">Chemical</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium">Chemical Aktual</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {chemicals.map((chemical, index) => (
                                    <li key={index}>
                                        {chemical.name} - {chemical.dosage} {chemical.unit}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="text-sm font-medium">Chemical Ditagih</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {billChemicals.map((chemical, index) => (
                                    <span key={index} className="text-xs bg-muted px-2 py-1 rounded-md">
                                        {getLabelFromValue(BILL_CHEMICAL_OPTIONS, chemical)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-2">Tanda Tangan</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <p className="text-sm font-medium">PIC Customer: {data.picCustomer}</p>
                        {picSignatureUrl && (
                            <div className="border rounded-md overflow-hidden bg-white">
                                <img
                                    src={picSignatureUrl}
                                    alt="Tanda tangan PIC Customer"
                                    className="w-full h-32 object-contain"
                                />
                            </div>
                        )}

                        <p className="text-sm font-medium">Teknisi: {data.technician}</p>
                        {techSignatureUrl && (
                            <div className="border rounded-md overflow-hidden bg-white">
                                <img
                                    src={techSignatureUrl}
                                    alt="Tanda tangan Teknisi"
                                    className="w-full h-32 object-contain"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
