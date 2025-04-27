import { useFieldArray, useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NumberInput } from "@/components/ui/number-input"
import { ChipSelect } from "@/components/ui/chip-select"
import { CHEMICAL_OPTIONS, BILL_CHEMICAL_OPTIONS } from "@/constants/form-wizard"
import type { ReportData } from "@/validations/form-wizard"
import { useState } from "react"
import { motion } from "motion/react"

export function ChemicalsStep() {
    const { control, setValue, watch } = useFormContext<ReportData>()
    const [activeTab, setActiveTab] = useState("actual")

    const billChemicals = watch("billChemicals") || []

    const {
        fields: chemicalFields,
        append: appendChemical,
        remove: removeChemical,
    } = useFieldArray({
        control,
        name: "chemicals",
    })

    const handleBillChemicalChange = (selected: string[]) => {
        setValue("billChemicals", selected, { shouldValidate: true })
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="actual">Aktual</TabsTrigger>
                    <TabsTrigger value="bill">Ditagih</TabsTrigger>
                </TabsList>

                <TabsContent value="actual" className="mt-0 min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Chemical Aktual</h3>
                        <Button
                            onClick={() => appendChemical({ name: "", dosage: "", unit: "" })}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                        >
                            <Plus className="h-4 w-4" />Tambah
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {chemicalFields.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Belum ada chemical yang ditambahkan. Klik "Tambah" untuk memulai.
                            </p>
                        ) : (
                            chemicalFields.map((field, index) => (
                                <motion.div
                                    key={field.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid grid-cols-1 min-[400px]:grid-cols-[2fr_3fr] sm:grid-cols-3 gap-2 items-end"
                                >
                                    <FormField
                                        control={control}
                                        name={`chemicals.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem className="">
                                                <FormLabel>Nama Chemical</FormLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        // Set name
                                                        field.onChange(value)

                                                        // Set unit based on selection
                                                        const option = CHEMICAL_OPTIONS.find((opt) => opt.value === value)
                                                        if (option) {
                                                            setValue(`chemicals.${index}.unit`, option.unit)
                                                        }
                                                    }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select chemical" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {CHEMICAL_OPTIONS.map((option) => (
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
                                        name={`chemicals.${index}.dosage`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Dosis</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <FormControl>
                                                        <NumberInput
                                                            value={Number.parseFloat(field.value) || 0}
                                                            onChange={(value) => field.onChange(value.toString())}
                                                            min={0}
                                                            step={0.5}
                                                            unit={watch(`chemicals.${index}.unit`) || ""}
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeChemical(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="bill" className="mt-0 min-h-[400px]">
                    <FormField
                        control={control}
                        name="billChemicals"
                        render={() => (
                            <FormItem>
                                <FormLabel className="text-lg font-medium mb-4 block">Chemical Ditagih</FormLabel>
                                <FormControl>
                                    <ChipSelect
                                        options={BILL_CHEMICAL_OPTIONS}
                                        value={billChemicals}
                                        onChange={handleBillChemicalChange}
                                        className="min-h-[200px]"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
