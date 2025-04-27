import { useState, useEffect } from "react";
import { UseFormSetValue, UseFormWatch, FieldValues, Path } from "react-hook-form";

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const IMAGE_BASE_URL = import.meta.env.VITE_API_URL + "/storage/";
export const PLACEHOLDER_IMAGE = "https://placehold.co/300x200";

interface UseImageUploadProps<T extends FieldValues> {
    setValue: UseFormSetValue<T>;
    watch: UseFormWatch<T>;
    imageField: Path<T>;
    imageFileField: Path<T>;
    defaultImageUrl?: string;
}

export function useImageUpload<T extends FieldValues>({
    setValue,
    watch,
    imageField,
    imageFileField,
    defaultImageUrl,
}: UseImageUploadProps<T>) {
    const [isLocalImage, setIsLocalImage] = useState<boolean>(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const imageUrl = watch(imageField);
    const imageFile = watch(imageFileField);

    // Initialize preview if default image URL exists
    useEffect(() => {
        if (defaultImageUrl && !imagePreview) {
            setImagePreview(defaultImageUrl);
            setIsLocalImage(false);
        }

        if (imageUrl && !imagePreview) {
            setImagePreview(imageUrl as string);
            setIsLocalImage(false);
        }
    }, [defaultImageUrl, imageUrl, imagePreview]);

    // Clean up preview URL when component unmounts
    useEffect(() => {
        return () => {
            if (imagePreview && isLocalImage) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview, isLocalImage]);

    const handleFileUpload = (file: File) => {
        if (file.type.startsWith('image/')) {
            setValue(imageFileField, file as any, { shouldValidate: true });

            // Revoke previous blob URL to avoid memory leaks
            if (imagePreview && isLocalImage) {
                URL.revokeObjectURL(imagePreview);
            }

            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setIsLocalImage(true); // Mark as local image (blob URL)
            setValue(imageField, "" as any, { shouldValidate: true }); // Clear the URL field as we're using a file
        }
    };

    const removeUploadedFile = () => {
        // If it's a local image (blob URL), revoke it
        if (isLocalImage && imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setValue(imageFileField, undefined as any, { shouldValidate: true });
        setValue(imageField, "" as any, { shouldValidate: true });
        setImagePreview(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            handleFileUpload(file);
            e.dataTransfer.clearData();
        }
    };

    // Helper to get the correct image URL for preview
    const getImagePreviewUrl = () => {
        if (!imagePreview) return PLACEHOLDER_IMAGE;

        // If it's a local file (blob URL), use it directly
        if (isLocalImage) {
            return imagePreview;
        }

        // If it's a server path, prepend the base URL
        return imagePreview.startsWith('http') ? imagePreview : `${IMAGE_BASE_URL}${imagePreview}`;
    };

    return {
        isLocalImage,
        imagePreview,
        isDraggingOver,
        handleFileUpload,
        removeUploadedFile,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        getImagePreviewUrl,
    };
} 