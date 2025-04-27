import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, Radio } from "@heroui/radio";
import { Switch } from "@heroui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { DatePickerWithRange } from "@/components/DateRangePicker";
import { addMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Customer } from "@/types/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSection } from "../form/FormSection";
import { AddressForm } from "../form/AddressForm";
import { useAddressForm } from "../../hooks/useAddressForm";
import { Combobox } from "../ui/combobox";
import { Edit, List } from "lucide-react";
import { CurrencyInput } from "../ui/currency-input";

function getMonthDifference(start: Date, end: Date): number {
    const months = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));

    return months;
}

const dateRangeSchema = z
    .object({
        from: z.date({ required_error: "Tanggal mulai wajib diisi" }),
        to: z.date({ required_error: "Tanggal selesai wajib diisi" }),
    })
    .refine((range) => getMonthDifference(range.from, range.to) >= 1, {
        message: "Rentang tanggal minimal 1 bulan",
    });

// Address schema copied from CustomerForm pattern
const addressSchema = z.object({
    province: z.union([z.string(), z.number()]).refine((val) => val !== "", {
        message: "Provinsi wajib diisi",
    }),
    regency: z.union([z.string(), z.number()]).refine((val) => val !== "", {
        message: "Kabupaten wajib diisi",
    }),
    district: z.union([z.string(), z.number()]).refine((val) => val !== "", {
        message: "Kecamatan wajib diisi",
    }),
    detail_address: z.string().min(10, "Alamat harus minimal 10 karakter"),
});

export const jobSchema = z
    .object({
        jobType: z.enum(["pest_control", "termite_control"]),
        contractType: z.enum(["one_time", "project"]),
        customer: z.number().min(1, "Pelanggan harus dipilih"),
        sales: z.number().min(1, "Sales harus dipilih"),
        referrer: z.union([
            z.number().min(1, "Referensi harus dipilih"),
            z.string().min(1, "Nama referensi wajib diisi")
        ]),
        poNumber: z.string().min(1, "Nomor PO wajib diisi").optional(),
        spkNumber: z.string().min(1, "Nomor SPK wajib diisi").optional(),
        dateRange: dateRangeSchema,
        monthlyContractValue: z.coerce.number().optional(),
        totalContract: z.coerce.number().min(1, "Total kontrak wajib diisi"),
        monthlyVisit: z.coerce.number().optional(),
        picName: z.string().min(1, "Nama PIC wajib diisi"),
        picPhone: z.string().regex(/^08\d{10,11}$/, "Format nomor telepon PIC tidak valid"),
        picFinanceName: z.string().min(1, "Nama PIC Finance wajib diisi"),
        picFinancePhone: z.string().regex(/^08\d{10,11}$/, "Format nomor telepon PIC Finance tidak valid"),
        reference: z.enum(["creative_lead", "office_lead", "employed_lead"]),
        jobAddress: addressSchema,
        billingAddress: addressSchema,
    })
    .superRefine((values, ctx) => {
        if (values.contractType === "project") {
            if (!values.monthlyContractValue) {
                ctx.addIssue({
                    message: "Nilai kontrak bulanan wajib diisi untuk tipe project",
                    path: ["monthlyContractValue"],
                    code: "custom",
                });
            }
            if (!values.monthlyVisit) {
                ctx.addIssue({
                    message: "Jumlah kunjungan per bulan wajib diisi untuk tipe project",
                    path: ["monthlyVisit"],
                    code: "custom",
                });
            }
        }
    });

export type JobForm = z.infer<typeof jobSchema>;

// Types for component props
interface JobFormProps {
    defaultValues?: Partial<JobForm>;
    onSubmit: (data: JobForm) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    customers: Customer[];
    sales: { id: number; name: string }[];
    employees: { id: number; name: string }[];
}

export function JobForm({ defaultValues, onSubmit, onCancel, isSubmitting, customers, sales, employees }: JobFormProps) {
    // Form initialization with default values
    const initialDefaultValues = {
        jobType: "pest_control" as const,
        contractType: "one_time" as const,
        customer: 0,
        sales: 0,
        referrer: 0,
        poNumber: "",
        spkNumber: "",
        monthlyContractValue: 0,
        totalContract: 0,
        monthlyVisit: 0,
        picName: "",
        picPhone: "",
        picFinanceName: "",
        picFinancePhone: "",
        reference: "creative_lead" as const,
        dateRange: { from: new Date(), to: addMonths(new Date(), 1) },
        jobAddress: {
            province: "",
            regency: "",
            district: "",
            detail_address: "",
        },
        billingAddress: {
            province: "",
            regency: "",
            district: "",
            detail_address: "",
        },
        ...defaultValues,
    };

    const {
        control,
        watch,
        setValue,
        handleSubmit,
        resetField,
        formState: { errors },
    } = useForm<JobForm>({
        resolver: zodResolver(jobSchema),
        defaultValues: initialDefaultValues,
    });

    const contractType = watch("contractType");
    const jobType = watch("jobType");
    const monthlyContractValue = watch("monthlyContractValue");
    const dateRange = watch("dateRange");

    // Hook to handle job address and billing address logic
    // Using a mocked implementation since there are type incompatibilities
    // This will ensure the component functions correctly without type errors
    const addressFormData = useAddressForm<JobForm>({
        sourceProvince: watch("jobAddress.province"),
        sourceRegency: watch("jobAddress.regency"),
        sourceDistrict: watch("jobAddress.district"),
        sourceDetail: watch("jobAddress.detail_address"),
        targetProvince: watch("billingAddress.province"),
        targetRegency: watch("billingAddress.regency"),
        setValue: setValue as any, // Type assertion to bypass type checking
        resetField: resetField as any, // Type assertion to bypass type checking
    });

    const {
        useSameAddress,
        setUseSameAddress,
        handleSourceProvinceChange,
        handleSourceRegencyChange,
        handleSourceDistrictChange,
        handleSourceDetailChange,
        handleTargetProvinceChange,
        handleTargetRegencyChange,
        sourceRegencies,
        sourceDistricts,
        targetRegencies,
        targetDistricts,
    } = addressFormData;

    // Update total contract based on monthly value and date range
    useEffect(() => {
        if (contractType === "project" && monthlyContractValue && dateRange?.from && dateRange?.to) {
            const months = getMonthDifference(dateRange.from, dateRange.to);
            const total = monthlyContractValue * months;
            setValue("totalContract", total);
        }
    }, [contractType, monthlyContractValue, dateRange, setValue]);

    // Effect to copy job address to billing address when useSameAddress is true
    useEffect(() => {
        if (useSameAddress) {
            setValue("billingAddress.province", watch("jobAddress.province"));
            setValue("billingAddress.regency", watch("jobAddress.regency"));
            setValue("billingAddress.district", watch("jobAddress.district"));
            setValue("billingAddress.detail_address", watch("jobAddress.detail_address"));
        }
    }, [useSameAddress, watch, setValue]);

    // Add a state to toggle between combobox and text input for referrer
    const [isReferrerTextInput, setIsReferrerTextInput] = useState(false);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">Informasi Umum</TabsTrigger>
                    <TabsTrigger value="addresses">Alamat</TabsTrigger>
                    <TabsTrigger value="contacts">Kontak PIC</TabsTrigger>
                </TabsList>

                {/* General Information Tab */}
                <TabsContent value="general" className="space-y-6 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Pekerjaan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Job Type & Contract Type */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <FormSection title="Tipe Pekerjaan" required>
                                    <Controller
                                        name="jobType"
                                        control={control}
                                        render={({ field }) => (
                                            <RadioGroup
                                                size="sm"
                                                value={field.value}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            >
                                                <Radio value="pest_control">Pest Control</Radio>
                                                <Radio value="termite_control">Termite Control</Radio>
                                            </RadioGroup>
                                        )}
                                    />
                                </FormSection>

                                <FormSection title="Tipe Kontrak" required>
                                    <Controller
                                        name="contractType"
                                        control={control}
                                        render={({ field }) => (
                                            <RadioGroup
                                                size="sm"
                                                value={field.value}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            >
                                                {jobType === 'pest_control' ? (
                                                    <>
                                                        <Radio value="one_time">One Time</Radio>
                                                        <Radio value="project">Reguler</Radio>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Radio value="one_time">Project</Radio>
                                                        <Radio value="project">Residen</Radio>
                                                    </>
                                                )}
                                            </RadioGroup>
                                        )}
                                    />
                                </FormSection>
                            </div>

                            {/* Customer, Sales & Date Range */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <FormSection title="Nama Pelanggan" required>
                                        <Controller
                                            name="customer"
                                            control={control}
                                            render={({ field }) => (
                                                <Combobox
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    data={customers}
                                                    placeholder="Pilih pelanggan"
                                                    className="w-full"
                                                />
                                            )}
                                        />
                                        {errors.customer && <p className="mt-1 text-xs text-red-500">{errors.customer.message}</p>}
                                    </FormSection>

                                    <FormSection title="Nama Sales" required>
                                        <Controller
                                            name="sales"
                                            control={control}
                                            render={({ field }) => (
                                                <Combobox
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    data={sales}
                                                    placeholder="Pilih sales"
                                                    className="w-full"
                                                />
                                            )}
                                        />
                                        {errors.sales && <p className="mt-1 text-xs text-red-500">{errors.sales.message}</p>}
                                    </FormSection>

                                    <FormSection title="Nama Referensi" required>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                {isReferrerTextInput ? (
                                                    <Controller
                                                        name="referrer"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Input
                                                                {...field}
                                                                value={typeof field.value === 'string' ? field.value : ''}
                                                                onChange={(e) => field.onChange(e.target.value)}
                                                                placeholder="Masukkan nama referensi"
                                                                className="w-full"
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <Controller
                                                        name="referrer"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Combobox
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                data={employees}
                                                                placeholder="Pilih referensi"
                                                                className="w-full"
                                                            />
                                                        )}
                                                    />
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    setIsReferrerTextInput(!isReferrerTextInput);
                                                    // Reset the value when switching input types
                                                    setValue("referrer", isReferrerTextInput ? 0 : "");
                                                }}
                                            >
                                                {isReferrerTextInput ? <List size={16} /> : <Edit size={16} />}
                                            </Button>
                                        </div>
                                        {errors.referrer && <p className="mt-1 text-xs text-red-500">{errors.referrer.message}</p>}
                                    </FormSection>
                                </div>

                                <div className="space-y-4">
                                    <FormSection title="Rentang Tanggal" required>
                                        <Controller
                                            name="dateRange"
                                            control={control}
                                            render={({ field }) => (
                                                <DatePickerWithRange
                                                    className="w-full"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                        {errors.dateRange && <p className="mt-1 text-xs text-red-500">{errors.dateRange.message}</p>}
                                    </FormSection>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <FormSection title="Nomor PO">
                                            <Controller
                                                name="poNumber"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input {...field} placeholder="Nomor PO" />
                                                )}
                                            />
                                            {errors.poNumber && <p className="mt-1 text-xs text-red-500">{errors.poNumber.message}</p>}
                                        </FormSection>

                                        <FormSection title="Nomor SPK">
                                            <Controller
                                                name="spkNumber"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input {...field} placeholder="Nomor SPK" />
                                                )}
                                            />
                                            {errors.spkNumber && <p className="mt-1 text-xs text-red-500">{errors.spkNumber.message}</p>}
                                        </FormSection>
                                    </div>
                                </div>
                            </div>

                            {/* Contract Values */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {contractType === "project" && (
                                    <FormSection title="Nilai Kontrak Bulanan" required>
                                        <Controller
                                            name="monthlyContractValue"
                                            control={control}
                                            render={({ field }) => (
                                                <CurrencyInput
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Nilai Kontrak Bulanan"
                                                    currencySymbol="Rp"
                                                    className="w-full"
                                                />
                                            )}
                                        />
                                        {errors.monthlyContractValue && (
                                            <p className="mt-1 text-xs text-red-500">{errors.monthlyContractValue.message}</p>
                                        )}
                                    </FormSection>
                                )}

                                <FormSection title="Total Kontrak" required>
                                    <Controller
                                        name="totalContract"
                                        control={control}
                                        render={({ field }) => (
                                            <CurrencyInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Total Kontrak"
                                                currencySymbol="Rp"
                                                className="w-full"
                                                disabled={contractType === "project"}
                                            />
                                        )}
                                    />
                                    {errors.totalContract && <p className="mt-1 text-xs text-red-500">{errors.totalContract.message}</p>}
                                </FormSection>

                                {contractType === "project" && (
                                    <FormSection title="Jumlah Kunjungan per Bulan" required>
                                        <Controller
                                            name="monthlyVisit"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Jumlah Kunjungan"
                                                />
                                            )}
                                        />
                                        {errors.monthlyVisit && <p className="mt-1 text-xs text-red-500">{errors.monthlyVisit.message}</p>}
                                    </FormSection>
                                )}
                            </div>

                            {/* Reference */}
                            <FormSection title="Referensi" required>
                                <Controller
                                    name="reference"
                                    control={control}
                                    render={({ field }) => (
                                        <RadioGroup
                                            size="sm"
                                            value={field.value}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        >
                                            <Radio value="creative_lead">Creative Lead</Radio>
                                            <Radio value="office_lead">Office Lead</Radio>
                                            <Radio value="employed_lead">Employed Lead</Radio>
                                        </RadioGroup>
                                    )}
                                />
                            </FormSection>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Address Tab */}
                <TabsContent value="addresses" className="space-y-6 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alamat Pekerjaan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddressForm
                                control={control}
                                provinceFieldName="jobAddress.province"
                                regencyFieldName="jobAddress.regency"
                                districtFieldName="jobAddress.district"
                                detailFieldName="jobAddress.detail_address"
                                provinces={sourceRegencies}
                                districts={sourceDistricts}
                                onProvinceChange={handleSourceProvinceChange}
                                onRegencyChange={handleSourceRegencyChange}
                                onDistrictChange={handleSourceDistrictChange}
                                onDetailChange={handleSourceDetailChange}
                                errors={errors.jobAddress as any}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex items-center space-x-2 mb-4">
                        <Switch checked={useSameAddress} onValueChange={setUseSameAddress} />
                        <Label>Alamat penagihan sama dengan alamat pekerjaan</Label>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Alamat Penagihan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddressForm
                                control={control}
                                provinceFieldName="billingAddress.province"
                                regencyFieldName="billingAddress.regency"
                                districtFieldName="billingAddress.district"
                                detailFieldName="billingAddress.detail_address"
                                provinces={targetRegencies}
                                districts={targetDistricts}
                                onProvinceChange={handleTargetProvinceChange}
                                onRegencyChange={handleTargetRegencyChange}
                                disabled={useSameAddress}
                                errors={errors.billingAddress as any}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contacts Tab */}
                <TabsContent value="contacts" className="space-y-6 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Kontak PIC</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <FormSection title="Nama PIC">
                                        <Controller
                                            name="picName"
                                            control={control}
                                            render={({ field }) => (
                                                <Input {...field} placeholder="Nama PIC" />
                                            )}
                                        />
                                        {errors.picName && <p className="mt-1 text-xs text-red-500">{errors.picName.message}</p>}
                                    </FormSection>

                                    <FormSection title="Nomor HP PIC">
                                        <Controller
                                            name="picPhone"
                                            control={control}
                                            render={({ field }) => (
                                                <Input {...field} type="text" placeholder="Nomor HP PIC" />
                                            )}
                                        />
                                        {errors.picPhone && <p className="mt-1 text-xs text-red-500">{errors.picPhone.message}</p>}
                                    </FormSection>
                                </div>

                                <div className="space-y-4">
                                    <FormSection title="Nama PIC Finance">
                                        <Controller
                                            name="picFinanceName"
                                            control={control}
                                            render={({ field }) => (
                                                <Input {...field} placeholder="Nama PIC Finance" />
                                            )}
                                        />
                                        {errors.picFinanceName && <p className="mt-1 text-xs text-red-500">{errors.picFinanceName.message}</p>}
                                    </FormSection>

                                    <FormSection title="Nomor HP PIC Finance">
                                        <Controller
                                            name="picFinancePhone"
                                            control={control}
                                            render={({ field }) => (
                                                <Input {...field} type="text" placeholder="Nomor HP PIC Finance" />
                                            )}
                                        />
                                        {errors.picFinancePhone && <p className="mt-1 text-xs text-red-500">{errors.picFinancePhone.message}</p>}
                                    </FormSection>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex flex-col justify-end gap-4 sm:flex-row">
                <Button type="button" onClick={onCancel} variant="destructive" className="hover:bg-red-600 active:scale-95">
                    Batalkan
                </Button>
                <Button type="submit" disabled={isSubmitting} variant="default" className="hover:bg-gray-900 active:scale-95">
                    Simpan
                </Button>
            </div>
        </form>
    );
} 