import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, DragEvent, useMemo, useEffect } from "react"
import { format, parseISO } from "date-fns";
import { CalendarIcon, ChevronDown, Edit, Filter, Plus, Trash2, X, Loader2 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, canAccess, getApiErrorMessage } from "@/lib/utils";
import { DeleteDialog } from "@/components/DeleteDialog";
import { useAuth } from "@/hooks/useAuth";
import { DetailedSelect, DetailedOption } from "@/components/ui/detailed-select";

// Constants
const IMAGE_BASE_URL = import.meta.env.VITE_API_URL + "/storage/";
const PLACEHOLDER_IMAGE = "/placeholder.svg";

// Types
interface Activity {
    id: number;
    employee_id: number;
    note: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm:ss
    created_at: string; // ISO 8601
    updated_at: string; // ISO 8601
    images: string[]; // Array of image paths
}

interface Employee {
    id: number;
    code: string;
    name: string;
    role_name: string;
    email: string;
    phone: string;
}

interface ActivityApiResponse {
    data: Activity[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        path: string;
        per_page: number;
        to: number | null;
        total: number;
    };
}

// Form validation 
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const activityFormSchema = z.object({
    id: z.number().optional(),
    employee_id: z.number().min(1, "Salesperson must be selected."),
    date: z.date({ required_error: "Date and time are required." }),
    note: z.string().min(1, "Description cannot be empty.").max(1000, "Description is too long."),
    existingImages: z.array(z.string()).optional(),
    newImageFiles: z.array(z.instanceof(File))
        .optional()
        .refine(files => files === undefined || files.every(file => file.size <= MAX_FILE_SIZE), `Max image size is 5MB.`)
        .refine(
            files => files === undefined || files.every(file => ACCEPTED_IMAGE_TYPES.includes(file.type)),
            "Only .jpg, .jpeg, .png and .webp formats are supported."
        ),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

// API Functions
const fetchActivities = async ({ pageParam = 1, queryKey }: any): Promise<ActivityApiResponse> => {
    const [_key, { selectedSalesPerson, startDate, endDate, userRole, userId }] = queryKey;
    const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        size: '5',
    });

    // If user is Sales, only show their activities
    if (userRole === "Sales") {
        searchParams.append('employee_id', userId);
    }
    // If user is Superadmin or Manager Sales and has selected a salesperson
    else if (selectedSalesPerson) {
        searchParams.append('employee_id', selectedSalesPerson);
    }

    if (startDate) searchParams.append('start_date', format(startDate, 'yyyy-MM-dd'));
    if (endDate) searchParams.append('end_date', format(endDate, 'yyyy-MM-dd'));

    const response: ActivityApiResponse = await api().get("activities", { searchParams }).json();
    return response;
};

const createActivity = (formData: ActivityFormData) => {
    const data = new FormData();
    data.append('employee_id', String(formData.employee_id));
    data.append('note', formData.note);
    data.append('date', format(formData.date, 'yyyy-MM-dd'));
    data.append('time', format(formData.date, 'HH:mm:ss'));

    formData.newImageFiles?.forEach((file) => {
        data.append('images[]', file);
    });

    return api().post("activities", {
        body: data,
        headers: {
            'Content-Type': undefined
        }
    }).json();
};

const updateActivity = async (formData: ActivityFormData) => {
    if (!formData.id) throw new Error("Activity ID is required for update.");

    const data = new FormData();
    data.append('_method', 'PUT');
    data.append('employee_id', String(formData.employee_id));
    data.append('note', formData.note);
    data.append('date', format(formData.date, 'yyyy-MM-dd'));
    data.append('time', format(formData.date, 'HH:mm:ss'));

    formData.existingImages?.forEach((imagePath) => {
        data.append('existing_images[]', imagePath);
    });

    formData.newImageFiles?.forEach((file) => {
        data.append('new_images[]', file);
    });

    return api().post(`activities/${formData.id}`, {
        body: data,
        headers: {
            'Content-Type': undefined
        }
    }).json();
};

const deleteActivity = async (id: number) => {
    return api().delete(`activities/${id}`).json();
};

export const Route = createFileRoute("/_layout/sales_/activity")({
    component: RouteComponent,
});

function RouteComponent() {
    const { auth } = useAuth();

    if (!canAccess(["Sales", "Superadmin", "Manager Sales"], auth?.user.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    const queryClient = useQueryClient();
    const userRole = auth?.user.role || "";
    const userId = auth?.user.code || "";
    const isAdminOrManager = userRole === "Superadmin" || userRole === "Manager Sales";

    // State
    const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>(isAdminOrManager ? "all" : userId);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
    const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [currentImages, setCurrentImages] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState<number | null>(null);

    // Fetch employees with roles "Manager Sales" or "Sales"
    const { data: employeesData, isLoading: isLoadingEmployees } = useInfiniteQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const response = await api().get("employee").json<{ data: Employee[] }>();
            // Filter employees by role
            const filteredEmployees = response.data.filter(
                emp => emp.role_name === "Manager Sales" || emp.role_name === "Sales"
            );
            return { ...response, data: filteredEmployees };
        },
        getNextPageParam: () => undefined, // Simple implementation for this case
        initialPageParam: 1,
    });

    // Flatten employees data for rendering
    const allEmployees = useMemo(() =>
        employeesData?.pages.flatMap(page => page.data) ?? [],
        [employeesData]
    );

    // Form setup
    const {
        control,
        watch,
        reset,
        setValue,
        handleSubmit,
        formState: { errors },
    } = useForm<ActivityFormData>({
        resolver: zodResolver(activityFormSchema),
        defaultValues: {
            employee_id: isAdminOrManager ? 0 : parseInt(userId),
            date: new Date(),
            note: "",
            existingImages: [],
            newImageFiles: [],
        },
    });

    const watchedNewFiles = watch("newImageFiles");
    const watchedExistingImages = watch("existingImages");

    // Log form errors for debugging
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log("Form validation errors:", errors);
        }
    }, [errors]);

    // Data fetching with React Query
    const {
        data: activitiesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingActivities,
        isError: isActivitiesError,
        error: activitiesError,
        refetch: refetchActivities,
    } = useInfiniteQuery<ActivityApiResponse, Error>({
        queryKey: ['activities', { selectedSalesPerson, startDate, endDate, userRole, userId }],
        queryFn: fetchActivities,
        getNextPageParam: (lastPage) => {
            if (lastPage.meta.current_page < lastPage.meta.last_page) {
                return lastPage.meta.current_page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });

    console.log('activitiesData', activitiesData)

    // Flatten activities data for rendering
    const allActivities = useMemo(() =>
        activitiesData?.pages.flatMap(page => page.data) ?? [],
        [activitiesData]
    );

    // Refetch when filters change
    useEffect(() => {
        refetchActivities();
    }, [selectedSalesPerson, startDate, endDate, refetchActivities]);

    // Mutations
    const createActivityMutation = useMutation({
        mutationFn: createActivity,
        onSuccess: () => {
            reset();
            setUploadPreviews([]);
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            setActivityModalOpen(false);
        },
        onError: async (error: unknown) => {
            console.error("Failed to create activity:", error);
            const errorDetails = await getApiErrorMessage(error);
            alert(`Error creating activity: ${errorDetails.message}`);
        },
    });

    const updateActivityMutation = useMutation({
        mutationFn: updateActivity,
        onSuccess: () => {
            reset();
            setUploadPreviews([]);
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            setActivityModalOpen(false);
        },
        onError: async (error: unknown) => {
            console.error("Failed to update activity:", error);
            const errorDetails = await getApiErrorMessage(error);
            alert(`Error updating activity: ${errorDetails.message}`);
        },
    });

    const deleteActivityMutation = useMutation({
        mutationFn: deleteActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            setDeleteDialogOpen(false);
            setActivityToDelete(null);
        },
        onError: async (error: unknown) => {
            console.error("Failed to delete activity:", error);
            const errorDetails = await getApiErrorMessage(error);
            alert(`Error deleting activity: ${errorDetails.message}`);
            setDeleteDialogOpen(false);
            setActivityToDelete(null);
        },
    });

    // Event handlers
    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const handleDeleteClick = (id: number) => {
        setActivityToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (activityToDelete !== null) {
            deleteActivityMutation.mutate(activityToDelete);
        }
    };

    const openImageCarousel = (images: string[], startIndex: number) => {
        setCurrentImages(images);
        setCurrentImageIndex(startIndex);
        setImageModalOpen(true);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
    };

    const openCreateModal = () => {
        setFormMode("create");
        reset({
            id: undefined,
            employee_id: isAdminOrManager ? 0 : parseInt(userId),
            date: new Date(),
            note: "",
            existingImages: [],
            newImageFiles: [],
        });
        setUploadPreviews([]);
        setActivityModalOpen(true);
    };

    const openEditModal = (activity: Activity) => {
        setFormMode("edit");
        reset({
            id: activity.id,
            employee_id: activity.employee_id,
            date: parseISO(`${activity.date}T${activity.time}`),
            note: activity.note,
            existingImages: activity.images || [],
            newImageFiles: [],
        });
        setUploadPreviews([]);
        setActivityModalOpen(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
            const currentFiles = watchedNewFiles ?? [];
            setValue("newImageFiles", [...currentFiles, ...files], { shouldValidate: true });

            // Create preview URLs
            const newPreviews = files.map((file) => URL.createObjectURL(file));
            setUploadPreviews((prev) => [...prev, ...newPreviews]);
        }
        e.target.value = '';
    };

    const removeUploadedFile = (index: number) => {
        const currentFiles = watchedNewFiles ?? [];
        const updatedFiles = currentFiles.filter((_, i) => i !== index);
        setValue("newImageFiles", updatedFiles, { shouldValidate: true });

        // Revoke object URL to avoid memory leaks
        const previewToRemove = uploadPreviews[index];
        if (previewToRemove) URL.revokeObjectURL(previewToRemove);
        setUploadPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingImage = (imagePath: string) => {
        const currentExisting = watchedExistingImages ?? [];
        setValue('existingImages', currentExisting.filter(path => path !== imagePath), { shouldValidate: true });
    };

    // Drag and drop handlers
    const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                const currentFiles = watchedNewFiles ?? [];
                setValue("newImageFiles", [...currentFiles, ...files], { shouldValidate: true });

                const newPreviews = files.map((file) => URL.createObjectURL(file));
                setUploadPreviews((prev) => [...prev, ...newPreviews]);
            }
            e.dataTransfer.clearData();
        }
    };

    const handleSubmitDates = () => {
        if (tempStartDate && tempEndDate && tempStartDate > tempEndDate) {
            alert("Start date cannot be after end date.");
            setTempStartDate(startDate);
            setTempEndDate(endDate);
            return;
        }
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setIsDatePopoverOpen(false);
    };

    const handlePopoverOpenChange = (open: boolean) => {
        if (open) {
            setTempStartDate(startDate);
            setTempEndDate(endDate);
        }
        setIsDatePopoverOpen(open);
    };

    // Form submission handler
    const onSubmit = (data: ActivityFormData) => {
        // For Sales users, make sure their own ID is used
        if (!isAdminOrManager) {
            data.employee_id = parseInt(userId);
        }

        if (formMode === "create") {
            createActivityMutation.mutate(data);
        } else {
            updateActivityMutation.mutate(data);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Sales Activity</h1>
                <Button onClick={openCreateModal} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Activity
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
                {isAdminOrManager && (
                    <div className="w-full md:w-auto">
                        <Select value={selectedSalesPerson} onValueChange={setSelectedSalesPerson}>
                            <SelectTrigger className="min-w-[200px]">
                                <SelectValue placeholder="All Salespeople" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">Semua Sales</SelectItem>
                                {isLoadingEmployees ? (
                                    <SelectItem value="loading" disabled>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                                        Loading...
                                    </SelectItem>
                                ) : (
                                    allEmployees.map((employee) => (
                                        <SelectItem
                                            key={employee.id}
                                            value={employee.id.toString()}
                                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <div className="flex flex-col">
                                                <span>{employee.name}</span>
                                                <span className="text-xs text-muted-foreground">{employee.role_name}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Date Range Filter */}
                <Popover open={isDatePopoverOpen} onOpenChange={handlePopoverOpenChange}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filter by Date
                            {(startDate || endDate) && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                    ({startDate ? format(startDate, 'MMM d') : '...'} - {endDate ? format(endDate, 'MMM d') : '...'})
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4 space-y-4">
                        <div className="text-sm font-medium text-center mb-2">Select Date Range</div>
                        <Calendar
                            mode="range"
                            selected={{ from: tempStartDate, to: tempEndDate }}
                            onSelect={(range: DateRange | undefined) => {
                                setTempStartDate(range?.from);
                                setTempEndDate(range?.to);
                            }}
                            numberOfMonths={1}
                            initialFocus
                        />
                        <Button onClick={handleSubmitDates} className="w-full">Apply Dates</Button>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Activities Timeline */}
            <div>
                {isLoadingActivities && !activitiesData && (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading activities...</p>
                    </div>
                )}

                {isActivitiesError && (
                    <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                        <p className="text-red-600 font-medium dark:text-red-400">Error loading activities:</p>
                        <p className="text-red-500 text-sm mt-1 dark:text-red-400">{activitiesError?.message || "An unknown error occurred."}</p>
                        <Button onClick={() => refetchActivities()} variant="outline" size="sm" className="mt-4">
                            Retry
                        </Button>
                    </div>
                )}

                {!isLoadingActivities && !isActivitiesError && allActivities.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-gray-800">
                        <p className="text-gray-500 dark:text-gray-400">No activities found for the selected filters.</p>
                    </div>
                )}

                {allActivities.length > 0 && (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

                        {/* Activities */}
                        <div className="space-y-8">
                            {allActivities.map((activity) => (
                                <div key={activity.id} className="relative">
                                    {/* Timeline dot */}
                                    <div className="absolute left-6 top-6 w-3 h-3 rounded-full bg-primary -translate-x-1.5 hidden sm:block" />

                                    <div className="sm:pl-16">
                                        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                            {/* Date and actions */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {format(parseISO(`${activity.date}T${activity.time}`), "MMMM d, yyyy 'at' h:mm a")}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => openEditModal(activity)}
                                                        disabled={updateActivityMutation.isPending}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                                        onClick={() => handleDeleteClick(activity.id)}
                                                        disabled={deleteActivityMutation.isPending && activityToDelete === activity.id}
                                                    >
                                                        {deleteActivityMutation.isPending && activityToDelete === activity.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Activity note */}
                                            <p className="mb-4 whitespace-pre-wrap">{activity.note}</p>

                                            {/* Images */}
                                            {activity.images && activity.images.length > 0 && (
                                                <div className="flex flex-wrap gap-3">
                                                    {activity.images.map((image, imgIndex) => (
                                                        <div
                                                            key={`img-${activity.id}-${imgIndex}`}
                                                            className="relative w-20 h-20 overflow-hidden cursor-pointer rounded border dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-700"
                                                            onClick={() => openImageCarousel(activity.images, imgIndex)}
                                                        >
                                                            <img
                                                                src={`${IMAGE_BASE_URL}${image}` || PLACEHOLDER_IMAGE}
                                                                alt={`Activity image ${imgIndex + 1}`}
                                                                className="max-w-full max-h-full object-contain"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Load more button */}
                        {hasNextPage && (
                            <div className="mt-8 text-center">
                                <Button
                                    onClick={handleLoadMore}
                                    variant="outline"
                                    className="gap-2 px-8 py-2 text-base"
                                    size="lg"
                                    disabled={isFetchingNextPage}
                                >
                                    {isFetchingNextPage ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            Load More
                                            <ChevronDown className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Image Carousel Modal */}
            <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
                <DialogContent className="p-4 overflow-hidden max-w-6xl dark:bg-gray-800">
                    <div className="relative w-full h-full flex justify-center items-center aspect-video">
                        {currentImages.length > 0 && (
                            <img
                                src={`${IMAGE_BASE_URL}${currentImages[currentImageIndex]}` || PLACEHOLDER_IMAGE}
                                alt="Activity image"
                                className="object-contain max-h-full"
                                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                            />
                        )}

                        {currentImages.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 hover:bg-black/40 text-white dark:bg-white/10 dark:hover:bg-white/20"
                                    onClick={prevImage}
                                >
                                    <ChevronDown className="h-6 w-6 rotate-90" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 hover:bg-black/40 text-white dark:bg-white/10 dark:hover:bg-white/20"
                                    onClick={nextImage}
                                >
                                    <ChevronDown className="h-6 w-6 -rotate-90" />
                                </Button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/20 dark:bg-white/10 px-3 py-1 rounded-full text-white text-sm">
                                    {currentImageIndex + 1} / {currentImages.length}
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Activity Form Modal */}
            <Dialog
                open={activityModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        reset({
                            employee_id: isAdminOrManager ? 0 : parseInt(userId),
                            date: new Date(),
                            note: "",
                            existingImages: [],
                            newImageFiles: [],
                        });
                        setUploadPreviews([]);
                    }
                    setActivityModalOpen(open);
                }}
                modal={true}
            >
                <DialogContent
                    className="sm:max-w-lg dark:bg-gray-800"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>{formMode === "create" ? "Create Activity" : "Edit Activity"}</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {formMode === "create" ? "Add a new sales activity record." : "Update the details of this activity."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                        {/* Salesperson Dropdown (only for admin/manager) */}
                        {isAdminOrManager && (
                            <div className="grid gap-2">
                                <Label htmlFor="employee_id">Salesperson</Label>
                                <Controller
                                    name="employee_id"
                                    control={control}
                                    render={({ field }) => (
                                        <DetailedSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={allEmployees.map(emp => ({
                                                id: emp.id,
                                                primary: emp.name,
                                                secondary: emp.role_name
                                            }))}
                                            placeholder="Select salesperson"
                                            isLoading={isLoadingEmployees}
                                            error={errors.employee_id?.message}
                                            disabled={!isAdminOrManager}
                                        />
                                    )}
                                />
                                {errors.employee_id && (
                                    <p className="text-xs text-red-500">{errors.employee_id.message}</p>
                                )}
                            </div>
                        )}

                        {/* Description Input */}
                        <div className="grid gap-2">
                            <Label htmlFor="note">Description</Label>
                            <Controller
                                name="note"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        id="note"
                                        placeholder="Enter activity description"
                                        className={`min-h-[100px] ${errors.note ? 'border-red-500' : ''}`}
                                        {...field}
                                    />
                                )}
                            />
                            {errors.note && (
                                <p className="text-xs text-red-500">{errors.note.message}</p>
                            )}
                        </div>

                        {/* Date & Time Input */}
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date & Time</Label>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="date"
                                        type="datetime-local"
                                        value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                                        onChange={(e) => {
                                            const newDate = e.target.value ? parseISO(e.target.value) : null;
                                            if (newDate && !isNaN(newDate.getTime())) {
                                                field.onChange(newDate);
                                            }
                                        }}
                                        className={errors.date ? 'border-red-500' : ''}
                                    />
                                )}
                            />
                            {errors.date && (
                                <p className="text-xs text-red-500">{errors.date.message}</p>
                            )}
                        </div>

                        {/* Image Upload Section */}
                        <div className="grid gap-2">
                            <Label htmlFor="images">Images</Label>

                            {/* Display existing images (only in edit mode) */}
                            {formMode === 'edit' && watchedExistingImages && watchedExistingImages.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-2">
                                    {watchedExistingImages.map((image, index) => (
                                        <div key={`existing-${index}`} className="relative w-20 h-20 overflow-hidden rounded border dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                            <img
                                                src={`${IMAGE_BASE_URL}${image}` || PLACEHOLDER_IMAGE}
                                                alt={`Existing image ${index + 1}`}
                                                className="max-w-full max-h-full object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-0 right-0 h-5 w-5 bg-red-600/80 hover:bg-red-600 text-white rounded-none rounded-bl"
                                                onClick={() => handleRemoveExistingImage(image)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Display newly uploaded image previews */}
                            {uploadPreviews.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-2">
                                    {uploadPreviews.map((preview, index) => (
                                        <div key={`upload-${index}`} className="relative w-20 h-20 overflow-hidden rounded border dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                            <img
                                                src={preview || PLACEHOLDER_IMAGE}
                                                alt={`Upload preview ${index + 1}`}
                                                className="max-w-full max-h-full object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-0 right-0 h-5 w-5 bg-black/50 hover:bg-black/70 text-white dark:bg-white/20 dark:hover:bg-white/30 rounded-none rounded-bl"
                                                onClick={() => removeUploadedFile(index)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* File Input Trigger Area */}
                            <Controller
                                name="newImageFiles"
                                control={control}
                                render={({ fieldState }) => (
                                    <>
                                        <label
                                            htmlFor="file-upload"
                                            className={`p-4 flex items-center justify-center border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDraggingOver ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'} ${fieldState.error ? 'border-red-500' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            <div className="flex flex-col items-center gap-1 pointer-events-none">
                                                <Plus className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Upload images or drop here</span>
                                            </div>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                            />
                                        </label>
                                        {fieldState.error && (
                                            <p className="text-xs text-red-500">{fieldState.error.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setActivityModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
                            >
                                {(createActivityMutation.isPending || updateActivityMutation.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {formMode === "create" ? "Create" : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                message="Are you sure you want to delete this activity? This action cannot be undone."
                isPending={deleteActivityMutation.isPending}
            />
        </div>
    );
}
