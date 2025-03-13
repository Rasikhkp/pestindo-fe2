import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, Radio } from "@heroui/radio";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/utils";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";
import { Customer } from "@/types/types";

// Import Popover and Command components from shadcn UI (or your local UI library)
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { DatePickerWithRange } from "@/components/DateRangePicker";
import { addMonths } from "date-fns";

// Helper: Calculate the difference in months between two dates
function getMonthDifference(start: Date, end: Date): number {
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();
    return months > 0 ? months : 0;
}

// Zod schema for date range
const dateRangeSchema = z
    .object({
        from: z.date({
            required_error: "Tanggal mulai wajib diisi",
        }),
        to: z.date({
            required_error: "Tanggal selesai wajib diisi",
        }),
    })
    .refine((range) => getMonthDifference(range.from, range.to) >= 1, {
        message: "Rentang tanggal minimal 1 bulan",
    });

// Main form validation schema
const jobSchema = z
    .object({
        jobType: z.enum(["pest_control", "termite_control"]),
        contractType: z.enum(["one_time", "project"]),
        customer: z.string().min(1, "Pelanggan harus dipilih"),
        sales: z.string().min(1, "Sales harus dipilih"),
        poNumber: z.string().min(1, "Nomor PO wajib diisi"),
        spkNumber: z.string().min(1, "Nomor SPK wajib diisi"),
        dateRange: dateRangeSchema,
        // Hanya wajib jika tipe kontrak adalah project
        monthlyContractValue: z.string().optional(),
        totalContract: z.string().min(1, "Total kontrak wajib diisi"),
        monthlyVisit: z.string().optional(),
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

type JobForm = z.infer<typeof jobSchema>;

export const Route = createFileRoute("/_layout/sales_/job_/create")({
    component: RouteComponent,
});

function Combobox({
    value,
    onValueChange,
    data,
    className,
}: {
    value: string;
    onValueChange: (val: string) => void;
    data: Customer[];
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Filter customers based on search query
    const filteredCustomers = search ? data.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : data;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Input
                    value={data.find((c) => String(c.id) === value)?.name || ""}
                    placeholder="Pilih Pelanggan"
                    readOnly
                    className={`cursor-pointer ${className} text-start`}
                />
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput
                        placeholder="Cari pelanggan..."
                        value={search}
                        onValueChange={(val) => setSearch(val)}
                    />
                    <CommandList>
                        {filteredCustomers.length === 0 ? (
                            <CommandEmpty>Tidak ada pelanggan</CommandEmpty>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    onSelect={() => {
                                        onValueChange(String(customer.id));
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    {customer.name}
                                </CommandItem>
                            ))
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function RouteComponent() {
    const router = useRouter();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [, setError] = useAtom(errorAtom);

    const {
        control,
        watch,
        setValue,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<JobForm>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            jobType: "pest_control",
            contractType: "one_time",
            customer: "",
            poNumber: "",
            spkNumber: "",
            monthlyContractValue: "",
            totalContract: "",
            monthlyVisit: "",
            picName: "",
            picPhone: "",
            picFinanceName: "",
            picFinancePhone: "",
            reference: "creative_lead",
            dateRange: { from: new Date(), to: addMonths(new Date(), 1) },
        },
    });

    // Watch fields for calculating total contract value
    const contractType = watch("contractType");
    const monthlyContractValue = watch("monthlyContractValue");
    const dateRange = watch("dateRange");

    // Calculate total contract value for project contracts automatically
    useEffect(() => {
        if (contractType === "project" && monthlyContractValue && dateRange?.from && dateRange?.to) {
            const months = getMonthDifference(dateRange.from, dateRange.to);
            const total = Number(monthlyContractValue) * months;
            setValue("totalContract", total.toString());
        }
    }, [contractType, monthlyContractValue, dateRange, setValue]);

    const { data: customersData } = useQuery({
        queryKey: ["customers"],
        queryFn: async () => api().get("customers").json<{ data: Customer[] }>(),
    });

    const { data: salesData } = useQuery({
        queryKey: ["sales"],
        queryFn: async () => api().get("employee").json<any>(),
    });

    const customers = customersData?.data || [];
    const sales = salesData?.data || [];

    const createJobMutation = useMutation({
        mutationFn: (data: any) => api().post("jobs", { json: data }).json(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
        },
        onError: (error) => {
            error.response.json().then((err) => console.log("err", err));
        },
    });

    useEffect(() => {
        if (createJobMutation.error) {
            getApiErrorMessage(createJobMutation.error).then(setError);
        }
    }, [createJobMutation.error, setError]);

    const onSubmit = (data: JobForm) => {
        const requestBody = {
            type: data.jobType,
            contract_type: data.contractType,
            sales: data.sales,
            customer_id: data.customer,
            po_number: data.poNumber,
            spk_number: data.spkNumber,
            start_date: data.dateRange.from,
            end_date: data.dateRange.to,
            monthly_contract_value: data.contractType === "project" ? data.monthlyContractValue : null,
            total_contract_value: data.totalContract,
            number_of_visit_per_month: data.contractType === "project" ? data.monthlyVisit : null,
            pic_name: data.picName,
            pic_phone: data.picPhone,
            pic_finance_name: data.picFinanceName,
            pic_finance_phone: data.picFinancePhone,
            reference: data.reference,
        };

        console.log("requestBody", requestBody);
        createJobMutation.mutate(requestBody);
        navigate({ from: "/sales/job/create", to: "/sales/job" });
    };

    return (
        <>
            <button
                onClick={() => router.history.back()}
                className="flex items-center gap-3 mb-6 text-sm text-gray-600 dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft size={16} className="transition-all group-hover:-translate-x-1" />
                Kembali
            </button>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold dark:text-gray-300">Tambah Pekerjaan</h1>
                <p className="text-gray-700 dark:text-gray-400">Silakan isi data pekerjaan dengan lengkap dan benar.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Tipe Pekerjaan & Tipe Kontrak */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Controller
                        name="jobType"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup
                                size="sm"
                                label="Tipe Pekerjaan"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                            >
                                <Radio value="pest_control">Pest Control</Radio>
                                <Radio value="termite_control">Termite Control</Radio>
                            </RadioGroup>
                        )}
                    />
                    <Controller
                        name="contractType"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup
                                size="sm"
                                label="Tipe Kontrak"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                            >
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
                        render={({ field }) => (
                            <Combobox
                                value={field.value}
                                onValueChange={field.onChange}
                                data={customers}
                                className="max-w-xs"
                            />
                        )}
                    />
                    {errors.customer && <p className="mt-1 text-xs text-red-500">{errors.customer.message}</p>}
                </div>
                {/* Nomor PO & SPK */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="poNumber">Nomor PO</Label>
                        <Controller
                            name="poNumber"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="Nomor PO" />}
                        />
                        {errors.poNumber && <p className="mt-1 text-xs text-red-500">{errors.poNumber.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="spkNumber">Nomor SPK</Label>
                        <Controller
                            name="spkNumber"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="Nomor SPK" />}
                        />
                        {errors.spkNumber && <p className="mt-1 text-xs text-red-500">{errors.spkNumber.message}</p>}
                    </div>
                </div>
                {/* Date Range Picker */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="dateRange">Rentang Tanggal</Label>
                        <Controller
                            name="dateRange"
                            control={control}
                            render={({ field }) => (
                                <DatePickerWithRange value={field.value} onChange={field.onChange} />
                            )}
                        />
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
                                render={({ field }) => (
                                    <Input {...field} type="number" placeholder="Nilai Kontrak Bulanan" />
                                )}
                            />
                            {errors.monthlyContractValue && (
                                <p className="mt-1 text-xs text-red-500">{errors.monthlyContractValue.message}</p>
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="totalContract">Total Kontrak</Label>
                        <Controller
                            name="totalContract"
                            control={control}
                            render={({ field }) => <Input {...field} type="number" placeholder="Total Kontrak" />}
                        />
                        {errors.totalContract && (
                            <p className="mt-1 text-xs text-red-500">{errors.totalContract.message}</p>
                        )}
                    </div>
                </div>
                {/* Jumlah Kunjungan per Bulan */}
                {contractType === "project" && (
                    <div className="space-y-2">
                        <Label htmlFor="monthlyVisit">Jumlah Kunjungan per Bulan</Label>
                        <Controller
                            name="monthlyVisit"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="number"
                                    placeholder="Jumlah Kunjungan per Bulan"
                                    className="max-w-xs"
                                />
                            )}
                        />
                        {errors.monthlyVisit && (
                            <p className="mt-1 text-xs text-red-500">{errors.monthlyVisit.message}</p>
                        )}
                    </div>
                )}
                {/* PIC & PIC Finance */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="picName">Nama PIC</Label>
                        <Controller
                            name="picName"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="Nama PIC" />}
                        />
                        {errors.picName && <p className="mt-1 text-xs text-red-500">{errors.picName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="picPhone">Nomor HP PIC</Label>
                        <Controller
                            name="picPhone"
                            control={control}
                            render={({ field }) => <Input {...field} type="number" placeholder="Nomor HP PIC" />}
                        />
                        {errors.picPhone && <p className="mt-1 text-xs text-red-500">{errors.picPhone.message}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="picFinanceName">Nama PIC Finance</Label>
                        <Controller
                            name="picFinanceName"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="Nama PIC Finance" />}
                        />
                        {errors.picFinanceName && (
                            <p className="mt-1 text-xs text-red-500">{errors.picFinanceName.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="picFinancePhone">Nomor HP PIC Finance</Label>
                        <Controller
                            name="picFinancePhone"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} type="number" placeholder="Nomor HP PIC Finance" />
                            )}
                        />
                        {errors.picFinancePhone && (
                            <p className="mt-1 text-xs text-red-500">{errors.picFinancePhone.message}</p>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="customer">Nama Sales</Label>
                    <Controller
                        name="sales"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                value={field.value}
                                onValueChange={field.onChange}
                                data={sales}
                                className="max-w-xs"
                            />
                        )}
                    />
                    {errors.sales && <p className="mt-1 text-xs text-red-500">{errors.sales.message}</p>}
                </div>
                {/* Referensi */}
                <div className="space-y-2">
                    <Controller
                        name="reference"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup
                                size="sm"
                                label="Referensi"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                            >
                                <Radio value="creative_lead">Creative Lead</Radio>
                                <Radio value="office_lead">Office Lead</Radio>
                                <Radio value="employed_lead">Employed Lead</Radio>
                            </RadioGroup>
                        )}
                    />
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col justify-end gap-4 sm:flex-row">
                    <Button
                        type="button"
                        onClick={() => router.history.back()}
                        variant="destructive"
                        className="hover:bg-red-600 active:scale-95"
                    >
                        Batalkan
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        variant="default"
                        className="hover:bg-gray-900 active:scale-95"
                    >
                        Simpan
                    </Button>
                </div>
            </form>
        </>
    );
}

export default RouteComponent;
