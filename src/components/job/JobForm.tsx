import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, Radio } from "@heroui/radio";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { DatePickerWithRange } from "@/components/DateRangePicker";
import { addMonths } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { Customer } from "@/types/types";

function getMonthDifference(start: Date, end: Date): number {
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();
    return months > 0 ? months : 0;
}

const dateRangeSchema = z
    .object({
        from: z.date({ required_error: "Tanggal mulai wajib diisi" }),
        to: z.date({ required_error: "Tanggal selesai wajib diisi" }),
    })
    .refine((range) => getMonthDifference(range.from, range.to) >= 1, {
        message: "Rentang tanggal minimal 1 bulan",
    });

export const jobSchema = z
    .object({
        jobType: z.enum(["pest_control", "termite_control"]),
        contractType: z.enum(["one_time", "project"]),
        customer: z.number().min(1, "Pelanggan harus dipilih"),
        sales: z.number().min(1, "Sales harus dipilih"),
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

function Combobox({
    value,
    onValueChange,
    data,
    className,
}: {
    value: string | number;
    onValueChange: (val: string | number) => void;
    data: { id: number | string; name: string }[];
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredData = search ? data.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())) : data;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Input
                    value={data.find((item) => String(item.id) === String(value))?.name || ""}
                    placeholder="Pilih"
                    readOnly
                    className={`cursor-pointer ${className} text-start`}
                />
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Cari..." value={search} onValueChange={setSearch} />
                    <CommandList>
                        {filteredData.length === 0 ? (
                            <CommandEmpty>Tidak ada data</CommandEmpty>
                        ) : (
                            filteredData.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    onSelect={() => {
                                        onValueChange(item.id);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    {item.name}
                                </CommandItem>
                            ))
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface JobFormProps {
    defaultValues?: Partial<JobForm>;
    onSubmit: (data: JobForm) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    customers: Customer[];
    sales: { id: number; name: string }[];
}

export function JobForm({ defaultValues, onSubmit, onCancel, isSubmitting, customers, sales }: JobFormProps) {
    const {
        control,
        watch,
        setValue,
        handleSubmit,
        formState: { errors },
    } = useForm<JobForm>({
        resolver: zodResolver(jobSchema),
        defaultValues: defaultValues || {
            jobType: "pest_control",
            contractType: "one_time",
            customer: 0,
            sales: 0,
            poNumber: "",
            spkNumber: "",
            monthlyContractValue: 0,
            totalContract: 0,
            monthlyVisit: 0,
            picName: "",
            picPhone: "",
            picFinanceName: "",
            picFinancePhone: "",
            reference: "creative_lead",
            dateRange: { from: new Date(), to: addMonths(new Date(), 1) },
        },
    });

    const contractType = watch("contractType");
    const monthlyContractValue = watch("monthlyContractValue");
    const dateRange = watch("dateRange");

    useEffect(() => {
        if (contractType === "project" && monthlyContractValue && dateRange?.from && dateRange?.to) {
            const months = getMonthDifference(dateRange.from, dateRange.to);
            const total = monthlyContractValue * months;
            setValue("totalContract", total);
        }
    }, [contractType, monthlyContractValue, dateRange, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Tipe Pekerjaan & Tipe Kontrak */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Controller
                    name="jobType"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup size="sm" label="Tipe Pekerjaan" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                            <Radio value="pest_control">Pest Control</Radio>
                            <Radio value="termite_control">Termite Control</Radio>
                        </RadioGroup>
                    )}
                />
                <Controller
                    name="contractType"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup size="sm" label="Tipe Kontrak" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                            <Radio value="one_time">One Time</Radio>
                            <Radio value="project">Project</Radio>
                        </RadioGroup>
                    )}
                />
            </div>
            {/* Nama Pelanggan */}
            <div className="space-y-2">
                <Label htmlFor="customer">Nama Pelanggan</Label>
                <Controller
                    name="customer"
                    control={control}
                    render={({ field }) => <Combobox value={field.value} onValueChange={field.onChange} data={customers} className="max-w-xs" />}
                />
                {errors.customer && <p className="mt-1 text-xs text-red-500">{errors.customer.message}</p>}
            </div>
            {/* Nomor PO & SPK */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="poNumber">Nomor PO</Label>
                    <Controller name="poNumber" control={control} render={({ field }) => <Input {...field} placeholder="Nomor PO" />} />
                    {errors.poNumber && <p className="mt-1 text-xs text-red-500">{errors.poNumber.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="spkNumber">Nomor SPK</Label>
                    <Controller name="spkNumber" control={control} render={({ field }) => <Input {...field} placeholder="Nomor SPK" />} />
                    {errors.spkNumber && <p className="mt-1 text-xs text-red-500">{errors.spkNumber.message}</p>}
                </div>
            </div>
            {/* Date Range Picker */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="dateRange">Rentang Tanggal</Label>
                    <Controller name="dateRange" control={control} render={({ field }) => <DatePickerWithRange value={field.value} onChange={field.onChange} />} />
                    {errors.dateRange && <p className="mt-1 text-xs text-red-500">{errors.dateRange.message}</p>}
                </div>
            </div>
            {/* Nilai Kontrak Bulanan & Total Kontrak */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {contractType === "project" && (
                    <div className="space-y-2">
                        <Label htmlFor="monthlyContractValue">Nilai Kontrak Bulanan</Label>
                        <Controller
                            name="monthlyContractValue"
                            control={control}
                            render={({ field }) => <Input {...field} type="number" placeholder="Nilai Kontrak Bulanan" />}
                        />
                        {errors.monthlyContractValue && <p className="mt-1 text-xs text-red-500">{errors.monthlyContractValue.message}</p>}
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="totalContract">Total Kontrak</Label>
                    <Controller name="totalContract" control={control} render={({ field }) => <Input {...field} type="number" placeholder="Total Kontrak" />} />
                    {errors.totalContract && <p className="mt-1 text-xs text-red-500">{errors.totalContract.message}</p>}
                </div>
            </div>
            {/* Jumlah Kunjungan per Bulan */}
            {contractType === "project" && (
                <div className="space-y-2">
                    <Label htmlFor="monthlyVisit">Jumlah Kunjungan per Bulan</Label>
                    <Controller
                        name="monthlyVisit"
                        control={control}
                        render={({ field }) => <Input {...field} type="number" placeholder="Jumlah Kunjungan per Bulan" className="max-w-xs" />}
                    />
                    {errors.monthlyVisit && <p className="mt-1 text-xs text-red-500">{errors.monthlyVisit.message}</p>}
                </div>
            )}
            {/* PIC & PIC Finance */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="picName">Nama PIC</Label>
                    <Controller name="picName" control={control} render={({ field }) => <Input {...field} placeholder="Nama PIC" />} />
                    {errors.picName && <p className="mt-1 text-xs text-red-500">{errors.picName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="picPhone">Nomor HP PIC</Label>
                    <Controller name="picPhone" control={control} render={({ field }) => <Input {...field} type="number" placeholder="Nomor HP PIC" />} />
                    {errors.picPhone && <p className="mt-1 text-xs text-red-500">{errors.picPhone.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="picFinanceName">Nama PIC Finance</Label>
                    <Controller name="picFinanceName" control={control} render={({ field }) => <Input {...field} placeholder="Nama PIC Finance" />} />
                    {errors.picFinanceName && <p className="mt-1 text-xs text-red-500">{errors.picFinanceName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="picFinancePhone">Nomor HP PIC Finance</Label>
                    <Controller name="picFinancePhone" control={control} render={({ field }) => <Input {...field} type="number" placeholder="Nomor HP PIC Finance" />} />
                    {errors.picFinancePhone && <p className="mt-1 text-xs text-red-500">{errors.picFinancePhone.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="sales">Nama Sales</Label>
                <Controller
                    name="sales"
                    control={control}
                    render={({ field }) => <Combobox value={field.value} onValueChange={field.onChange} data={sales} className="max-w-xs" />}
                />
                {errors.sales && <p className="mt-1 text-xs text-red-500">{errors.sales.message}</p>}
            </div>
            {/* Referensi */}
            <div className="space-y-2">
                <Controller
                    name="reference"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup size="sm" label="Referensi" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                            <Radio value="creative_lead">Creative Lead</Radio>
                            <Radio value="office_lead">Office Lead</Radio>
                            <Radio value="employed_lead">Employed Lead</Radio>
                        </RadioGroup>
                    )}
                />
            </div>
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