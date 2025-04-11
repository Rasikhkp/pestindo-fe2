import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { Check, Eye, Loader, Trash2, Upload, X } from 'lucide-react'
import {
    Handshake as FileHandshake,
    FileSpreadsheet,
    ClipboardList,
    Contact as FileContract,
    FileText,
    Receipt
} from 'lucide-react'
import { getAuthToken } from '@/lib/utils'

type JobType = {
    id: number
    service_agreement_file?: string | null
    spk_file?: string | null
    form_survey_file?: string | null
    mou_file?: string | null
    proposal_file?: string | null
    po_file?: string | null
}

type DocumentUploadProps = {
    job: JobType
}

type DocumentItemProps = {
    jobId: number
    documentKey: keyof JobType // e.g. "service_agreement_file"
    label: string
    Icon: any
    initialUrl?: string | null
}

const DocumentItem = ({
    jobId,
    documentKey,
    label,
    Icon,
    initialUrl,
}: DocumentItemProps) => {
    const [url, setUrl] = useState<string | null>(initialUrl || null)

    const { mutate, isPending } = useMutation({
        mutationFn: async ({ file }: { file: File | null }) => {
            const formData = new FormData()
            formData.append('_method', 'PUT')
            // Remove "_file" from the key to derive the form field name.
            const formKey = (documentKey as string).replace('_file', '')
            if (file) {
                formData.append(formKey, file)
            } else {
                formData.append(formKey, '') // For deletion, send an empty value.
            }
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/${jobId}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer ' + getAuthToken(),
                },
                body: formData,
            })
            const data = await res.json()
            return data
        },
        onSuccess: (data) => {
            const newUrl = data.data[documentKey] ?? null
            setUrl(newUrl)
            console.log(`Updated ${documentKey}:`, newUrl)
            if (newUrl) {
                toast.success('Dokumen berhasil diunggah')
            } else {
                toast.success('Dokumen berhasil dihapus')
            }
        },
        onError: (error) => {
            toast.error('Gagal memperbarui dokumen')
            console.error('Upload error:', error)
        },
    })

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null
        if (file) {
            mutate({ file })
        }
    }

    const handleDelete = () => {
        mutate({ file: null })
    }

    return (
        <div className="p-4 bg-transparent border border-gray-200 rounded-lg dark:border-gray-600">
            <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                    <Icon className="text-blue-600" size={20} />
                    {label}
                </h3>
                {url ? (
                    <span className="flex items-center text-green-600">
                        <Check size={16} className="mr-1" />
                        <span className="text-sm">Sudah diunggah</span>
                    </span>
                ) : (
                    <span className="flex items-center text-red-600">
                        <X size={16} className="mr-1" />
                        <span className="text-sm">Belum diunggah</span>
                    </span>
                )}
            </div>
            {url ? (
                <div className="flex items-center space-x-2">
                    <a
                        href={url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors"
                    >
                        <Eye size={16} className="mr-1.5" />
                        Lihat
                    </a>
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
                    >
                        {isPending ? (
                            <Loader size={16} className="mr-1.5" />
                        ) : (
                            <Trash2 size={16} className="mr-1.5" />
                        )}
                        {isPending ? 'Menghapus...' : 'Hapus'}
                    </button>
                </div>
            ) : (
                <label className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors w-full justify-center cursor-pointer">
                    {isPending ? (
                        <Loader size={16} className="mr-1.5" />
                    ) : (
                        <Upload size={16} className="mr-1.5" />
                    )}
                    {isPending ? 'Mengunggah...' : 'Unggah'}
                    <input
                        type="file"
                        className="hidden"
                        disabled={isPending}
                        onChange={handleUpload}
                    />
                </label>
            )}
        </div>
    )
}

export const DocumentUpload = ({ job: initialJob }: DocumentUploadProps) => {
    // Here we don't maintain a global "job" state.
    // Each DocumentItem manages its own state based on the initial value.
    const documents = [
        {
            key: 'service_agreement_file',
            label: 'Service Agreement',
            icon: FileHandshake,
        },
        { key: 'spk_file', label: 'SPK', icon: FileSpreadsheet },
        { key: 'form_survey_file', label: 'Form Survey', icon: ClipboardList },
        { key: 'mou_file', label: 'MOU', icon: FileContract },
        { key: 'proposal_file', label: 'Proposal', icon: FileText },
        { key: 'po_file', label: 'PO', icon: Receipt },
    ] as const

    return (
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
    )
} 