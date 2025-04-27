"use client"

import { useState } from "react"
import { ServiceTypeStep } from "./ServiceTypeStep"
import { BasicInfoStep } from "./BasicInfoStep"
import { LocationsStep } from "./LocationStep"
import { LocationDetailsStep } from "./LocationDetailStep"
import { ChemicalsStep } from "./ChemicalStep"
import { SignatureStep } from "./SignatureStep"
import { ReviewStep } from "./ReviewStep"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Save } from "lucide-react"
import { toast } from "sonner"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { reportSchema, type ReportData } from "@/validations/form-wizard"

export function ReportWizard() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const steps = [
        { name: "Tipe Service Report", component: ServiceTypeStep },
        { name: "Informasi Dasar", component: BasicInfoStep },
        { name: "Lokasi", component: LocationsStep },
        { name: "Detail Lokasi", component: LocationDetailsStep },
        { name: "Chemical", component: ChemicalsStep },
        { name: "Tanda Tangan", component: SignatureStep },
        { name: "Review", component: ReviewStep },
    ]

    const methods = useForm<ReportData>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            serviceReportType: "",
            reportDate: new Date().toISOString().split("T")[0],
            customerName: "PT Contoh Sejahtera",
            picCustomer: "Budi Santoso",
            technician: "Rudi Hartono",
            jobType: "Pest Control",
            serviceType: "Project",
            totalAmount: 1000000,
            locationServices: [],
            photos: [],
            chemicals: [],
            billChemicals: [],
            picSignature: undefined,
            technicianSignature: undefined,
        },
        mode: "onChange",
    })

    const nextStep = async () => {
        const isLastStep = currentStep === steps.length - 1

        if (isLastStep) {
            try {
                setIsSubmitting(true)
                const formData = new FormData()
                const data = methods.getValues()

                // Add all non-file values to formData
                for (const [key, value] of Object.entries(data)) {
                    if (key === 'picSignature' || key === 'technicianSignature') {
                        // Skip file fields - we'll add them separately
                        continue
                    } else if (typeof value === 'object' && value !== null && !(value instanceof File)) {
                        // Handle arrays and complex objects by stringifying them
                        formData.append(key, JSON.stringify(value))
                    } else if (value !== null && value !== undefined) {
                        // Handle primitive values
                        formData.append(key, String(value))
                    }
                }

                // Add file objects
                if (data.picSignature instanceof File) {
                    formData.append('picSignature', data.picSignature)
                }

                if (data.technicianSignature instanceof File) {
                    formData.append('technicianSignature', data.technicianSignature)
                }

                // For demo purposes, log the FormData entries
                console.log("Form submitted. FormData contents:")
                for (const pair of formData.entries()) {
                    console.log(pair[0], pair[1])
                }

                // Here you would typically send the formData to your API
                // const response = await fetch('/api/reports', {
                //     method: 'POST',
                //     body: formData,
                // })

                toast.success("Report submitted successfully!", {
                    description: "Your report has been saved.",
                })
            } catch (error) {
                console.error("Error submitting form:", error)
                toast.error("Error submitting report", {
                    description: "Please try again later.",
                })
            } finally {
                setIsSubmitting(false)
            }
            return
        }

        // For location details step, validate all locations
        if (currentStep === 3) {
            const locationServices = methods.getValues("locationServices")
            if (!locationServices || locationServices.length === 0) {
                toast.error("Please add at least one location")
                return
            }

            // Validate all locations
            const result = await methods.trigger("locationServices")
            if (!result) {
                toast.error("Please complete all location details")
                return
            }
        } else if (currentStep === 2) {
            // For Locations step, just check if there are any locations
            const locationServices = methods.getValues("locationServices")
            if (!locationServices || locationServices.length === 0) {
                toast.error("Please select at least one location")
                return
            }
        } else if (currentStep === 5) {
            // For Signature step, validate both signatures
            const fieldsToValidate = ["picSignature", "technicianSignature"]
            const result = await methods.trigger(fieldsToValidate as any)
            if (!result) {
                toast.error("Tanda tangan PIC customer dan teknisi diperlukan")
                return
            }
        } else {
            // For other steps, validate the fields relevant to the current step
            let fieldsToValidate: string[] = []

            switch (currentStep) {
                case 0: // Service Report Type
                    fieldsToValidate = ["serviceReportType"]
                    break
                case 1: // Basic Info
                    fieldsToValidate = ["reportDate", "customerName", "picCustomer", "technician", "jobType", "serviceType"]
                    // Only validate totalAmount for Initial service type
                    if (methods.getValues("serviceReportType") === "Initial") {
                        fieldsToValidate.push("totalAmount")
                    }
                    break
                case 4: // Chemicals
                    fieldsToValidate = ["chemicals", "billChemicals"]
                    break
            }

            if (fieldsToValidate.length > 0) {
                const result = await methods.trigger(fieldsToValidate as any)
                if (!result) return
            }
        }

        setCurrentStep((prev) => prev + 1)
    }

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(0, prev - 1))
    }

    const CurrentStepComponent = steps[currentStep].component
    const progress = ((currentStep + 1) / steps.length) * 100

    // Check if the next button should be disabled
    const isNextDisabled = () => {
        const serviceReportType = methods.getValues("serviceReportType")
        const locationServices = methods.getValues("locationServices")
        const picSignature = methods.getValues("picSignature")
        const technicianSignature = methods.getValues("technicianSignature")

        switch (currentStep) {
            case 0: // Service Report Type
                return !serviceReportType
            case 2: // Locations
                return !locationServices || locationServices.length === 0
            case 3: // Location Details
                // Check if all locations have at least one pest, one action, and one equipment
                if (locationServices && locationServices.length > 0) {
                    return locationServices.some(location =>
                        !location.pests?.length ||
                        !location.actions?.length ||
                        !location.equipments?.length
                    )
                }
                return true
            case 4: // Chemicals
                const chemicals = methods.getValues("chemicals")
                const billChemicals = methods.getValues("billChemicals")
                return !chemicals || chemicals.length === 0 || !billChemicals || billChemicals.length === 0
            case 5: // Signatures
                return !picSignature || !technicianSignature
            default:
                return false
        }
    }

    return (
        <FormProvider {...methods}>
            <div className="bg-white rounded-lg border mb-4 overflow-hidden">
                <div className="p-4 bg-muted/30 border-b">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-medium">{steps[currentStep].name}</h2>
                        <span className="text-sm text-muted-foreground">
                            Step {currentStep + 1} / {steps.length}
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="p-4 md:p-6">
                    <CurrentStepComponent />
                </div>

                <div className="p-4 border-t bg-muted/20 flex justify-between">
                    <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="flex items-center gap-1">
                        <ChevronLeft className="h-4 w-4" /> Back
                    </Button>

                    <Button onClick={nextStep} disabled={isNextDisabled() || isSubmitting} className="flex items-center gap-1">
                        {currentStep === steps.length - 1 ? (
                            <>
                                {isSubmitting ? 'Submitting...' : 'Submit'} <Save className="h-4 w-4 ml-1" />
                            </>
                        ) : (
                            <>
                                Next <ChevronRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </FormProvider>
    )
}
