import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import type { ReportData } from "@/validations/form-wizard"

export function BasicInfoStep() {
    const { control, watch } = useFormContext<ReportData>()
    const serviceReportType = watch("serviceReportType")

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name="reportDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Report Date</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="customerName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Customer Name</FormLabel>
                            <FormControl>
                                <Input placeholder="PT Contoh Sejahtera" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="picCustomer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>PIC Customer</FormLabel>
                            <FormControl>
                                <Input placeholder="Budi Santoso" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="technician"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Technician</FormLabel>
                            <FormControl>
                                <Input placeholder="Rudi Hartono" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="jobType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Job Type</FormLabel>
                            <FormControl>
                                <Input placeholder="Pest Control" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="serviceType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Service Type</FormLabel>
                            <FormControl>
                                <Input placeholder="Project" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {serviceReportType === "Initial" && (
                    <FormField
                        control={control}
                        name="totalAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total Amount (Rp)</FormLabel>
                                <FormControl>
                                    <NumberInput
                                        value={field.value}
                                        onChange={(value) => field.onChange(value)}
                                        min={0}
                                        step={10000}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {serviceReportType === "Regular" && (
                    <FormField
                        control={control}
                        name="totalAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total Amount (Rp)</FormLabel>
                                <FormControl>
                                    <Input type="text" value={`Rp ${field.value.toLocaleString()}`} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        </div>
    )
}
