import { z } from "zod";
import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, Radio } from "@heroui/radio";
import { Switch } from "@heroui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import regenciesData from "@/assets/regencies.json";
import provincesData from "@/assets/provinces.json";
import districtsData from "@/assets/districts.json";
import { usePersistentForm } from "@/hooks/usePersistentForm";

export const customerSchema = z
    .object({
        type: z.enum(["individual", "company"]),
        name: z.string().min(3, "Nama harus minimal 3 karakter"),
        identificationNumber: z.string().min(1, "Nomor identifikasi wajib diisi"),
        phone: z.string().regex(/^08\d{10,11}$/, "Format nomor telepon tidak valid"),
        province1: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "Provinsi wajib diisi",
        }),
        regency1: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "Kabupaten wajib diisi",
        }),
        district1: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "Kecamatan wajib diisi",
        }),
        detail_address1: z.string().min(10, "Alamat harus minimal 10 karakter"),
        province2: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "Provinsi wajib diisi",
        }),
        regency2: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "Kabupaten wajib diisi",
        }),
        district2: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "Kecamatan wajib diisi",
        }),
        detail_address2: z.string().min(10, "Alamat harus minimal 10 karakter"),
    })
    .superRefine((values, ctx) => {
        if (values.type === "individual" && values.identificationNumber.length !== 16) {
            ctx.addIssue({
                message: "NIK harus terdiri dari 16 karakter",
                path: ["identificationNumber"],
                code: "custom",
            });
        } else if (values.type === "company" && values.identificationNumber) {
            const companyIdRegex = /^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/;
            if (!companyIdRegex.test(values.identificationNumber)) {
                ctx.addIssue({
                    message: "ID perusahaan harus mengikuti format 12.345.678.9-012.000",
                    path: ["identificationNumber"],
                    code: "custom",
                });
            }
        }
    });

export type CustomerForm = z.infer<typeof customerSchema>;

type ProvinceType = { code: number; name: string };
type RegencyType = { code: number; province_code: number; name: string };
type DistrictType = { code: number; regency_code: number; name: string };

const getRegenciesByProvince = (provinceCode: number) => regenciesData.filter((regency) => regency.province_code === provinceCode);

const getDistrictsByRegency = (regencyCode: number) => districtsData.filter((district) => district.regency_code === regencyCode);

const formatCompanyId = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += "." + digits.slice(2, 5);
    if (digits.length > 5) formatted += "." + digits.slice(5, 8);
    if (digits.length > 8) formatted += "." + digits.slice(8, 9);
    if (digits.length > 9) formatted += "-" + digits.slice(9, 12);
    if (digits.length > 12) formatted += "." + digits.slice(12, 15);
    return formatted;
};

interface CustomerFormProps {
    defaultValues?: Partial<CustomerForm>;
    onSubmit: (data: CustomerForm) => void;
    onCancel: () => void;
    submitLabel?: string;
    isSubmitting?: boolean;
}

export function CustomerForm({ defaultValues, onSubmit, onCancel, submitLabel = "Simpan", isSubmitting = false }: CustomerFormProps) {
    const {
        control,
        watch,
        handleSubmit,
        setValue,
        resetField,
        formState: { errors },
    } = usePersistentForm<CustomerForm>("customerForm", {
        resolver: zodResolver(customerSchema),
        defaultValues: {
            type: "individual",
            name: "",
            identificationNumber: "",
            phone: "",
            province1: "",
            regency1: "",
            district1: "",
            detail_address1: "",
            province2: "",
            regency2: "",
            district2: "",
            detail_address2: "",
            ...defaultValues,
        },
    });

    const [billingRegencies, setBillingRegencies] = useState<RegencyType[]>(defaultValues?.province1 ? getRegenciesByProvince(Number(defaultValues.province1)) : []);
    const [billingDistricts, setBillingDistricts] = useState<DistrictType[]>(defaultValues?.regency1 ? getDistrictsByRegency(Number(defaultValues.regency1)) : []);
    const [currentRegencies, setCurrentRegencies] = useState<RegencyType[]>(defaultValues?.province2 ? getRegenciesByProvince(Number(defaultValues.province2)) : []);
    const [currentDistricts, setCurrentDistricts] = useState<DistrictType[]>(defaultValues?.regency2 ? getDistrictsByRegency(Number(defaultValues.regency2)) : []);
    const [useSameAddress, setUseSameAddress] = useState(false);

    const customerType = watch("type");
    const billingProvince = watch("province1");
    const billingRegency = watch("regency1");
    const billingDistrict = watch("district1");
    const billingDetail = watch("detail_address1");
    const currentProvince = watch("province2");

    useEffect(() => {
        if (useSameAddress) {
            setCurrentRegencies(billingRegencies);
            setCurrentDistricts(billingDistricts);
            setValue("province2", billingProvince);
            setValue("regency2", billingRegency);
            setValue("district2", billingDistrict);
            setValue("detail_address2", billingDetail);
        }
    }, [useSameAddress, billingProvince, billingRegency, billingDistrict, billingDetail, billingRegencies, billingDistricts, setValue]);

    const handleBillingProvinceChange = useCallback(
        (value: string, onChange: (v: string) => void) => {
            onChange(value);
            const regs = getRegenciesByProvince(Number(value));
            setBillingRegencies(regs);
            setBillingDistricts([]);
            resetField("regency1");
            resetField("district1");
        },
        [resetField],
    );

    const handleBillingRegencyChange = useCallback(
        (value: string, onChange: (v: string) => void) => {
            onChange(value);
            const dists = getDistrictsByRegency(Number(value));
            setBillingDistricts(dists);
            resetField("district1");
        },
        [resetField],
    );

    const handleBillingDistrictChange = useCallback((value: string, onChange: (v: string) => void) => onChange(value), []);

    const handleBillingDetailChange = useCallback((value: string, onChange: (v: string) => void) => onChange(value), []);

    const handleCurrentProvinceChange = useCallback(
        (value: string, onChange: (v: string) => void) => {
            if (!useSameAddress) {
                onChange(value);
                const regs = getRegenciesByProvince(Number(value));
                setCurrentRegencies(regs);
                setCurrentDistricts([]);
                resetField("regency2");
                resetField("district2");
            }
        },
        [resetField, useSameAddress],
    );

    const handleCurrentRegencyChange = useCallback(
        (value: string, onChange: (v: string) => void) => {
            if (!useSameAddress) {
                onChange(value);
                const dists = getDistrictsByRegency(Number(value));
                setCurrentDistricts(dists);
                resetField("district2");
            }
        },
        [resetField, useSameAddress],
    );

    const handleIdentificationChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (v: string) => void) => {
        const { value } = e.target;
        onChange(customerType === "company" ? formatCompanyId(value) : value);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-fit">
            <Controller
                name="type"
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        size="sm"
                        className="mb-4"
                        color="primary"
                        label="Tipe Pelanggan"
                        value={field.value}
                        onChange={(e) => {
                            field.onChange(e.target.value);
                            resetField("identificationNumber");
                        }}
                    >
                        <Radio value="individual">Individual</Radio>
                        <Radio value="company">Company</Radio>
                    </RadioGroup>
                )}
            />
            <div className="space-y-1">
                <Label htmlFor="name">Nama</Label>
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder={customerType === "individual" ? "John Doe" : "PT. Abadi Jaya Sentosa"} />}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
                <Label htmlFor="identificationNumber">{customerType === "individual" ? "NIK" : "NPWP"}</Label>
                <Controller
                    name="identificationNumber"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            type={customerType === "individual" ? "number" : "text"}
                            value={field.value || ""}
                            onChange={(e) => handleIdentificationChange(e, field.onChange)}
                            placeholder={customerType === "individual" ? "1234567890123456" : "12.345.678.9-012.000"}
                        />
                    )}
                />
                {errors.identificationNumber && <p className="mt-1 text-xs text-red-500">{errors.identificationNumber.message}</p>}
            </div>
            <div className="space-y-1">
                <Label htmlFor="phone">No HP</Label>
                <Controller name="phone" control={control} render={({ field }) => <Input type="number" {...field} placeholder="081234567890" />} />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
                <Label>{customerType === "individual" ? "Alamat KTP" : "Alamat NPWP"}</Label>
                <div className="flex flex-wrap gap-2">
                    <div className="flex flex-col">
                        <Controller
                            name="province1"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value?.toString()} onValueChange={(val) => handleBillingProvinceChange(val, field.onChange)}>
                                    <SelectTrigger className="space-x-2 w-fit">
                                        <SelectValue placeholder="Provinsi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {provincesData.map((province: ProvinceType) => (
                                                <SelectItem key={province.code} value={province.code.toString()}>
                                                    {province.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.province1 && <p className="mt-1 text-xs text-red-500">{errors.province1.message}</p>}
                    </div>
                    <div className="flex flex-col">
                        <Controller
                            name="regency1"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value?.toString()} onValueChange={(val) => handleBillingRegencyChange(val, field.onChange)} disabled={!billingProvince}>
                                    <SelectTrigger className="space-x-2 w-fit">
                                        <SelectValue placeholder="Kabupaten" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {billingRegencies.map((regency) => (
                                                <SelectItem key={regency.code} value={regency.code.toString()}>
                                                    {regency.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.regency1 && <p className="mt-1 text-xs text-red-500">{errors.regency1.message}</p>}
                    </div>
                    <div className="flex flex-col">
                        <Controller
                            name="district1"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value?.toString()} onValueChange={(val) => handleBillingDistrictChange(val, field.onChange)} disabled={!billingRegency}>
                                    <SelectTrigger className="space-x-2 w-fit">
                                        <SelectValue placeholder="Kecamatan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {billingDistricts.map((district) => (
                                                <SelectItem key={district.code} value={district.code.toString()}>
                                                    {district.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.district1 && <p className="mt-1 text-xs text-red-500">{errors.district1.message}</p>}
                    </div>
                </div>
                <div className="flex flex-col">
                    <Controller
                        name="detail_address1"
                        control={control}
                        render={({ field }) => <Textarea {...field} placeholder="Detail Alamat" onChange={(e) => handleBillingDetailChange(e.target.value, field.onChange)} />}
                    />
                    {errors.detail_address1 && <p className="mt-1 text-xs text-red-500">{errors.detail_address1.message}</p>}
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Switch checked={useSameAddress} onValueChange={setUseSameAddress} />
                <Label>Alamat saat ini sama dengan {customerType === "individual" ? "Alamat KTP" : "Alamat NPWP"}</Label>
            </div>
            <div className="space-y-2">
                <Label>Alamat Saat Ini</Label>
                <div className="flex flex-wrap gap-2">
                    <div className="flex flex-col">
                        <Controller
                            name="province2"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value?.toString()}
                                    onValueChange={(val) => !useSameAddress && handleCurrentProvinceChange(val, field.onChange)}
                                    disabled={useSameAddress}
                                >
                                    <SelectTrigger className="space-x-2 w-fit">
                                        <SelectValue placeholder="Provinsi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {provincesData.map((province: ProvinceType) => (
                                                <SelectItem key={province.code} value={province.code.toString()}>
                                                    {province.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.province2 && <p className="mt-1 text-xs text-red-500">{errors.province2.message}</p>}
                    </div>
                    <div className="flex flex-col">
                        <Controller
                            name="regency2"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value?.toString()}
                                    onValueChange={(val) => !useSameAddress && handleCurrentRegencyChange(val, field.onChange)}
                                    disabled={useSameAddress || !currentProvince}
                                >
                                    <SelectTrigger className="space-x-2 w-fit">
                                        <SelectValue placeholder="Kabupaten" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {currentRegencies.map((regency) => (
                                                <SelectItem key={regency.code} value={regency.code.toString()}>
                                                    {regency.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.regency2 && <p className="mt-1 text-xs text-red-500">{errors.regency2.message}</p>}
                    </div>
                    <div className="flex flex-col">
                        <Controller
                            name="district2"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value?.toString()}
                                    onValueChange={!useSameAddress ? field.onChange : undefined}
                                    disabled={useSameAddress || !watch("regency2")}
                                >
                                    <SelectTrigger className="space-x-2 w-fit">
                                        <SelectValue placeholder="Kecamatan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {currentDistricts.map((district) => (
                                                <SelectItem key={district.code} value={district.code.toString()}>
                                                    {district.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.district2 && <p className="mt-1 text-xs text-red-500">{errors.district2.message}</p>}
                    </div>
                </div>
                <div className="flex flex-col">
                    <Controller name="detail_address2" control={control} render={({ field }) => <Textarea {...field} placeholder="Detail Alamat" disabled={useSameAddress} />} />
                    {errors.detail_address2 && <p className="mt-1 text-xs text-red-500">{errors.detail_address2.message}</p>}
                </div>
            </div>
            <div className="flex gap-2">
                <Button type="button" onClick={onCancel} variant="destructive" className="transition-all hover:bg-red-600 active:scale-95">
                    Batalkan
                </Button>
                <Button type="submit" disabled={isSubmitting} variant="default" className="transition-all hover:bg-gray-900 active:scale-95">
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
