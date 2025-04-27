import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { SERVICE_REPORT_TYPES } from "@/constants/form-wizard"
import { ClipboardCheck, Repeat, Zap } from "lucide-react"
import type { ReportData } from "@/validations/form-wizard"
import { SelectableCard } from "@/components/ui/selectable-card"

export function ServiceTypeStep() {
    const { control, setValue, watch } = useFormContext<ReportData>()
    const serviceReportType = watch("serviceReportType")

    const getIcon = (type: string) => {
        switch (type) {
            case "Initial":
                return <ClipboardCheck className="h-6 w-6" />
            case "Regular":
                return <Repeat className="h-6 w-6" />
            case "Extra":
                return <Zap className="h-6 w-6" />
            default:
                return null
        }
    }

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="serviceReportType"
                render={() => (
                    <FormItem>
                        <FormLabel className="text-lg font-medium mb-4 block">Tipe Service Report</FormLabel>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {SERVICE_REPORT_TYPES.map((type) => (
                                <SelectableCard
                                    key={type.value}
                                    value={type.value}
                                    label={type.label}
                                    description={type.description}
                                    selected={serviceReportType === type.value}
                                    icon={getIcon(type.value)}
                                    onClick={() => setValue("serviceReportType", type.value)}
                                />
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />

        </div>
    )
}
