import { createFileRoute, Link, Navigate, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit } from "lucide-react";
import { api, convertSnakeToTitleCase, formatToRupiah, getApiErrorMessage, canAccess } from "@/lib/utils";
import { useState } from "react";
import { ArrowLeft } from "iconsax-react";
import { useAuth } from "@/hooks/useAuth";
import { JobScheduleContainer } from "@/components/job/JobScheduleContainer";
import { Schedule } from "@/types/types";
import { DocumentUpload } from "@/components/job/DocumentUpload";
import { StatusChangeButton } from "@/components/job/StatusChangeButton";
import { Status } from "@/components/job/StatusChangeButton";

export const Route = createFileRoute("/_layout/sales_/job_/$job_id")({
    component: RouteComponent,
    loader: async ({ params }) => {
        try {
            const { data } = await api()
                .get("jobs/" + params.job_id)
                .json<any>();
            return data;
        } catch (error) {
            const errorMessage = await getApiErrorMessage(error);
            throw new Error(errorMessage.message);
        }
    },
});

function RouteComponent() {
    const { auth } = useAuth();

    if (!canAccess(["Sales", "Superadmin", "Manager Sales"], auth?.user.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    const router = useRouter();
    const job = Route.useLoaderData();
    const [activeTab, setActiveTab] = useState("general");
    const [schedules, setSchedules] = useState<Schedule[]>(job.schedules);

    // Schedule update handlers
    const handleScheduleCreate = (newSchedule: Schedule) => {
        setSchedules(prev => [...prev, newSchedule]);
    };

    const handleScheduleUpdate = (updatedSchedule: Schedule) => {
        setSchedules(prev =>
            prev.map(schedule => schedule.id === updatedSchedule.id ? updatedSchedule : schedule)
        );
    };

    const handleScheduleDelete = (deletedId: number) => {
        setSchedules(prev => prev.filter(schedule => schedule.id !== deletedId));
    };

    const handleScheduleBulkDelete = (deletedIds: number[]) => {
        setSchedules(prev => prev.filter(schedule => !deletedIds.includes(schedule.id)));
    };

    console.log("job", job);
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
                    <StatusChangeButton status={convertSnakeToTitleCase(job.status) as Status} id={job.id} />

                    <Link from="/sales/job/$job_id" to="/sales/job/edit/$job_id" params={{ job_id: String(job.id) }}>
                        <Button variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 w-full border-b rounded-none h-12 bg-transparent p-0 justify-start">
                    <TabsTrigger
                        value="general"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none h-12 px-6"
                    >
                        Informasi Umum
                    </TabsTrigger>
                    <TabsTrigger
                        value="documents"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none h-12 px-6"
                    >
                        Dokumen
                    </TabsTrigger>
                    <TabsTrigger
                        value="schedule"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none h-12 px-6"
                    >
                        Jadwal
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-200 flex md:flex-row flex-col gap-4">
                        <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600 h-fit">
                            <div className="p-4 text-lg font-semibold">Informasi Pelanggan</div>

                            <div className="border-b border-gray-200 dark:border-gray-600 my4"></div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Nama</div>
                                <div className="flex-1">{job.customer.name}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Tipe</div>
                                <div className="flex-1">{convertSnakeToTitleCase(job.customer.type)}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">No HP</div>
                                <div className="flex-1">{job.customer.phone}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">NIK / NPWP</div>
                                <div className="flex-1">{job.customer.nik || job.customer.npwp}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Alamat KTP / NPWP</div>
                                <div className="flex-1">{job.customer.ktp_address || job.customer.npwp_address}</div>
                            </div>

                            <div className="flex p-4">
                                <div className="w-40 font-medium">Alamat Saat Ini</div>
                                <div className="flex-1">{job.customer.address}</div>
                            </div>
                        </div>

                        <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600 h-fit">
                            <div className="p-4 text-lg font-semibold">Informasi Pekerjaan</div>

                            <div className="border-b border-gray-200 dark:border-gray-600 my4"></div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Tipe Pekerjaan</div>
                                <div className="flex-1">{convertSnakeToTitleCase(job.type)}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Tipe Kontrak</div>
                                <div className="flex-1">{convertSnakeToTitleCase(job.contract_type)}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Nomor PO</div>
                                <div className="flex-1">{job.po_number}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Nomor SPK</div>
                                <div className="flex-1">{job.spk_number}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Rentang Tanggal</div>
                                <div className="flex-1">
                                    {job.start_date} - {job.end_date}
                                </div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Total Kontrak</div>
                                <div className="flex-1">{formatToRupiah(job.total_contract_value)}</div>
                            </div>

                            {job.type === "project" && (
                                <>
                                    <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                        <div className="w-40 font-medium">Nilai Kontrak Bulanan</div>
                                        <div className="flex-1">{formatToRupiah(job.monthly_contract_value)}</div>
                                    </div>
                                    <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                        <div className="w-40 font-medium">Jumlah Kunjungan per Bulan</div>
                                        <div className="flex-1">{job.number_of_visit_per_month} kali</div>
                                    </div>
                                </>
                            )}

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Nama PIC</div>
                                <div className="flex-1">{job.pic_name}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">No HP PIC</div>
                                <div className="flex-1">{job.pic_phone}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Nama PIC Finance</div>
                                <div className="flex-1">{job.pic_finance_name}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">No HP PIC Finance</div>
                                <div className="flex-1">{job.pic_finance_phone}</div>
                            </div>

                            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-40 font-medium">Nama Sales</div>
                                <div className="flex-1">{job.sales.name}</div>
                            </div>

                            <div className="flex p-4">
                                <div className="w-40 font-medium">Tipe Referensi</div>
                                <div className="flex-1">{convertSnakeToTitleCase(job.reference)}</div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                    <DocumentUpload job={job} />
                </TabsContent>

                <TabsContent value="schedule" className="mt-4">
                    <JobScheduleContainer
                        jobId={job.id}
                        schedules={schedules}
                        onCreateSchedule={handleScheduleCreate}
                        onUpdateSchedule={handleScheduleUpdate}
                        onDeleteSchedule={handleScheduleDelete}
                        onBulkDeleteSchedules={handleScheduleBulkDelete}
                    />
                </TabsContent>
            </Tabs>
        </>
    );
}