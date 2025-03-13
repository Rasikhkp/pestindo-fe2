// File: src/routes/sales/customer/EditCustomer.tsx
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, Radio } from "@heroui/radio";
import { Switch } from "@heroui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import regenciesData from "@/assets/regencies.json";
import provincesData from "@/assets/provinces.json";
import districtsData from "@/assets/districts.json";
import { api, getApiErrorMessage } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";

export const Route = createFileRoute("/_layout/sales_/customer_/edit/$customer_id")({
    component: RouteComponent,
    loader: async ({ params }) => {
        const { data } = await api()
            .get("customers/" + params.customer_id)
            .json<any>();

        const idAddress = data.type === "individual" ? data.ktp_address.split(", ") : data.npwp_address.split(", ");
        const realAddress = data.address.split(", ");

        const province1 = provincesData.find(
            (d) => d.name.toLowerCase() === idAddress[idAddress.length - 1].toLowerCase(),
        )?.code;
        const province2 = provincesData.find(
            (d) => d.name.toLowerCase() === realAddress[realAddress.length - 1].toLowerCase(),
        )?.code;
        const regency1 = regenciesData.find(
            (d) => d.name.toLowerCase() === idAddress[idAddress.length - 2].toLowerCase(),
        )?.code;
        const regency2 = regenciesData.find(
            (d) => d.name.toLowerCase() === realAddress[realAddress.length - 2].toLowerCase(),
        )?.code;
        const district1 = districtsData.find(
            (d) => d.name.toLowerCase() === idAddress[idAddress.length - 3].toLowerCase(),
        )?.code;
        const district2 = districtsData.find(
            (d) => d.name.toLowerCase() === realAddress[realAddress.length - 3].toLowerCase(),
        )?.code;
        const detail_address1 = idAddress[idAddress.length - 4];
        const detail_address2 = realAddress[realAddress.length - 4];

        return {
            type: data.type,
            phone: data.phone,
            identificationNumber: data.npwp || data.nik,
            name: data.name,
            province1,
            province2,
            regency1,
            regency2,
            district1,
            district2,
            detail_address1,
            detail_address2,
        };
    },
    shouldReload: () => true,
    gcTime: 0,
});

const customerSchema = z
    .object({
        type: z.enum(["individual", "company"]),
        name: z.string().min(3, "Name must be at least 3 characters"),
        identificationNumber: z.string().min(1, "ID is required"),
        phone: z.string().regex(/^08\d{10,11}$/, "Invalid phone number format"),
        province1: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "Province is required",
        }),
        regency1: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "Regency is required",
        }),
        district1: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "District is required",
        }),
        detail_address1: z.string().min(10, "Address must be at least 10 characters"),
        province2: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "Province is required",
        }),
        regency2: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "Regency is required",
        }),
        district2: z.union([z.string(), z.number()]).refine((val) => val !== "", {
            message: "District is required",
        }),
        detail_address2: z.string().min(10, "Address must be at least 10 characters"),
    })
    .superRefine((values, ctx) => {
        if (values.type === "individual" && values.identificationNumber.length !== 16) {
            ctx.addIssue({
                message: "NIK must be 16 characters",
                path: ["identificationNumber"],
                code: "custom",
            });
        } else if (values.type === "company" && values.identificationNumber) {
            const companyIdRegex = /^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/;
            if (!companyIdRegex.test(values.identificationNumber)) {
                ctx.addIssue({
                    message: "Company ID must follow format 12.345.678.9-012.000",
                    path: ["identificationNumber"],
                    code: "custom",
                });
            }
        }
    });

type CustomerForm = z.infer<typeof customerSchema>;

type ProvinceType = { code: number; name: string };
type RegencyType = { code: number; province_code: number; name: string };
type DistrictType = { code: number; regency_code: number; name: string };

const getRegenciesByProvince = (provinceCode: number) =>
    regenciesData.filter((regency) => regency.province_code === provinceCode);

const getDistrictsByRegency = (regencyCode: number) =>
    districtsData.filter((district) => district.regency_code === regencyCode);

const formatIdentificationNumber = (value: string) => {
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

function RouteComponent() {
    const router = useRouter();
    const customer = Route.useLoaderData();
    const { customer_id } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [, setError] = useAtom(errorAtom);

    const {
        control,
        watch,
        handleSubmit,
        setValue,
        resetField,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CustomerForm>({
        resolver: zodResolver(customerSchema),
        defaultValues: customer,
    });

    const [billingRegencies, setBillingRegencies] = useState<RegencyType[]>(
        getRegenciesByProvince(Number(customer.province1)),
    );
    const [billingDistricts, setBillingDistricts] = useState<DistrictType[]>(
        getDistrictsByRegency(Number(customer.regency1)),
    );
    const [currentRegencies, setCurrentRegencies] = useState<RegencyType[]>(
        getRegenciesByProvince(Number(customer.province2)),
    );
    const [currentDistricts, setCurrentDistricts] = useState<DistrictType[]>(
        getDistrictsByRegency(Number(customer.regency2)),
    );
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
    }, [
        useSameAddress,
        billingProvince,
        billingRegency,
        billingDistrict,
        billingDetail,
        billingRegencies,
        billingDistricts,
        setValue,
    ]);

    const updateMutation = useMutation({
        mutationFn: (data: any) =>
            api()
                .patch("customers/" + customer_id, { json: data })
                .json(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
    });

    useEffect(() => {
        if (updateMutation.error) {
            getApiErrorMessage(updateMutation.error).then(setError);
        }
    }, [updateMutation.error, setError]);

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

    const handleBillingDistrictChange = useCallback(
        (value: string, onChange: (v: string) => void) => onChange(value),
        [],
    );

    const handleBillingDetailChange = useCallback(
        (value: string, onChange: (v: string) => void) => onChange(value),
        [],
    );

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

    const onSubmit = async (data: CustomerForm) => {
        const province1Name = provincesData.find((d) => d.code == data.province1)?.name;
        const province2Name = provincesData.find((d) => d.code == data.province2)?.name;
        const regency1Name = regenciesData.find((d) => d.code == data.regency1)?.name;
        const regency2Name = regenciesData.find((d) => d.code == data.regency2)?.name;
        const district1Name = districtsData.find((d) => d.code == data.district1)?.name;
        const district2Name = districtsData.find((d) => d.code == data.district2)?.name;

        const bodyData = {
            name: data.name,
            type: data.type,
            npwp: data.type === "individual" ? null : data.identificationNumber,
            nik: data.type === "individual" ? data.identificationNumber : null,
            npwp_address:
                data.type === "individual"
                    ? null
                    : `${data.detail_address1}, ${district1Name}, ${regency1Name}, ${province1Name}`,
            ktp_address:
                data.type === "individual"
                    ? `${data.detail_address1}, ${district1Name}, ${regency1Name}, ${province1Name}`
                    : null,
            address: `${data.detail_address2}, ${district2Name}, ${regency2Name}, ${province2Name}`,
            phone: data.phone,
        };

        updateMutation.mutate(bodyData);
        reset();
        navigate({ from: "/sales/customer/edit/$customer_id", to: "/sales/customer" });
    };

    return (
        <>
            <button
                onClick={() => router.history.back()}
                className="flex items-center gap-3 mb-4 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft size={16} className="transition-all group-hover:-translate-x-1" />
                Kembali
            </button>
            <div className="my-2 text-xl font-medium dark:text-gray-300">Edit Pelanggan</div>
            <div className="mt-2 mb-4 text-sm text-gray-700 dark:text-gray-400">Edit Data Pelanggan</div>
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
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder={watch("type") === "individual" ? "John Doe" : "PT. Abadi Jaya Sentosa"}
                            />
                        )}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="identificationNumber">{watch("type") === "individual" ? "NIK" : "NPWP"}</Label>
                    <Controller
                        name="identificationNumber"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type={customerType === "individual" ? "number" : "text"}
                                value={field.value || ""}
                                onChange={(e) =>
                                    field.onChange(
                                        customerType === "company"
                                            ? formatIdentificationNumber(e.target.value)
                                            : e.target.value,
                                    )
                                }
                                placeholder={
                                    watch("type") === "individual" ? "1234567890123456" : "12.345.678.9-012.000"
                                }
                            />
                        )}
                    />
                    {errors.identificationNumber && (
                        <p className="mt-1 text-xs text-red-500">{errors.identificationNumber.message}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="phone">No HP</Label>
                    <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => <Input type="number" {...field} placeholder="081234567890" />}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Alamat {watch("type") === "individual" ? "NIK" : "NPWP"}</Label>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex flex-col">
                            <Controller
                                name="province1"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value?.toString()}
                                        onValueChange={(val) => handleBillingProvinceChange(val, field.onChange)}
                                    >
                                        <SelectTrigger className="space-x-2 w-fit">
                                            <SelectValue placeholder="Provinsi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {provincesData.map((p: ProvinceType) => (
                                                    <SelectItem key={p.code} value={p.code.toString()}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.province1 && (
                                <p className="mt-1 text-xs text-red-500">{errors.province1.message}</p>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Controller
                                name="regency1"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value?.toString()}
                                        onValueChange={(val) => handleBillingRegencyChange(val, field.onChange)}
                                        disabled={!billingProvince}
                                    >
                                        <SelectTrigger className="space-x-2 w-fit">
                                            <SelectValue placeholder="Kabupaten" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {billingRegencies.map((r: RegencyType) => (
                                                    <SelectItem key={r.code} value={r.code.toString()}>
                                                        {r.name}
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
                                    <Select
                                        value={field.value?.toString()}
                                        onValueChange={(val) => handleBillingDistrictChange(val, field.onChange)}
                                        disabled={!billingRegency}
                                    >
                                        <SelectTrigger className="space-x-2 w-fit">
                                            <SelectValue placeholder="Kecamatan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {billingDistricts.map((d) => (
                                                    <SelectItem key={d.code} value={d.code.toString()}>
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.district1 && (
                                <p className="mt-1 text-xs text-red-500">{errors.district1.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <Controller
                            name="detail_address1"
                            control={control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    placeholder="Detail Alamat"
                                    onChange={(e) => handleBillingDetailChange(e.target.value, field.onChange)}
                                />
                            )}
                        />
                        {errors.detail_address1 && (
                            <p className="mt-1 text-xs text-red-500">{errors.detail_address1.message}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch checked={useSameAddress} onValueChange={setUseSameAddress} />
                    <Label>Alamat saat ini sama dengan alamat {watch("type") === "individual" ? "NIK" : "NPWP"}</Label>
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
                                        onValueChange={(val) =>
                                            !useSameAddress ? handleCurrentProvinceChange(val, field.onChange) : null
                                        }
                                        disabled={useSameAddress}
                                    >
                                        <SelectTrigger className="space-x-2 w-fit">
                                            <SelectValue placeholder="Provinsi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {provincesData.map((p: ProvinceType) => (
                                                    <SelectItem key={p.code} value={p.code.toString()}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.province2 && (
                                <p className="mt-1 text-xs text-red-500">{errors.province2.message}</p>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Controller
                                name="regency2"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value?.toString()}
                                        onValueChange={(val) =>
                                            !useSameAddress ? handleCurrentRegencyChange(val, field.onChange) : null
                                        }
                                        disabled={useSameAddress || !currentProvince}
                                    >
                                        <SelectTrigger className="space-x-2 w-fit">
                                            <SelectValue placeholder="Kabupaten" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {currentRegencies.map((r: RegencyType) => (
                                                    <SelectItem key={r.code} value={r.code.toString()}>
                                                        {r.name}
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
                                                {currentDistricts.map((d) => (
                                                    <SelectItem key={d.code} value={d.code.toString()}>
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.district2 && (
                                <p className="mt-1 text-xs text-red-500">{errors.district2.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <Controller
                            name="detail_address2"
                            control={control}
                            render={({ field }) => (
                                <Textarea {...field} placeholder="Detail Alamat" disabled={useSameAddress} />
                            )}
                        />
                        {errors.detail_address2 && (
                            <p className="mt-1 text-xs text-red-500">{errors.detail_address2.message}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        onClick={() => router.history.back()}
                        variant="destructive"
                        className="transition-all hover:bg-red-600 active:scale-95"
                    >
                        Batalkan
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        variant="default"
                        className="transition-all hover:bg-gray-900 active:scale-95"
                    >
                        Simpan
                    </Button>
                </div>
            </form>
        </>
    );
}

export default RouteComponent;
