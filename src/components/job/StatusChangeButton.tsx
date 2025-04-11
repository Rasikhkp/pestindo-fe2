import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'

export type Status = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'

interface StatusConfig {
    label: Status
    icon: React.ComponentType<{ className?: string }>
    key: string
}

const statusConfigs: Record<Status, StatusConfig> = {
    Pending: {
        label: 'Pending',
        key: 'pending',
        icon: Clock,
    },
    'In Progress': {
        label: 'In Progress',
        key: 'in_progress',
        icon: AlertCircle,
    },
    Completed: {
        label: 'Completed',
        key: 'completed',
        icon: CheckCircle2,
    },
    Cancelled: {
        label: 'Cancelled',
        key: 'cancelled',
        icon: XCircle,
    },
}

export function StatusChangeButton({
    status,
    id,
}: {
    status: Status
    id: number
}) {
    const [currentStatus, setCurrentStatus] = useState<Status>(status)
    const [targetStatus, setTargetStatus] = useState<Status | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const currentConfig = statusConfigs[currentStatus]

    const handleStatusChange = (newStatus: Status) => {
        setTargetStatus(newStatus)
        setTimeout(() => {
            setDialogOpen(true)
        }, 100)
    }

    const confirmStatusChange = async () => {
        setIsLoading(true)
        if (!targetStatus) return
        try {
            await api()
                .patch(`jobs/${id}`, {
                    json: { status: statusConfigs[targetStatus].key },
                })
                .json()

            setCurrentStatus(targetStatus)
            setDialogOpen(false)
            setTargetStatus(null)
        } catch (e: any) {
            console.error(await e.response.json())
        } finally {
            setIsLoading(false)
        }
    }

    const CurrentIcon = currentConfig.icon

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="min-w-[140px] transition-all duration-200"
                    >
                        <CurrentIcon className="w-4 h-4 mr-2" />
                        {currentStatus}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    {Object.entries(statusConfigs).map(([statusKey, config]) => {
                        const Icon = config.icon
                        return (
                            <DropdownMenuItem
                                key={config.key}
                                className="flex items-center py-2 transition-colors cursor-pointer"
                                onClick={() => handleStatusChange(statusKey as Status)}
                                disabled={statusKey === currentStatus}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                <span>{statusKey}</span>
                            </DropdownMenuItem>
                        )
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
                                        const Icon = statusConfigs[targetStatus].icon
                                        return <Icon className="w-5 h-5" />
                                    })()}{' '}
                                    Ubah status ke {targetStatus}
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Yakin ubah status dari {currentStatus} ke {targetStatus}?
                        </DialogDescription>
                    </DialogHeader>

                    {targetStatus === 'In Progress' && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="w-4 h-4" />
                            <AlertTitle>Dokumen Belum Lengkap</AlertTitle>
                            <AlertDescription>
                                Pastikan dokumen lengkap sebelum melanjutkan.
                            </AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={confirmStatusChange}
                            disabled={isLoading}
                            className="transition-all duration-200"
                        >
                            {isLoading ? 'Mengupdate...' : 'Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
} 