import { useState, useEffect, useCallback } from "react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { ChipSelect } from "@/components/ui/chip-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Axe, Bug, ClipboardList, SprayCan, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PEST_OPTIONS, ACTION_OPTIONS, EQUIPMENT_OPTIONS } from "@/constants/form-wizard"
import type { ReportData } from "@/validations/form-wizard"
import { convertSnakeToTitleCase } from "@/lib/utils"
import { NumberInput } from "../ui/number-input"
import { motion } from "motion/react";
import { Dropzone } from "@/components/ui/dropzone"

export function LocationDetailsStep() {
    const { control, watch, setValue } = useFormContext<ReportData>()
    const [activeTabsMap, setActiveTabsMap] = useState<Record<number, string>>({})
    const [hasLocations, setHasLocations] = useState(false)
    const [fileCountMap, setFileCountMap] = useState<Record<number, number>>({})

    const locationServices = watch("locationServices")

    useEffect(() => {
        setHasLocations(locationServices && locationServices.length > 0)

        // Initialize active tabs for each location
        if (locationServices && locationServices.length > 0) {
            const initialTabs: Record<number, string> = {}
            locationServices.forEach((_, index) => {
                initialTabs[index] = initialTabs[index] || "pests"
            })
            setActiveTabsMap(prev => ({ ...prev, ...initialTabs }))
        }
    }, [locationServices])

    const initializePests = useCallback(() => {
        if (hasLocations && locationServices) {
            locationServices.forEach((location, index) => {
                if (!location.pests || location.pests.length === 0) {
                    setValue(`locationServices.${index}.pests`, [
                        { code: "", count: 0 },
                    ])
                }

                // Initialize photos array if it doesn't exist
                if (!location.photos) {
                    setValue(`locationServices.${index}.photos`, [])
                }
            })
        }
    }, [hasLocations, locationServices, setValue])

    useEffect(() => {
        initializePests()
    }, [initializePests])

    // If no locations, show a message
    if (!hasLocations) {
        return (
            <Card className="bg-muted/30">
                <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">
                        Belum ada lokasi yang ditambahkan. Silakan kembali ke langkah Lokasi dan pilih setidaknya satu lokasi.
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Handle active tab change for a specific location
    const handleTabChange = (locationIndex: number, tabValue: string) => {
        setActiveTabsMap(prev => ({
            ...prev,
            [locationIndex]: tabValue
        }))
    }

    // Handle pest selection
    const handlePestChange = (locationIndex: number, pestIndex: number, value: string) => {
        setValue(`locationServices.${locationIndex}.pests.${pestIndex}.code`, value, { shouldValidate: true })
    }

    // Handle pest count change
    const handlePestCountChange = (locationIndex: number, pestIndex: number, value: number) => {
        setValue(`locationServices.${locationIndex}.pests.${pestIndex}.count`, value, { shouldValidate: true })
    }

    // Add a new empty pest entry
    const addPest = (locationIndex: number) => {
        const currentPests = locationServices[locationIndex].pests || []
        setValue(`locationServices.${locationIndex}.pests`, [
            ...currentPests,
            { code: "", count: 0 }
        ], { shouldValidate: true })
    }

    // Remove a pest entry at the specified index
    const removePest = (locationIndex: number, pestIndex: number) => {
        const currentPests = [...(locationServices[locationIndex].pests || [])]
        currentPests.splice(pestIndex, 1)
        setValue(`locationServices.${locationIndex}.pests`, currentPests, { shouldValidate: true })
    }

    // Handle actions selection
    const handleActionsChange = (locationIndex: number, selected: string[]) => {
        setValue(`locationServices.${locationIndex}.actions`, selected, { shouldValidate: true })
    }

    // Handle equipment selection
    const handleEquipmentChange = (locationIndex: number, selected: string[]) => {
        setValue(`locationServices.${locationIndex}.equipments`, selected, { shouldValidate: true })
    }

    // Handle image upload for a specific location
    const handleImageDrop = (locationIndex: number, acceptedFiles: File[]) => {
        console.log('locationIndex', locationIndex)
        console.log('acceptedFiles', acceptedFiles)

        const currentPhotos = locationServices[locationIndex].photos || []
        const currentFileCount = fileCountMap[locationIndex] || 0

        const newPhotos = acceptedFiles.map((file, index) => {
            return {
                url: URL.createObjectURL(file),
                alt: `Photo Location ${locationIndex + 1} - ${currentFileCount + index + 1}`,
                file: file, // Store the file object for later upload
            }
        })

        setFileCountMap(prev => ({
            ...prev,
            [locationIndex]: currentFileCount + acceptedFiles.length
        }))

        setValue(`locationServices.${locationIndex}.photos`, [...currentPhotos, ...newPhotos], { shouldValidate: true })
    }

    // Handle removing an image
    const handleImageRemove = (locationIndex: number, photoIndex: number) => {
        const currentPhotos = [...(locationServices[locationIndex].photos || [])]

        // Revoke object URL to prevent memory leaks
        if (currentPhotos[photoIndex].url.startsWith("blob:")) {
            URL.revokeObjectURL(currentPhotos[photoIndex].url)
        }

        currentPhotos.splice(photoIndex, 1)
        setValue(`locationServices.${locationIndex}.photos`, currentPhotos, { shouldValidate: true })
    }

    return (
        <div className="">
            {locationServices.map((location, locationIndex) => (
                <div key={locationIndex} className="min-h-80 border-b last:border-b-0 first:pt-0 pt-3 pb-4">
                    <div className="mb-2">
                        <h3 className="text-lg font-medium">
                            {convertSnakeToTitleCase(location.location) || `Lokasi ${locationIndex + 1}`}
                        </h3>
                    </div>

                    <Tabs
                        value={activeTabsMap[locationIndex] || "pests"}
                        onValueChange={(value) => handleTabChange(locationIndex, value)}
                        className="w-full"
                    >
                        <TabsList className="grid grid-cols-4 mb-4">
                            <TabsTrigger value="pests"><Bug className="h-4 w-4" /><div className="sm:block hidden text-xs ml-2">Hama</div></TabsTrigger>
                            <TabsTrigger value="actions"><SprayCan className="h-4 w-4" /><div className="sm:block hidden text-xs ml-2">Tindakan</div></TabsTrigger>
                            <TabsTrigger value="equipment"><Axe className="h-4 w-4" /><div className="sm:block hidden text-xs ml-2">Alat</div></TabsTrigger>
                            <TabsTrigger value="recommendation"><ClipboardList className="h-4 w-4" /><div className="sm:block hidden text-xs ml-2">Rekomendasi</div></TabsTrigger>
                        </TabsList>

                        <TabsContent value="pests" className="mt-0 min-h-[400px]">
                            <div className="flex justify-between">
                                <div className="font-medium text-base">Hama ditemukan</div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addPest(locationIndex)}
                                >
                                    Tambah
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {location.pests?.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-4">
                                        Belum ada data hama. Klik tombol "+" untuk menambahkan.
                                    </div>
                                ) : (
                                    location.pests?.map((_pest, pestIndex) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            key={pestIndex}
                                            className="grid grid-cols-1 min-[420px]:grid-cols-[1fr_1fr] sm:grid-cols-3 gap-2 items-end"
                                        >
                                            <FormField
                                                control={control}
                                                name={`locationServices.${locationIndex}.pests.${pestIndex}.code`}
                                                render={({ field }) => (
                                                    <FormItem className="">
                                                        <FormLabel className="text-xs">Hama</FormLabel>
                                                        <Select value={field.value} onValueChange={(value) => handlePestChange(locationIndex, pestIndex, value)}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih hama" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {PEST_OPTIONS.map((option) => (
                                                                    <SelectItem key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={control}
                                                name={`locationServices.${locationIndex}.pests.${pestIndex}.count`}
                                                render={({ field }) => (
                                                    <FormItem className="">
                                                        <FormLabel className="text-xs">Jumlah</FormLabel>
                                                        <FormControl>
                                                            <NumberInput
                                                                value={field.value}
                                                                onChange={(value) => handlePestCountChange(locationIndex, pestIndex, value)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removePest(locationIndex, pestIndex)}
                                                className="h-9 w-9"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="actions" className="mt-0 min-h-[400px]">
                            <div className="text-base font-medium mb-4">Tindakan yang Dilakukan</div>

                            <FormField
                                control={control}
                                name={`locationServices.${locationIndex}.actions`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <ChipSelect
                                                options={ACTION_OPTIONS}
                                                value={field.value || []}
                                                onChange={(selected) => handleActionsChange(locationIndex, selected)}
                                                className=""
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </TabsContent>

                        <TabsContent value="equipment" className="mt-0 min-h-[400px]">
                            <div className="text-base font-medium mb-4">Alat yang Digunakan</div>

                            <FormField
                                control={control}
                                name={`locationServices.${locationIndex}.equipments`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <ChipSelect
                                                options={EQUIPMENT_OPTIONS}
                                                value={field.value || []}
                                                onChange={(selected) => handleEquipmentChange(locationIndex, selected)}
                                                className="min-h-[200px]"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </TabsContent>

                        <TabsContent value="recommendation" className="mt-0 min-h-[400px]">
                            <div className="text-base font-medium mb-4">Rekomendasi</div>
                            <div className="space-y-4">
                                <FormField
                                    control={control}
                                    name={`locationServices.${locationIndex}.recommendation`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Masukkan rekomendasi untuk lokasi ini..."
                                                    className="min-h-[100px] text-sm"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name={`locationServices.${locationIndex}.photos`}
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Foto Lokasi</FormLabel>
                                            <FormControl>
                                                <Dropzone
                                                    onDrop={(files) => handleImageDrop(locationIndex, files)}
                                                    files={location.photos || []}
                                                    onRemove={(photoIndex) => handleImageRemove(locationIndex, photoIndex)}
                                                    id={`location-${locationIndex}`}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            ))}
        </div>
    )
}