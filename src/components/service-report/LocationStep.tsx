import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { ChipSelect } from "@/components/ui/chip-select"
import { LOCATION_OPTIONS } from "@/constants/form-wizard"
import type { ReportData } from "@/validations/form-wizard"

export function LocationsStep() {
    const { control, setValue, watch } = useFormContext<ReportData>()
    const selectedLocations = watch("locationServices") || []

    // Transform selected locations to the format expected by the form
    const handleLocationChange = (selected: string[]) => {
        const locationServices = selected.map((location) => ({
            location,
            pests: [],
            actions: [],
            equipments: [],
            recommendation: "",
            photos: [],
        }))

        setValue("locationServices", locationServices, { shouldValidate: true })

        // Add this after setting the value
        console.log("Selected locations:", selected)
        console.log("Location services:", locationServices)
    }

    // Extract location names for the chip select
    const selectedLocationValues = selectedLocations.map((loc: { location: string }) => loc.location)

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="locationServices"
                render={() => (
                    <FormItem>
                        <FormLabel className="text-lg font-medium mb-4 block text-black">Pilih Lokasi</FormLabel>
                        <FormControl>
                            <ChipSelect
                                options={LOCATION_OPTIONS}
                                value={selectedLocationValues}
                                onChange={handleLocationChange}
                                className="min-h-[200px]"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}
