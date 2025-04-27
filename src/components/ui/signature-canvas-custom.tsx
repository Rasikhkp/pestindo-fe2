import { forwardRef, useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface SignatureCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
    onSignatureChange?: (signature: File | null, dataUrl?: string) => void
    label?: string
}

export const SignatureCanvasCustom = forwardRef<HTMLDivElement, SignatureCanvasProps>(
    ({ className, onSignatureChange, label, ...props }, ref) => {
        const signatureRef = useRef<SignatureCanvas>(null)
        const [isSigned, setIsSigned] = useState(false)

        const handleClear = () => {
            if (signatureRef.current) {
                signatureRef.current.clear()
                setIsSigned(false)
                onSignatureChange?.(null)
            }
        }

        const dataURLtoFile = (dataurl: string, filename: string): File => {
            // Convert the data URL to a Blob
            const arr = dataurl.split(',')
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
            const bstr = atob(arr[1])
            let n = bstr.length
            const u8arr = new Uint8Array(n)

            while (n--) {
                u8arr[n] = bstr.charCodeAt(n)
            }

            // Create a File from the Blob
            return new File([u8arr], filename, { type: mime })
        }

        const handleEnd = () => {
            if (signatureRef.current && !signatureRef.current.isEmpty()) {
                // Get the signature as a data URL
                const signatureDataUrl = signatureRef.current.toDataURL("image/png")

                // Create a filename with timestamp to ensure uniqueness
                const timestamp = new Date().getTime()
                const filename = `signature_${timestamp}.png`

                // Convert data URL to a File object
                const signatureFile = dataURLtoFile(signatureDataUrl, filename)

                setIsSigned(true)
                onSignatureChange?.(signatureFile, signatureDataUrl)
            }
        }

        return (
            <div ref={ref} className={cn("space-y-2", className)} {...props}>
                {label && <p className="text-sm font-medium mb-1">{label}</p>}
                <div className="border rounded-md bg-white overflow-hidden">
                    <SignatureCanvas
                        ref={signatureRef}
                        onEnd={handleEnd}
                        canvasProps={{
                            className: "w-full h-48",
                            style: {
                                maxWidth: "100%",
                                touchAction: "none",
                            },
                        }}
                        backgroundColor="white"
                        penColor="black"
                        velocityFilterWeight={0.7} // Higher value = more smoothing
                    />
                </div>
                <div className="flex justify-end pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClear}
                        disabled={!isSigned}
                    >
                        Clear
                    </Button>
                </div>
            </div>
        )
    }
)

SignatureCanvasCustom.displayName = "SignatureCanvasCustom" 