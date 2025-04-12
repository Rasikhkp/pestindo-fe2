import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ArrowDownLeft, ArrowUpRight, Clock, Loader2, Pencil, Trash2 } from "lucide-react"
import { cn, getApiErrorMessage } from "@/lib/utils"
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { DeleteDialog } from "@/components/DeleteDialog"
import { api } from "@/lib/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAtom } from "jotai"
import { errorAtom } from "@/store/error"

export interface RequestCardProps {
    id: number
    userName: string
    userId: string
    requestId: string
    dateTime: string
    items: Array<{
        name: string
        code: string
        amount: number
        unit: string
    }>
    status: "requested" | "approved" | "rejected" | "completed"
    type: "in" | "out"
    note?: string
    isTechnician?: boolean
    className?: string
}

const statusMap = {
    requested: { label: "Menunggu", color: "bg-amber-100 text-amber-800" },
    approved: { label: "Disetujui", color: "bg-green-100 text-green-800" },
    rejected: { label: "Ditolak", color: "bg-red-100 text-red-800" },
}

const typeMap = {
    in: { icon: ArrowDownLeft, label: "Masuk Gudang", color: "text-emerald-600" },
    out: { icon: ArrowUpRight, label: "Keluar Gudang", color: "text-rose-600" },
}

export default function RequestCard({
    id,
    userName = "John Smith",
    userId = "USR123",
    requestId = "REQ001",
    dateTime = "15 Maret 2024, 15:00",
    items = [],
    status = "requested",
    type = "out",
    note,
    isTechnician = false,
    className,
}: RequestCardProps) {
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const queryClient = useQueryClient();
    const [, setError] = useAtom(errorAtom);
    const navigate = useNavigate()

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => api().delete(`inventory-requests/${id}`).json(),
        onSuccess: () => {
            toast.success(`1 data berhasil dihapus`);
            queryClient.invalidateQueries({ queryKey: ["technician-requests"] });
            setIsDeleteDialogOpen(false)
        },
        onError: (error) => {
            getApiErrorMessage(error).then(message => {
                setError(message);
                toast.error(message.message || "Gagal menghapus");
            });
        },
    });

    const approveMutation = useMutation({
        mutationFn: (requestId: number) => {
            return api().patch(`inventory-requests/${requestId}/approve`).json();
        },
        onSuccess: () => {
            toast.success("Permintaan berhasil disetujui");
            queryClient.invalidateQueries({ queryKey: ['inventory-requests'] });
        },
        onError: (error) => {
            getApiErrorMessage(error).then(message => {
                setError(message);
                toast.error(message.message || "Gagal menyetujui permintaan");
            });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ requestId, note }: { requestId: number; note: string }) => {
            return api().patch(`inventory-requests/${requestId}/reject`, {
                json: { note }
            }).json();
        },
        onSuccess: () => {
            toast.success("Permintaan berhasil ditolak");
            queryClient.invalidateQueries({ queryKey: ['inventory-requests'] });
        },
        onError: (error) => {
            getApiErrorMessage(error).then(message => {
                setError(message);
                toast.error(message.message || "Gagal menolak permintaan");
            });
        }
    });

    const TypeIcon = typeMap[type].icon

    const handleDelete = () => {
        deleteMutation.mutate(id)
    }

    const handleApproveRequest = (requestId: number) => {
        approveMutation.mutate(requestId);
    };

    const handleRejectRequest = (requestId: number, note: string) => {
        rejectMutation.mutate({ requestId, note });
        setIsRejectDialogOpen(false)
        setRejectReason("")
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "requested":
                return "bg-yellow-500"
            case "approved":
                return "bg-blue-500"
            case "rejected":
                return "bg-red-500"
            case "completed":
                return "bg-green-500"
            default:
                return "bg-gray-500"
        }
    }

    return (
        <>
            <Card className={cn("overflow-hidden border shadow-sm", className)}>
                <CardHeader className="">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg whitespace-nowrap">{userName}</h3>
                            <Badge variant="outline" className="text-xs font-normal">
                                #{userId}
                            </Badge>
                        </div>
                        <Badge className={cn("font-normal", getStatusColor(status))} style={{ backgroundColor: getStatusColor(status) }}>
                            {statusMap[status as keyof typeof statusMap].label}
                        </Badge>
                    </div>


                    <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                        <span>#{requestId}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <Clock className="h-3.5 w-3.5" />
                        <span>{dateTime}</span>
                    </div>

                </CardHeader>
                <CardContent className="pb-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <TypeIcon className={cn("h-4 w-4", typeMap[type].color)} />
                            <span className={cn("text-sm font-medium", typeMap[type].color)}>{typeMap[type].label}</span>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Items:</h4>
                            <ul className="space-y-1.5">
                                {items.map((item, index) => (
                                    <li key={index} className="flex justify-between text-sm">
                                        <div>
                                            <span>{item.name}</span>
                                            <Badge variant="outline" className="text-xs font-normal ml-2">
                                                #{item.code}
                                            </Badge>
                                        </div>
                                        <span className="font-medium">
                                            {item.amount} {item.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {status === "rejected" && note && (
                            <div className="mt-3 pt-3 border-t">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Alasan penolakan:</h4>
                                <p className="text-sm text-red-600">{note}</p>
                            </div>
                        )}
                    </div>
                </CardContent>


                <CardFooter className="flex justify-end gap-2 pt-0">
                    {isTechnician && status === "requested" && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate({ to: `/technician/request/edit/${id}` })}
                            >
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                        </>
                    )}

                    {!isTechnician && status === "requested" && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsRejectDialogOpen(true)}
                            >
                                Tolak
                            </Button>
                            <Button
                                onClick={() => handleApproveRequest(id)}
                                disabled={approveMutation.isPending}
                            >
                                {approveMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : "Terima"}
                            </Button>
                        </>
                    )}
                </CardFooter>


            </Card>

            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Permintaan</DialogTitle>
                        <DialogDescription>
                            Silakan berikan alasan penolakan permintaan ini.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Masukkan alasan penolakan"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                    />
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                            Batalkan
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleRejectRequest(id, rejectReason)}
                            disabled={rejectMutation.isPending}
                        >
                            {rejectMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : "Tolak"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDelete}
                message="Apakah Anda yakin ingin menghapus request ini?"
                isPending={deleteMutation.isPending}
            />
        </>
    )
}