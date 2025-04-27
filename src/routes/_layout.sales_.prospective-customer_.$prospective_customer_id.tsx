import { createFileRoute, Navigate, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  CloseCircle,
  Edit,
  Status,
  Trash,
} from 'iconsax-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  canAccess,
} from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import { DeleteDialog } from '@/components/DeleteDialog'
import { Plus, X, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select'

export const Route = createFileRoute(
  '/_layout/sales_/prospective-customer_/$prospective_customer_id',
)({
  component: RouteComponent,
  /*
  loader: async ({ params }) => {
    try {
      const { data } = await api()
        .get('customers/' + params.prospective_customer_id)
        .json<any>()
      return data
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error)
      throw new Error(errorMessage.message)
    }
  },
  */
})

// Activity type definition
interface Activity {
  id: number;
  note: string;
  date: string;
  time: string;
  images: string[];
  sales: string[]; // array of sales person ids
}

function RouteComponent() {
  const { auth } = useAuth()

  if (
    !canAccess(['Sales', 'Superadmin', 'Manager Sales'], auth?.user.role || '')
  ) {
    return <Navigate to="/dashboard" />
  }

  const router = useRouter()
  // Using dummy data instead of loader data
  const customer = {
    code: 'PC001',
    type: 'company',
    name: 'PT Maju Bersama',
    phone: '08123456789',
    npwp: '12.345.678.9-012.345',
    npwp_address: 'Jl. Raya Industri No. 123, Jakarta Utara',
    nik: '1234567890123456',
    ktp_address: 'Jl. Raya Perumahan No. 456, Jakarta Selatan',
    address: 'Jl. Raya Industri No. 123, Jakarta Utara',
    total_jobs_value: 125000000,
    total_jobs: 3,
    total_pending_jobs: 1,
    total_in_progress_jobs: 1,
    total_completed_jobs: 1,
    total_cancelled_jobs: 0,
    jobs: []
  }

  // Progress state
  const [progress, setProgress] = useState('75%')

  // Timeline progress status dates
  const [progressDates, setProgressDates] = useState({
    '0%': new Date(2023, 5, 10),
    '25%': new Date(2023, 6, 15),
    '50%': new Date(2023, 9, 10),
    '75%': new Date(2023, 10, 20),
    '100%': new Date(2023, 11, 30)
  });

  // State for activity functionality
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState<number | null>(null)
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([])
  const [currentImages, setCurrentImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [activityForm, setActivityForm] = useState({
    id: 0,
    note: "",
    date: new Date(),
    images: [] as File[],
    sales: [] as string[],
  })

  // Sales person mock data
  const mockSales = [
    { id: 's1', name: 'Andi Wijaya' },
    { id: 's2', name: 'Budi Santoso' },
    { id: 's3', name: 'Citra Dewi' },
    { id: 's4', name: 'Dewi Lestari' },
    { id: 's5', name: 'Eka Saputra' },
  ]
  const salesOptions: MultiSelectOption[] = mockSales.map(s => ({ value: s.id, label: s.name }))

  // Dummy activities data with Unsplash images and sales
  const dummyActivities: Activity[] = [
    {
      id: 1,
      note: "Melakukan presentasi produk dan demo penggunaan pestisida untuk pengendalian hama. Customer tertarik dengan produk premium dan meminta proposal lengkap.",
      date: "2023-06-15",
      time: "09:30:00",
      images: [
        "https://picsum.photos/600/400",
        "https://picsum.photos/600/400"
      ],
      sales: ['s1', 's2']
    },
    {
      id: 2,
      note: "Follow up via telepon. Customer mengonfirmasi telah mereview proposal dan tertarik untuk diskusi lebih lanjut mengenai jadwal implementasi.",
      date: "2023-06-22",
      time: "14:00:00",
      images: [
        "https://picsum.photos/600/400",
        "https://picsum.photos/600/400"
      ],
      sales: ['s3']
    },
    {
      id: 3,
      note: "Meeting di kantor customer untuk finalisasi kontrak. Diskusi terms & conditions serta jadwal survey lokasi.",
      date: "2023-07-05",
      time: "10:15:00",
      images: [
        "https://picsum.photos/600/400",
        "https://picsum.photos/600/400",
        "https://picsum.photos/600/400"
      ],
      sales: ['s1', 's4', 's5']
    }
  ]

  const idNumberLabel = customer.type === 'company' ? 'NPWP' : 'NIK'
  const addressLabel =
    customer.type === 'company' ? 'Alamat NPWP' : 'Alamat KTP'

  // Event handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
      setActivityForm(prev => ({
        ...prev,
        images: [...prev.images, ...files]
      }));

      // Create preview URLs
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setUploadPreviews((prev) => [...prev, ...newPreviews]);
    }
    e.target.value = '';
  };

  const removeUploadedFile = (index: number) => {
    const updatedFiles = activityForm.images.filter((_, i) => i !== index);
    setActivityForm(prev => ({
      ...prev,
      images: updatedFiles
    }));

    // Revoke object URL to avoid memory leaks
    const previewToRemove = uploadPreviews[index];
    if (previewToRemove) URL.revokeObjectURL(previewToRemove);
    setUploadPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const openCreateModal = () => {
    setFormMode("create");
    setActivityForm({
      id: 0,
      note: "",
      date: new Date(),
      images: [],
      sales: [],
    });
    setUploadPreviews([]);
    setActivityModalOpen(true);
  };

  const openEditModal = (activity: Activity) => {
    setFormMode("edit");
    setActivityForm({
      id: activity.id,
      note: activity.note,
      date: parseISO(`${activity.date}T${activity.time}`),
      images: [],
      sales: activity.sales,
    });
    setUploadPreviews([]);
    setActivityModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setActivityToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    // This would be replaced with a mutation call
    console.log("Delete activity:", activityToDelete);
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  };

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    // This would be replaced with a mutation call
    console.log("Submit activity:", activityForm);
    setActivityModalOpen(false);
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

  return (
    <>
      <button
        onClick={() => router.history.back()}
        className="flex items-center gap-3 mb-8 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
      >
        <ArrowLeft
          size={16}
          className="transition-all group-hover:-translate-x-1"
        />{' '}
        Kembali
      </button>

      <div className='flex justify-between'>
        <div>
          <div className="my-2 text-xl font-medium dark:text-gray-300">
            Kode Calon Pelanggan #{customer.code}
          </div>
          <div className="mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">
            Detail Informasi Calon Pelanggan
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>

          <Select value={progress} onValueChange={setProgress}>
            <SelectTrigger className="w-40 dark:border-gray-600">
              <SelectValue placeholder="Progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="0%">Progress: 0%</SelectItem>
                <SelectItem value="25%">Progress: 25%</SelectItem>
                <SelectItem value="75%">Progress: 75%</SelectItem>
                <SelectItem value="100%">Progress: 100%</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-4 xl:flex-row">
        <div className="xl:w-[700px] text-sm text-gray-600 dark:text-gray-200">
          <div className="border border-gray-200 rounded-xl dark:border-gray-600">
            <div className="p-4 text-lg font-semibold">Informasi Umum</div>

            <div className="border-b border-gray-200 dark:border-gray-600 my4"></div>

            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="w-40 font-medium">Tipe</div>
              <div className="flex-1">
                {customer.type === 'company' ? 'Company' : 'Individual'}
              </div>
            </div>

            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="w-40 font-medium">
                {customer.type === 'company' ? 'Nama Perusahaan' : 'Nama'}
              </div>
              <div className="flex-1">{customer.name}</div>
            </div>

            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="w-40 font-medium">No HP</div>
              <div className="flex-1">{customer.phone}</div>
            </div>

            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="w-40 font-medium">{idNumberLabel}</div>
              <div className="flex-1">{customer.npwp || customer.nik}</div>
            </div>

            <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="w-40 font-medium">{addressLabel}</div>
              <div className="flex-1">
                {customer.type === 'company'
                  ? customer.npwp_address
                  : customer.ktp_address}
              </div>
            </div>

            <div className="flex p-4">
              <div className="w-40 font-medium">Alamat Saat Ini</div>
              <div className="flex-1">{customer.address}</div>
            </div>
          </div>
        </div>
        <div className='w-full'>
          <div className="text-sm text-gray-600 dark:text-gray-200">
            <div className="border border-gray-200 rounded-xl dark:border-gray-600">
              <div className="p-4 text-lg font-semibold">Progres Status</div>
              <div className="border-b border-gray-200 dark:border-gray-600 my4"></div>
              <div className='px-4 py-8'>
                <TimelineProgress progress={progress} progressDates={progressDates} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white border border-gray-200 rounded-xl dark:bg-[#30334E] dark:border-gray-600">
        <div className="flex flex-col justify-between gap-2 p-4 border-b border-gray-200 sm:items-center sm:flex-row dark:border-gray-600">
          <div className="text-lg font-medium text-gray-600 dark:text-gray-200">
            Aktivitas Sales
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Aktivitas
            </Button>
          </div>
        </div>

        {dummyActivities.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4 text-gray-400 dark:text-gray-500">
              <CloseCircle size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Belum ada aktivitas</p>
            <Button onClick={openCreateModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Aktivitas
            </Button>
          </div>
        ) : (
          <div className="relative p-5">

            {/* Activities */}
            <div className="space-y-8">
              {dummyActivities.map((activity) => (
                <div key={activity.id} className="relative">
                  <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm">
                    {/* Date and actions */}
                    <div className="flex justify-between center mb-3">
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        {format(parseISO(`${activity.date}T${activity.time}`), "MMMM d, yyyy 'at' h:mm a", { locale: id })}
                        <Badge variant='outline'>{progress}</Badge>
                      </div>
                      <div className="gap-2 hidden sm:flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditModal(activity)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleDeleteClick(activity.id)}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                    {/* Sales Avatars/Names */}
                    <div className="flex flex-wrap gap-2 mb-2 items-center">
                      {activity.sales.map(sid => {
                        const sales = mockSales.find(s => s.id === sid)
                        return sales ? (
                          <Badge key={sid} variant='outline' className='bg-blue-100 text-gray-700'>
                            {sales.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                    {/* Activity note */}
                    <p className="mb-4 whitespace-pre-wrap text-gray-700 dark:text-gray-300">{activity.note}</p>
                    {/* Images */}
                    {activity.images && activity.images.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {activity.images.map((image, imgIndex) => (
                          <div
                            key={`img-${activity.id}-${imgIndex}`}
                            className="relative w-24 h-24 overflow-hidden cursor-pointer rounded-md border dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-700"
                            onClick={() => openImageCarousel(activity.images, imgIndex)}
                          >
                            <img
                              src={image}
                              alt={`Activity image ${imgIndex + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="gap-2 flex sm:hidden mt-8 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditModal(activity)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDeleteClick(activity.id)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activity Form Modal */}
      <Dialog
        open={activityModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setActivityForm({
              id: 0,
              note: "",
              date: new Date(),
              images: [],
              sales: [],
            });
            setUploadPreviews([]);
          }
          setActivityModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Tambah Aktivitas" : "Edit Aktivitas"}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {formMode === "create" ? "Tambahkan catatan aktivitas dengan prospective customer." : "Perbarui catatan aktivitas."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitActivity} className="grid gap-4 py-4">
            {/* Description Input */}
            <div className="grid gap-2">
              <Label htmlFor="note">Deskripsi</Label>
              <Textarea
                id="note"
                placeholder="Masukkan deskripsi aktivitas"
                className="min-h-[100px]"
                value={activityForm.note}
                onChange={(e) => setActivityForm(prev => ({ ...prev, note: e.target.value }))}
                required
              />
            </div>
            {/* Sales Multi-Select */}
            <div className="grid gap-2">
              <Label htmlFor="sales">Sales</Label>
              <MultiSelect
                options={salesOptions}
                selected={activityForm.sales}
                onChange={(sales) => setActivityForm(prev => ({ ...prev, sales }))}
                placeholder="Pilih sales yang terlibat"
                className="min-w-0"
              />
            </div>
            {/* Date & Time Input */}
            <div className="grid gap-2">
              <Label htmlFor="date">Tanggal & Waktu</Label>
              <Input
                id="date"
                type="datetime-local"
                value={format(activityForm.date, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => {
                  const newDate = e.target.value ? parseISO(e.target.value) : new Date();
                  setActivityForm(prev => ({ ...prev, date: newDate }));
                }}
                required
              />
            </div>
            {/* Image Upload Section */}
            <div className="grid gap-2">
              <Label htmlFor="images">Gambar</Label>

              {/* Display image previews */}
              {uploadPreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-2">
                  {uploadPreviews.map((preview, index) => (
                    <div key={`upload-${index}`} className="relative w-24 h-24 overflow-hidden rounded-md border dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <img
                        src={preview}
                        alt={`Upload preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0 h-6 w-6 bg-black/50 hover:bg-black/70 text-white dark:bg-white/20 dark:hover:bg-white/30 rounded-none rounded-bl"
                        onClick={() => removeUploadedFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* File Input Trigger Area */}
              <label
                htmlFor="file-upload"
                className="p-4 flex items-center justify-center border-2 border-dashed rounded-md cursor-pointer transition-colors border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
              >
                <div className="flex flex-col items-center gap-1 pointer-events-none">
                  <Plus className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Upload gambar</span>
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
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setActivityModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {formMode === "create" ? "Tambah" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog >

      {/* Image Carousel Modal */}
      < Dialog open={imageModalOpen} onOpenChange={setImageModalOpen} >
        <DialogContent className="p-0 overflow-hidden max-w-4xl dark:bg-gray-800">
          <div className="relative w-full h-full flex justify-center items-center">
            {currentImages.length > 0 && (
              <img
                src={currentImages[currentImageIndex]}
                alt="Activity image"
                className="object-contain max-h-[80vh] w-full"
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
                  <ArrowLeft size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 hover:bg-black/40 text-white dark:bg-white/10 dark:hover:bg-white/20"
                  onClick={nextImage}
                >
                  <ArrowLeft size={20} className="rotate-180" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/20 dark:bg-white/10 px-3 py-1 rounded-full text-white text-sm">
                  {currentImageIndex + 1} / {currentImages.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog >

      {/* Delete Confirmation Dialog */}
      < DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        message="Apakah Anda yakin ingin menghapus aktivitas ini? Tindakan ini tidak dapat dibatalkan."
        isPending={false}
      />
    </>
  )
}

const TimelineProgress = ({ progress, progressDates }: { progress: string, progressDates: Record<string, Date | null> }) => {
  // Progress milestones configuration
  const MILESTONES = [
    { value: 0, label: '0%', key: '0%' },
    { value: 25, label: '25%', key: '25%' },
    { value: 50, label: '50%', key: '50%' },
    { value: 75, label: '75%', key: '75%' },
    { value: 100, label: '100%', key: '100%' }
  ];

  // Current progress as a number
  const currentProgress = parseInt(progress);

  // Helper function to determine milestone status
  const getMilestoneStatus = (milestoneValue: number) => {
    if (currentProgress >= milestoneValue) {
      return 'passed'; // At or past this milestone
    } else {
      return 'not-passed'; // Not yet reached
    }
  };

  // Helper to format the date or return a placeholder
  const formatDate = (dateKey: string) => {
    return progressDates[dateKey]
      ? format(progressDates[dateKey] as Date, 'dd MMM yyyy', { locale: id })
      : '-';
  };

  return (
    <>

      {/* Mobile View */}
      <div className="sm:hidden relative">
        {/* Timeline line */}
        <div className="absolute top-0 left-[9px] w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>

        <div
          className="absolute top-0 left-[9px] w-0.5 bg-primary transition-all duration-300"
          style={{ height: `${currentProgress}%` }}
        ></div>

        {/* Timeline points */}
        <div className="flex flex-col gap-5">
          {MILESTONES.map((milestone) => {
            const status = getMilestoneStatus(milestone.value);
            return (
              <div key={milestone.key} className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full z-10 flex items-center justify-center ${status === 'passed' ? 'bg-primary text-white' :
                    'bg-gray-200 dark:bg-gray-700'
                    }`}
                >
                  {status === 'passed' && <CheckCircle2 className="w-4 h-4 dark:text-black" />}
                </div>
                <div className="text-xs font-medium">
                  {milestone.label} {status === 'passed' ? "• " + formatDate(milestone.key) : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop View */}
      <div className="relative pb-12 sm:block hidden">
        {/* Background line */}
        <div className="absolute top-2.5 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {/* Progress bar */}
        <div
          className="absolute top-2.5 left-0 h-0.5 bg-primary transition-all duration-300"
          style={{ width: `${currentProgress}%` }}
        ></div>

        {/* Timeline points */}
        <div className="relative flex justify-between">
          {MILESTONES.map((milestone, index) => {
            const status = getMilestoneStatus(milestone.value);
            const isFirst = index === 0;
            const isLast = index === MILESTONES.length - 1;

            return (
              <div key={milestone.key} className="relative">
                <div
                  className={`w-5 h-5 rounded-full z-10 flex items-center justify-center ${status === 'passed' ? 'bg-primary text-white' :
                    'bg-gray-200 dark:bg-gray-700'
                    }`}
                >
                  {status === 'passed' && <CheckCircle2 className="w-4 h-4 dark:text-black" />}
                </div>

                <div className={`absolute top-6 w-fit ${isFirst ? 'left-0' :
                  isLast ? 'right-0' :
                    'left-1/2 -translate-x-1/2'
                  }`}>
                  <div className={`text-xs font-medium ${isFirst ? '' :
                    isLast ? 'text-end' :
                      'text-center'
                    }`}>
                    {milestone.label}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-nowrap">
                    {status === 'passed' ? formatDate(milestone.key) : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};