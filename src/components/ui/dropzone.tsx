import type React from "react"

import { cn } from "@/lib/utils"
import { Upload, X } from "lucide-react"
import { useCallback, useState } from "react"

interface DropzoneProps {
    onDrop: (files: File[]) => void
    files: { url: string; alt: string }[]
    onRemove: (index: number) => void
    className?: string
    id?: string
}

export function Dropzone({ onDrop, files, onRemove, className, id = "file-upload" }: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const inputId = `file-upload-${id}`

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)

            const droppedFiles = Array.from(e.dataTransfer.files)
            if (droppedFiles.length > 0) {
                onDrop(droppedFiles)
            }
        },
        [onDrop],
    )

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                onDrop(Array.from(e.target.files))
                // Reset the input value so the same file can be selected again
                e.target.value = ""
            }
        },
        [onDrop],
    )

    return (
        <div className={className}>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:bg-gray-50",
                )}
                onClick={() => document.getElementById(inputId)?.click()}
            >
                <input id={inputId} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="mb-2 h-8 w-8 text-gray-400" />
                    <p className="mb-1 text-sm font-medium">Drag & drop files disini, atau klik untuk memilih file</p>
                    <p className="text-xs text-gray-500">(Mendukung JPG, PNG, GIF)</p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mt-4 columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
                    {files.map((file, index) => (
                        <div key={index} className="break-inside-avoid relative w-full mb-4 overflow-hidden rounded-lg border">
                            <img src={file.url || "/placeholder.svg"} alt={file.alt} className="w-full h-auto object-contain" />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRemove(index)
                                }}
                                className="absolute p-2 right-2 top-2 hover:bg-black rounded-full bg-black/50 text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
