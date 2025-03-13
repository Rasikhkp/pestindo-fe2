import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    Check,
    Edit,
    Upload,
    Eye,
    Trash2,
    X,
    Handshake as FileHandshake,
    FileSpreadsheet,
    ClipboardList,
    Contact as FileContract,
    FileText,
    Receipt,
} from "lucide-react";
import { api, cn, convertSnakeToTitleCase, formatToRupiah, getAuthToken } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ArrowLeft } from "iconsax-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_layout/sales_/job_/$job_id")({
    component: RouteComponent,
    loader: async ({ params }) => {
        const { data } = await api()
            .get("jobs/" + params.job_id)
            .json<any>();
        return data;
    },
});

function RouteComponent() {
    const router = useRouter();

    const job = Route.useLoaderData();
    return (
        <>
            <button
                onClick={() => router.history.back()}
                className="flex items-center gap-3 mb-8 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft size={16} className="transition-all group-hover:-translate-x-1" /> Kembali
            </button>

            <div className="flex items-center justify-between">
                <div>
                    <div className="my-2 text-xl font-medium dark:text-gray-300">Kode Pekerjaan #{job.code}</div>
                    <div className="mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">Detail Informasi Pekerjaan</div>
                </div>
                <div className="flex items-center gap-4">
                    <StatusChangeButton />
                    <Button variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 ">
                <CustomerInformation customer={job.customer} />
                <JobInformation job={job} />
                <DocumentUpload job={job} />
            </div>
        </>
    );
}

function CustomerInformation({ customer }: any) {
    return (
        <Card className="border border-gray-200 shadow-none dark:border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 text-gray-600 dark:text-gray-200">
                <CardTitle className="text-xl font-semibold">Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Nama</p>
                        <p>{customer.name}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Tipe</p>
                        <p>{convertSnakeToTitleCase(customer.type)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">No HP</p>
                        <p>{customer.phone}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">NIK / NPWP</p>
                        <p>{customer.nik || customer.npwp}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Alamat KTP / NPWP</p>
                        <p>{customer.ktp_address || customer.npwp_address}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Alamat Saat Ini</p>
                        <p>{customer.address}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function JobInformation({ job }: { job: any }) {
    return (
        <Card className="border border-gray-200 shadow-none dark:border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 text-gray-600 dark:text-gray-200">
                <CardTitle className="text-xl font-semibold">Informasi Pekerjaan</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Tipe Pekerjaan</p>
                        <p>{convertSnakeToTitleCase(job.type)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Tipe Kontrak</p>
                        <p>{convertSnakeToTitleCase(job.contract_type)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Nomor PO</p>
                        <p>{job.po_number}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Nomor SPK</p>
                        <p>{job.spk_number}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Rentang Tanggal</p>
                        <p>
                            {job.start_date} - {job.end_date}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Kontrak</p>
                        <p>{formatToRupiah(job.total_contract_value)}</p>
                    </div>
                    {job.type === "project" && (
                        <>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Nilai Kontrak Bulanan</p>
                                <p>{formatToRupiah(job.monthly_contract_value)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Jumlah Kunjungan per Bulan</p>
                                <p>{job.number_of_visit_per_month} kali</p>
                            </div>
                        </>
                    )}
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Nama PIC</p>
                        <p>{job.pic_name}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">No HP PIC</p>
                        <p>{job.pic_phone}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Nama PIC Finance</p>
                        <p>{job.pic_finance_name}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">No HP PIC Finance</p>
                        <p>{job.pic_finance_phone}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Nama Sales</p>
                        <p>{job.sales_name}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Tipe Referensi</p>
                        <p>{convertSnakeToTitleCase(job.reference)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

type JobType = {
    id: number;
    service_agreement_file?: string | null;
    spk_file?: string | null;
    form_survey_file?: string | null;
    mou_file?: string | null;
    proposal_file?: string | null;
    po_file?: string | null;
};

type DocumentUploadProps = {
    job: JobType;
};

type DocumentItemProps = {
    jobId: number;
    documentKey: keyof JobType; // e.g. "service_agreement_file"
    label: string;
    Icon: any;
    initialUrl?: string | null;
};

const DocumentItem = ({ jobId, documentKey, label, Icon, initialUrl }: DocumentItemProps) => {
    const [url, setUrl] = useState<string | null>(initialUrl || null);

    const { mutate } = useMutation({
        mutationFn: async ({ file }: { file: File | null }) => {
            const formData = new FormData();
            formData.append("_method", "PUT");
            // Remove "_file" from the key to derive the form field name.
            const formKey = (documentKey as string).replace("_file", "");
            if (file) {
                formData.append(formKey, file);
            } else {
                formData.append(formKey, ""); // For deletion, send an empty value.
            }
            const res = await fetch(`http://localhost:8000/api/jobs/${jobId}`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: "Bearer " + getAuthToken(),
                },
                body: formData,
            });
            const data = await res.json();
            return data;
        },
        onSuccess: (data) => {
            toast.success("Dokumen berhasil diperbarui");
            const newUrl = data.data[documentKey] ?? null;
            setUrl(newUrl);
            console.log(`Updated ${documentKey}:`, newUrl);
        },
        onError: (error) => {
            toast.error("Gagal memperbarui dokumen");
            console.error("Upload error:", error);
        },
    });

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        if (file) {
            mutate({ file });
        }
    };

    const handleDelete = () => {
        mutate({ file: null });
    };

    return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 font-medium text-gray-700">
                    <Icon className="text-blue-600" size={20} />
                    {label}
                </h3>
                {url ? (
                    <span className="flex items-center text-green-600">
                        <Check size={16} className="mr-1" />
                        <span className="text-sm">Uploaded</span>
                    </span>
                ) : (
                    <span className="flex items-center text-red-600">
                        <X size={16} className="mr-1" />
                        <span className="text-sm">Not uploaded</span>
                    </span>
                )}
            </div>
            {url ? (
                <div className="flex items-center space-x-2">
                    <a
                        href={url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                        <Eye size={16} className="mr-1.5" />
                        View
                    </a>
                    <button
                        onClick={handleDelete}
                        className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <Trash2 size={16} className="mr-1.5" />
                        Delete
                    </button>
                </div>
            ) : (
                <label className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors w-full justify-center cursor-pointer">
                    <Upload size={16} className="mr-1.5" />
                    Upload
                    <input type="file" className="hidden" onChange={handleUpload} />
                </label>
            )}
        </div>
    );
};

const DocumentUpload = ({ job: initialJob }: DocumentUploadProps) => {
    // Here we don't maintain a global "job" state.
    // Each DocumentItem manages its own state based on the initial value.
    const documents = [
        { key: "service_agreement_file", label: "Service Agreement", icon: FileHandshake },
        { key: "spk_file", label: "SPK", icon: FileSpreadsheet },
        { key: "form_survey_file", label: "Form Survey", icon: ClipboardList },
        { key: "mou_file", label: "MOU", icon: FileContract },
        { key: "proposal_file", label: "Proposal", icon: FileText },
        { key: "po_file", label: "PO", icon: Receipt },
    ] as const;

    return (
        <Card className="border border-gray-200 shadow-none dark:border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 text-gray-600 dark:text-gray-200">
                <CardTitle className="text-xl font-semibold">Dokumen Pendukung</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map(({ key, label, icon: Icon }) => (
                        <DocumentItem
                            key={key}
                            jobId={initialJob.id}
                            documentKey={key}
                            label={label}
                            Icon={Icon}
                            initialUrl={initialJob[key] || null}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

function DocumentCard({ document }: any) {
    return (
        <div className={`border rounded-lg p-4 flex flex-col ${document.uploaded ? "bg-muted/30" : "border-dashed"}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                    <FileText
                        className={`h-5 w-5 mr-2 ${document.uploaded ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium">{document.name}</span>
                </div>
                {document.uploaded ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <Check className="w-3 h-3 mr-1" />
                        Uploaded
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Required
                    </Badge>
                )}
            </div>

            {document.uploaded ? (
                <div className="flex items-center justify-between pt-2 mt-auto">
                    <span className="text-xs text-muted-foreground">{document.date}</span>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                        View
                    </Button>
                </div>
            ) : (
                <Button variant="outline" size="sm" className="mt-auto">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                </Button>
            )}
        </div>
    );
}

type Status = "Pending" | "On Progress" | "Completed" | "Cancelled";

interface StatusConfig {
    label: Status;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
}

const statusConfigs: Record<Status, StatusConfig> = {
    Pending: {
        label: "Pending",
        icon: Clock,
        color: "text-yellow-700 dark:text-yellow-500",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
    },
    "On Progress": {
        label: "On Progress",
        icon: AlertCircle,
        color: "text-blue-700 dark:text-blue-500",
        bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    Completed: {
        label: "Completed",
        icon: CheckCircle2,
        color: "text-green-700 dark:text-green-500",
        bgColor: "bg-green-50 dark:bg-green-950/50",
    },
    Cancelled: {
        label: "Cancelled",
        icon: XCircle,
        color: "text-red-700 dark:text-red-500",
        bgColor: "bg-red-50 dark:bg-red-950/50",
    },
};

export function StatusChangeButton() {
    const [currentStatus, setCurrentStatus] = useState<Status>("Pending");
    const [targetStatus, setTargetStatus] = useState<Status | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Mock document upload status
    const allDocumentsUploaded = false;

    const currentConfig = statusConfigs[currentStatus];

    const handleStatusChange = (newStatus: Status) => {
        setTargetStatus(newStatus);
        setTimeout(() => {
            setDialogOpen(true);
        }, 100);
    };

    const confirmStatusChange = () => {
        if (targetStatus) {
            setCurrentStatus(targetStatus);
            setDialogOpen(false);
            setTargetStatus(null);
        }
    };

    const CurrentIcon = currentConfig.icon;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "min-w-[140px] transition-all duration-200",
                            currentConfig.bgColor,
                            currentConfig.color,
                        )}
                    >
                        <CurrentIcon className="w-4 h-4 mr-2" />
                        {currentStatus}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    {Object.entries(statusConfigs).map(([status, config], i) => {
                        const Icon = config.icon;
                        return (
                            <DropdownMenuItem
                                key={i}
                                className={cn(
                                    "flex items-center py-2 cursor-pointer transition-colors",
                                    status === currentStatus && "bg-muted",
                                    config.color,
                                )}
                                onClick={() => handleStatusChange(status as Status)}
                                disabled={status === currentStatus}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                <span>{status}</span>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {targetStatus && (
                                <>
                                    {(() => {
                                        const Icon = statusConfigs[targetStatus].icon;
                                        return <Icon className={cn("w-5 h-5", statusConfigs[targetStatus].color)} />;
                                    })()}
                                    Change Status to {targetStatus}
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to change the status from{" "}
                            <span className={currentConfig.color}>{currentStatus}</span> to{" "}
                            <span className={targetStatus ? statusConfigs[targetStatus].color : ""}>
                                {targetStatus}
                            </span>
                            ?
                        </DialogDescription>
                    </DialogHeader>

                    {targetStatus === "On Progress" && !allDocumentsUploaded && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="w-4 h-4" />
                            <AlertTitle>Document Completion Required</AlertTitle>
                            <AlertDescription>
                                Before proceeding to "On Progress" status, please ensure all required documents have
                                been uploaded and verified. This step is necessary to maintain compliance and ensure
                                proper project documentation.
                            </AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmStatusChange}
                            disabled={targetStatus === "On Progress" && !allDocumentsUploaded}
                            className={cn(
                                "transition-all duration-200",
                                targetStatus && statusConfigs[targetStatus].bgColor,
                                targetStatus && statusConfigs[targetStatus].color,
                            )}
                        >
                            Confirm Change
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
