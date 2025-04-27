import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useRef, ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/_layout/my-profile')({
  component: RouteComponent,
})

// User data interface
interface UserData {
  profileImage: string;
  nik: string;
  name: string;
  email: string;
  phone: string;
  ktpAddress: string;
  realAddress: string;
  password: string;
}

// Mock user data (in a real app, this would come from an API)
const userData: UserData = {
  profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  nik: '3276012345678901',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+62 812-3456-7890',
  ktpAddress: 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta',
  realAddress: 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta',
  password: '••••••••'
}

// Form validation schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Nama harus minimal 2 karakter.' }),
  email: z.string().email({ message: 'Masukkan alamat email yang valid.' }),
  phone: z.string().min(10, { message: 'Nomor telepon harus minimal 10 digit.' }),
  nik: z.string().length(16, { message: 'NIK harus terdiri dari 16 digit.' }).regex(/^\d+$/, { message: 'NIK hanya boleh berisi angka.' }),
  ktpAddress: z.string().min(10, { message: 'Alamat KTP harus minimal 10 karakter.' }),
  realAddress: z.string().min(10, { message: 'Alamat tinggal harus minimal 10 karakter.' }),
})

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, { message: 'Kata sandi harus minimal 8 karakter.' }),
  newPassword: z.string().min(8, { message: 'Kata sandi harus minimal 8 karakter.' }),
  confirmPassword: z.string().min(8, { message: 'Kata sandi harus minimal 8 karakter.' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Kata sandi tidak cocok",
  path: ["confirmPassword"],
})

// Type definitions for form schemas
type ProfileFormValues = z.infer<typeof profileFormSchema>
type PasswordFormValues = z.infer<typeof passwordFormSchema>

interface ProfileImageUploadProps {
  image: string;
  onImageChange: (imageData: string) => void;
}

function ProfileImageUpload({ image, onImageChange }: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onImageChange(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <img
          src={image}
          alt="Profil"
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl cursor-pointer"
          onClick={handleClick}
        />
        <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer" onClick={handleClick}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </motion.div>
      <p className="mt-2 text-sm text-gray-500">Klik untuk memperbarui foto profil</p>
    </div>
  )
}

function RouteComponent() {
  const [user, setUser] = useState<UserData>(userData)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const router = useRouter()

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      nik: user.nik,
      ktpAddress: user.ktpAddress,
      realAddress: user.realAddress,
    },
  })

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    // In a real app, you would send this data to an API
    setUser({ ...user, ...data })
    console.log('Profil diperbarui:', data)
  }

  // Handle password form submission
  const onPasswordSubmit = (data: PasswordFormValues) => {
    // In a real app, you would send this data to an API
    console.log('Kata sandi diperbarui:', data)
    setIsPasswordDialogOpen(false)
    passwordForm.reset()
  }

  // Handle profile image change
  const handleProfileImageChange = (imageData: string) => {
    setUser({ ...user, profileImage: imageData })
  }

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container max-w-4xl mx-auto py-12 px-4"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
        >
          <h1 className="text-3xl font-semibold text-center mb-2">Profil Saya</h1>
          <p className="text-gray-500 text-center mb-8">Kelola informasi pribadi dan preferensi Anda</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="pt-6">
                  <ProfileImageUpload
                    image={user.profileImage}
                    onImageChange={handleProfileImageChange}
                  />

                  <div className="mt-6">
                    <h3 className="font-medium text-lg text-center">{user.name}</h3>
                    <p className="text-gray-500 text-center text-sm">{user.email}</p>
                  </div>

                  <Separator className="my-6" />

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          Ubah Kata Sandi
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Ubah Kata Sandi</DialogTitle>
                          <DialogDescription>
                            Masukkan kata sandi saat ini dan kata sandi baru untuk memperbarui kredensial Anda.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...passwordForm}>
                          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 py-4">
                            <FormField
                              control={passwordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Kata Sandi Saat Ini</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Kata Sandi Baru</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={passwordForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Konfirmasi Kata Sandi Baru</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter className="pt-4">
                              <Button type="submit">Simpan Perubahan</Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="md:col-span-2">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Pribadi</CardTitle>
                  <CardDescription>
                    Perbarui data pribadi dan informasi kontak Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Lengkap</FormLabel>
                              <FormControl>
                                <Input placeholder="Nama Anda" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="nik"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NIK (Nomor Induk Kependudukan)</FormLabel>
                              <FormControl>
                                <Input placeholder="NIK 16 digit" {...field} />
                              </FormControl>
                              <FormDescription>
                                Nomor identitas 16 digit Anda
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="email.anda@contoh.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nomor Telepon</FormLabel>
                              <FormControl>
                                <Input placeholder="+62 8xx-xxxx-xxxx" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="ktpAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alamat KTP</FormLabel>
                            <FormControl>
                              <Input placeholder="Alamat sesuai KTP Anda" {...field} />
                            </FormControl>
                            <FormDescription>
                              Alamat yang tercantum pada kartu identitas resmi Anda
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="realAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alamat Tinggal Saat Ini</FormLabel>
                            <FormControl>
                              <Input placeholder="Alamat tempat tinggal Anda saat ini" {...field} />
                            </FormControl>
                            <FormDescription>
                              Alamat tempat tinggal Anda saat ini jika berbeda dengan KTP
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button type="submit" className="px-8">
                            Simpan Perubahan
                          </Button>
                        </motion.div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
