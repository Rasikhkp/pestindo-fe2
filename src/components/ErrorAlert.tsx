import { useEffect, useState } from "react";
import { Alert } from "@heroui/alert";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";

export default function ErrorAlert() {
    const [error, setError] = useAtom(errorAtom);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (error) {
            setIsVisible(true);
        }
    }, [error]);

    const handleClose = () => {
        setIsVisible(false);
        // Use setTimeout to prevent state updates during render
        setTimeout(() => {
            setError(null);
        }, 0);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            setIsVisible(false);
            setError(null);
        };
    }, [setError]);

    if (!isVisible) return null;

    return (
        <div className="fixed z-[99] bg-blue-400 top-2 left-1/2 -translate-x-1/2">
            <Alert
                color="danger"
                description={error?.message || "An error occurred"}
                title="Error Alert"
                variant="solid"
                endContent={
                    <Button
                        onClick={handleClose}
                        variant="destructive"
                        className="transition-all duration-200 hover:bg-red-600 active:bg-red-700"
                    >
                        Close
                    </Button>
                }
                className="fixed z-[99] -translate-x-1/2 min-w-[500px] whitespace-nowrap top-5 left-1/2"
            />
        </div>
    );
} 