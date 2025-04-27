import { useFormContext } from "react-hook-form"
import { SignatureCanvasCustom } from "@/components/ui/signature-canvas-custom"
import { Label } from "@/components/ui/label"
import { type ReportData } from "@/validations/form-wizard"
import { useState } from "react"

export function SignatureStep() {
    const { setValue, watch } = useFormContext<ReportData>()
    const picCustomer = watch("picCustomer")
    const technician = watch("technician")
    const picSignature = watch("picSignature")
    const technicianSignature = watch("technicianSignature")

    // State to hold signature preview URLs
    const [picSignaturePreview, setPicSignaturePreview] = useState<string | null>(null)
    const [techSignaturePreview, setTechSignaturePreview] = useState<string | null>(null)

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="text-base font-medium">PIC Customer</div>

                <div className="space-y-4">
                    <div>
                        <Label>Nama: {picCustomer}</Label>
                    </div>
                    <SignatureCanvasCustom
                        label="Tanda Tangan PIC Customer"
                        onSignatureChange={(file, dataUrl) => {
                            // Store the File object in the form
                            setValue("picSignature", file, { shouldValidate: true })
                            // Store the data URL for preview purposes
                            setPicSignaturePreview(dataUrl || null)
                        }}
                    />
                    {picSignature && (
                        <div className="mt-2">
                            <Label className="text-xs text-green-600">
                                ✓ Tanda tangan berhasil disimpan
                            </Label>
                            {picSignaturePreview && (
                                <div className="mt-2 border rounded-md overflow-hidden bg-white p-2">
                                    <p className="text-xs mb-1">Preview:</p>
                                    <img
                                        src={picSignaturePreview}
                                        alt="Preview tanda tangan PIC"
                                        className="max-h-24 object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-base font-medium">Teknisi</div>

                <div className="space-y-4">
                    <div>
                        <Label>Nama: {technician}</Label>
                    </div>
                    <SignatureCanvasCustom
                        label="Tanda Tangan Teknisi"
                        onSignatureChange={(file, dataUrl) => {
                            // Store the File object in the form
                            setValue("technicianSignature", file, { shouldValidate: true })
                            // Store the data URL for preview purposes
                            setTechSignaturePreview(dataUrl || null)
                        }}
                    />
                    {technicianSignature && (
                        <div className="mt-2">
                            <Label className="text-xs text-green-600">
                                ✓ Tanda tangan berhasil disimpan
                            </Label>
                            {techSignaturePreview && (
                                <div className="mt-2 border rounded-md overflow-hidden bg-white p-2">
                                    <p className="text-xs mb-1">Preview:</p>
                                    <img
                                        src={techSignaturePreview}
                                        alt="Preview tanda tangan Teknisi"
                                        className="max-h-24 object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 