// components/profile/ProfileTabs.tsx
import React, { useState, useEffect, useRef } from 'react'
import {
    MapPin,
    Globe,
    Star,
    Mail,
    Phone,
    CreditCard,
    Shield,
    CheckCircle2,
    XCircle,
    Edit2,
    Calendar,
    User,
    Heart,
    Bell,
    Loader2,
    Upload,
    FileText,
    AlertCircle,
    Camera,
    Car,
} from 'lucide-react'
import type { UserProfile } from "./ProfileHeader"
import api from '../../api/axios'

// ==================== TYPES ====================

export interface UserDetails {
    firstName: string
    lastName: string
    about: string
    languages: string
    phoneNumber: string
    address: string
    rentalCount: number
    rating: number
    memberSince: string
    responseRate?: number
    trips: number
    reviews: number
    verifiedEmail: boolean
    verifiedPhone: boolean
    verifiedLicense: boolean
    verifiedId: boolean
    email?: string
    nationalIdNumber?: string
    driversLicenseNumber?: string
    driversLicenseUrl?: string
    driversLicenseExpiry?: string
    gender?: 'Male' | 'Female' | 'Other' | ''
    age?: number | null
    dateOfBirth?: string
    preferredCarType?: string
    notificationPreferences?: {
        email: boolean
        sms: boolean
        push: boolean
    }
}

interface Review {
    id: number
    author: string
    authorInitials: string
    date: string
    rating: number
    text: string
    carName: string
    authorAvatar?: string
}

interface Reservation {
    id: number
    carId: number
    car?: {
        id: number
        make: string
        model: string
        year: number
        imagesList?: string[]
    }
    startDate: string
    endDate: string
    totalAmount: number
    status: 'pending' | 'payment_pending' | 'confirmed' | 'cancelled' | 'failed' | 'completed'
    createdAt: string
}

interface ProfileTabsProps {
    user: UserProfile
    details: UserDetails
    activeTab: 'about' | 'reviews' | 'verifications' | 'reservations'
    onTabChange: (tab: 'about' | 'reviews' | 'verifications' | 'reservations') => void
    isEditing: boolean
    onToggleEdit: () => void
    onSaveProfile: (newDetails: UserDetails) => void
    saveLoading?: boolean
    onShowSuccess?: (message: string) => void
    onShowError?: (message: string) => void
}

// ==================== CONSTANTS ====================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

const getStatusBadge = (status: Reservation['status']) => {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-800',
        payment_pending: 'bg-blue-100 text-blue-800',
        confirmed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        failed: 'bg-red-100 text-red-800',
        completed: 'bg-gray-100 text-gray-800',
    }
    const labels = {
        pending: 'Pending',
        payment_pending: 'Payment Pending',
        confirmed: 'Confirmed',
        cancelled: 'Cancelled',
        failed: 'Failed',
        completed: 'Completed',
    }
    return { className: styles[status] || styles.pending, label: labels[status] || status }
}

// ==================== MAIN COMPONENT ====================

export function ProfileTabs({
                                user,
                                details,
                                activeTab,
                                onTabChange,
                                isEditing,
                                onToggleEdit,
                                onSaveProfile,
                                saveLoading = false,
                                onShowSuccess,
                                onShowError,
                            }: ProfileTabsProps) {
    const [editForm, setEditForm] = useState<UserDetails>(details)
    const [reviews, setReviews] = useState<Review[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [reviewsError, setReviewsError] = useState<string | null>(null)

    const [reservations, setReservations] = useState<Reservation[]>([])
    const [reservationsLoading, setReservationsLoading] = useState(false)
    const [reservationsError, setReservationsError] = useState<string | null>(null)

    const [uploadingLicense, setUploadingLicense] = useState(false)
    const [uploadingId, setUploadingId] = useState(false)
    const [licenseFile, setLicenseFile] = useState<File | null>(null)
    const [idFile, setIdFile] = useState<File | null>(null)

    const licenseInputRef = useRef<HTMLInputElement>(null)
    const idInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setEditForm(details)
    }, [details])

    useEffect(() => {
        if (activeTab === 'reviews' && reviews.length === 0 && !reviewsLoading) {
            fetchReviews()
        }
    }, [activeTab])

    useEffect(() => {
        if (activeTab === 'reservations' && reservations.length === 0 && !reservationsLoading) {
            fetchReservations()
        }
    }, [activeTab])

    const fetchReviews = async () => {
        try {
            setReviewsLoading(true)
            setReviewsError(null)
            const response = await api.get('/api/reviews', { params: { userId: user.id } })
            if (response.data) {
                const fetchedReviews = response.data.map((review: any) => ({
                    id: review.id,
                    author: review.reviewerName,
                    authorInitials: review.reviewerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
                    date: new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    rating: review.rating,
                    text: review.comment,
                    carName: review.carName,
                    authorAvatar: review.reviewerAvatar,
                }))
                setReviews(fetchedReviews)
            }
        } catch (err) {
            console.error('Failed to fetch reviews:', err)
            setReviewsError('Failed to load reviews. Please try again.')
        } finally {
            setReviewsLoading(false)
        }
    }

    const fetchReservations = async () => {
        try {
            setReservationsLoading(true)
            setReservationsError(null)
            const response = await api.get('/api/reservations')
            if (response.data?.reservations) {
                setReservations(response.data.reservations)
            } else if (Array.isArray(response.data)) {
                setReservations(response.data)
            } else {
                setReservations([])
            }
        } catch (err: any) {
            console.error('Failed to fetch reservations:', err)
            setReservationsError(err.response?.data?.message || 'Failed to load reservations')
        } finally {
            setReservationsLoading(false)
        }
    }

    const handleSave = () => {
        onSaveProfile(editForm)
    }

    const handleCancel = () => {
        setEditForm(details)
        onToggleEdit()
    }

    const handleInputChange = (field: keyof UserDetails, value: string) => {
        setEditForm(prev => ({ ...prev, [field]: value }))
    }

    const handleNotificationChange = (type: 'email' | 'sms' | 'push', checked: boolean) => {
        setEditForm(prev => ({
            ...prev,
            notificationPreferences: {
                email: prev.notificationPreferences?.email ?? true,
                sms: prev.notificationPreferences?.sms ?? false,
                push: prev.notificationPreferences?.push ?? true,
                [type]: checked
            }
        }))
    }

    const getFullName = () => {
        if (editForm.firstName && editForm.lastName) return `${editForm.firstName} ${editForm.lastName}`
        if (editForm.firstName) return editForm.firstName
        if (editForm.lastName) return editForm.lastName
        return user.name || 'User'
    }

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return 'Please select a valid file (JPEG, PNG, WebP, or PDF)'
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File size should be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
        }
        return null
    }

    const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const error = validateFile(file)
        if (error) {
            onShowError?.(error)
            return
        }

        setLicenseFile(file)
        try {
            setUploadingLicense(true)
            const formData = new FormData()
            formData.append('license', file)
            const response = await api.post('/api/profile/upload-license', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            if (response.data) {
                setEditForm(prev => ({
                    ...prev,
                    driversLicenseUrl: response.data.url,
                    verifiedLicense: true
                }))
                onShowSuccess?.('Driver’s license uploaded successfully')
            }
        } catch (err: any) {
            console.error('Failed to upload license:', err)
            onShowError?.(err.response?.data?.message || 'Failed to upload license')
        } finally {
            setUploadingLicense(false)
        }
    }

    const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const error = validateFile(file)
        if (error) {
            onShowError?.(error)
            return
        }

        setIdFile(file)
        try {
            setUploadingId(true)
            const formData = new FormData()
            formData.append('id', file)
            const response = await api.post('/api/profile/id', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            if (response.data) {
                setEditForm(prev => ({
                    ...prev,
                    nationalIdNumber: response.data.idNumber,
                    verifiedId: true
                }))
                onShowSuccess?.('Government ID uploaded successfully')
            }
        } catch (err: any) {
            console.error('Failed to upload ID:', err)
            onShowError?.(err.response?.data?.message || 'Failed to upload ID')
        } finally {
            setUploadingId(false)
        }
    }

    // ==================== RENDER HELPERS ====================

    const renderVerificationStatus = (isVerified: boolean, onClick?: () => void) => {
        if (isVerified) {
            return (
                <div className="flex items-center text-green-600 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5 mr-1.5" />
                    Verified
                </div>
            )
        }
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center text-gray-400 text-sm font-medium">
                    <XCircle className="h-5 w-5 mr-1.5" />
                    Not verified
                </div>
                {onClick && (
                    <button onClick={onClick} className="text-[#00A699] text-sm font-semibold hover:underline">
                        Verify
                    </button>
                )}
            </div>
        )
    }

    const renderFileUpload = (
        label: string,
        value: string | undefined,
        uploading: boolean,
        onUpload: () => void,
        inputRef: React.RefObject<HTMLInputElement>,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    ) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            {value ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-[#00A699]" />
                    <span className="text-sm text-gray-600 truncate flex-1">Document uploaded</span>
                    <button type="button" onClick={onUpload} className="text-sm text-[#00A699] hover:underline">
                        Replace
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#00A699] transition-colors"
                >
                    <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf" onChange={onChange} className="hidden" />
                    {uploading ? (
                        <Loader2 className="h-6 w-6 text-[#00A699] animate-spin mx-auto" />
                    ) : (
                        <>
                            <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Click to upload {label.toLowerCase()}</p>
                            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP or PDF (max 5MB)</p>
                        </>
                    )}
                </div>
            )}
        </div>
    )

    const renderReviews = () => {
        if (reviewsLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-[#00A699] animate-spin" /></div>
        if (reviewsError) return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{reviewsError}</p>
                <button onClick={fetchReviews} className="text-[#00A699] hover:underline">Try Again</button>
            </div>
        )
        if (reviews.length === 0) return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-500">This user hasn't received any reviews yet.</p>
            </div>
        )
        return (
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                                {review.authorAvatar ? (
                                    <img src={review.authorAvatar} alt={review.author} className="h-10 w-10 rounded-full mr-3 object-cover" />
                                ) : (
                                    <div className="h-10 w-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white font-semibold text-sm">{review.authorInitials}</span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-gray-900">{review.author}</p>
                                    <p className="text-xs text-gray-500">{review.date}</p>
                                </div>
                            </div>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-[#00A699] fill-current' : 'text-gray-300'}`} />
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-700 mb-3">{review.text}</p>
                        <p className="text-xs text-gray-500 font-medium">Rented: {review.carName}</p>
                    </div>
                ))}
            </div>
        )
    }

    const renderReservations = () => {
        if (reservationsLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-[#00A699] animate-spin" /></div>
        if (reservationsError) return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{reservationsError}</p>
                <button onClick={fetchReservations} className="text-[#00A699] hover:underline">Try Again</button>
            </div>
        )
        if (reservations.length === 0) return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reservations yet</h3>
                <p className="text-gray-500">You haven't made any reservations. Browse cars to get started.</p>
                <a href="/cars" className="inline-block mt-4 px-4 py-2 bg-[#00A699] text-white rounded-lg hover:bg-[#007A6E] transition">Explore Cars</a>
            </div>
        )
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {reservations.map((res) => {
                        const carName = res.car ? `${res.car.make} ${res.car.model} (${res.car.year})` : `Car #${res.carId}`
                        const { className: badgeClass, label } = getStatusBadge(res.status)
                        return (
                            <tr key={res.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{carName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(res.startDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(res.endDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">KES {res.totalAmount.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>{label}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {res.status === 'confirmed' && <a href={`/bookings/${res.id}`} className="text-[#00A699] hover:underline">View Details</a>}
                                    {res.status === 'payment_pending' && <span className="text-yellow-600">Awaiting payment</span>}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        )
    }

    // ==================== RENDER ====================

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 px-2 sm:px-6 overflow-x-auto">
                <button onClick={() => onTabChange('about')} className={`px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'about' ? 'border-[#00A699] text-[#00A699]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>About</button>
                <button onClick={() => onTabChange('reviews')} className={`px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-[#00A699] text-[#00A699]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Reviews ({user.reviews})</button>
                <button onClick={() => onTabChange('verifications')} className={`px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'verifications' ? 'border-[#00A699] text-[#00A699]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Verifications</button>
                <button onClick={() => onTabChange('reservations')} className={`px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'reservations' ? 'border-[#00A699] text-[#00A699]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Reservations</button>
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-8">
                {/* ABOUT TAB */}
                {activeTab === 'about' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-900">About {getFullName().split(' ')[0]}</h2>
                            {!isEditing && (
                                <button onClick={onToggleEdit} className="p-2 text-gray-400 hover:text-[#00A699] hover:bg-[#00A699]/10 rounded-full transition-colors">
                                    <Edit2 className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {!isEditing && (details.firstName || details.lastName) && (
                            <div className="mb-6 pb-6 border-b border-gray-100">
                                <div className="flex items-start">
                                    <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Full Name</p>
                                        <p className="text-lg font-semibold text-gray-900">{details.firstName} {details.lastName}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEditing ? (
                            <div className="space-y-6">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label><input type="text" value={editForm.firstName || ''} onChange={(e) => handleInputChange('firstName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#00A699]" required /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label><input type="text" value={editForm.lastName || ''} onChange={(e) => handleInputChange('lastName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#00A699]" required /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label><textarea value={editForm.about || ''} onChange={(e) => handleInputChange('about', e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#00A699]" placeholder="Tell others about yourself..." /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Languages</label><input type="text" value={editForm.languages || ''} onChange={(e) => handleInputChange('languages', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5" placeholder="e.g., English, Swahili" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label><input type="tel" value={editForm.phoneNumber || ''} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5" placeholder="+254 XXX XXX XXX" /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label><input type="text" value={editForm.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5" placeholder="Your location" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label><select value={editForm.gender || ''} onChange={(e) => handleInputChange('gender', e.target.value as any)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5"><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label><input type="date" value={editForm.dateOfBirth || ''} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5" max={new Date().toISOString().split('T')[0]} /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">National ID Number</label><input type="text" value={editForm.nationalIdNumber || ''} onChange={(e) => handleInputChange('nationalIdNumber', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5" placeholder="e.g., 12345678" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Driver's License Number</label><input type="text" value={editForm.driversLicenseNumber || ''} onChange={(e) => handleInputChange('driversLicenseNumber', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5" placeholder="e.g., DL12345678" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">License Expiry Date</label><input type="date" value={editForm.driversLicenseExpiry || ''} onChange={(e) => handleInputChange('driversLicenseExpiry', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5" min={new Date().toISOString().split('T')[0]} /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Car Type</label><select value={editForm.preferredCarType || ''} onChange={(e) => handleInputChange('preferredCarType', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5"><option value="">Select preferred car type</option><option value="SUV">SUV</option><option value="Sedan">Sedan</option><option value="Hatchback">Hatchback</option><option value="Sports">Sports</option><option value="Electric">Electric</option><option value="Truck">Truck</option></select></div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notification Preferences</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={editForm.notificationPreferences?.email ?? true} onChange={(e) => handleNotificationChange('email', e.target.checked)} className="rounded text-[#00A699]" /><span className="text-sm text-gray-700">Email</span></label>
                                            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={editForm.notificationPreferences?.sms ?? false} onChange={(e) => handleNotificationChange('sms', e.target.checked)} className="rounded text-[#00A699]" /><span className="text-sm text-gray-700">SMS</span></label>
                                            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={editForm.notificationPreferences?.push ?? true} onChange={(e) => handleNotificationChange('push', e.target.checked)} className="rounded text-[#00A699]" /><span className="text-sm text-gray-700">Push</span></label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button onClick={handleSave} disabled={saveLoading} className={`bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-2.5 rounded-full font-medium ${saveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>{saveLoading ? 'Saving...' : 'Save Changes'}</button>
                                    <button onClick={handleCancel} disabled={saveLoading} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div><h3 className="text-sm font-medium text-gray-500 mb-2">Bio</h3><p className="text-gray-700 leading-relaxed whitespace-pre-line">{details.about || "This user hasn't added a bio yet."}</p></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 pt-6 border-t border-gray-100">
                                    <div className="flex items-start md:col-span-2"><MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-sm text-gray-500">Location</p><p className="font-medium text-gray-900">{user.location || details.address || 'Not specified'}</p></div></div>
                                    <div className="flex items-start"><Globe className="h-5 w-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-sm text-gray-500">Languages</p><p className="font-medium text-gray-900">{details.languages || 'Not specified'}</p></div></div>
                                    <div className="flex items-start"><Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-sm text-gray-500">Phone</p><p className="font-medium text-gray-900">{details.phoneNumber || 'Not specified'}</p></div></div>
                                    <div className="flex items-start"><Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-sm text-gray-500">Member since</p><p className="font-medium text-gray-900">{details.memberSince}</p></div></div>
                                    {details.gender && <div className="flex items-start"><User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-sm text-gray-500">Gender</p><p className="font-medium text-gray-900">{details.gender}</p></div></div>}
                                    {details.age && <div className="flex items-start"><Heart className="h-5 w-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-sm text-gray-500">Age</p><p className="font-medium text-gray-900">{details.age} years old</p></div></div>}
                                    {details.dateOfBirth && <div className="flex items-start"><Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-sm text-gray-500">Date of Birth</p><p className="font-medium text-gray-900">{new Date(details.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div></div>}
                                    {details.nationalIdNumber && <div className="flex items-start"><CreditCard className="h-5 w-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-sm text-gray-500">National ID</p><p className="font-medium text-gray-900">••••{details.nationalIdNumber.slice(-4)}</p></div></div>}
                                    {details.driversLicenseNumber && <div className="flex items-start"><FileText className="h-5 w-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-sm text-gray-500">Driver's License</p><p className="font-medium text-gray-900">••••{details.driversLicenseNumber.slice(-4)}</p>{details.driversLicenseExpiry && <p className="text-xs text-gray-400">Expires: {new Date(details.driversLicenseExpiry).toLocaleDateString()}</p>}</div></div>}
                                    {details.preferredCarType && <div className="flex items-start md:col-span-2"><Bell className="h-5 w-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-sm text-gray-500">Prefers</p><p className="font-medium text-gray-900">{details.preferredCarType} vehicles</p></div></div>}
                                </div>
                                <div className="pt-6 border-t border-gray-100"><h3 className="text-sm font-medium text-gray-500 mb-4">Stats</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-4"><div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-[#00A699]">{details.trips}</div><div className="text-xs text-gray-500">Trips</div></div><div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-[#00A699]">{details.reviews}</div><div className="text-xs text-gray-500">Reviews</div></div><div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-[#00A699]">{details.rating}</div><div className="text-xs text-gray-500">Rating</div></div><div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-[#00A699]">{details.responseRate || 0}%</div><div className="text-xs text-gray-500">Response</div></div></div></div>
                            </div>
                        )}
                    </div>
                )}

                {/* REVIEWS TAB */}
                {activeTab === 'reviews' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex items-center mb-8"><h2 className="text-xl font-bold text-gray-900 mr-4">{user.reviews} Reviews</h2><div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"><Star className="h-4 w-4 text-[#00A699] fill-current mr-1.5" /><span className="font-bold text-gray-900">{user.rating}</span><span className="text-gray-500 text-sm ml-1">overall rating</span></div></div>
                        {renderReviews()}
                    </div>
                )}

                {/* VERIFICATIONS TAB */}
                {activeTab === 'verifications' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Trust & Verification</h2>
                        <p className="text-gray-500 mb-8">Verifications help build trust in the community and keep everyone safe.</p>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-xl"><div className="flex items-center"><div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mr-4"><Mail className="h-5 w-5 text-gray-600" /></div><div><p className="font-semibold text-gray-900">Email address</p><p className="text-sm text-gray-500">{details.email || 'Not provided'}</p></div></div>{renderVerificationStatus(details.verifiedEmail)}</div>
                            <div className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-xl"><div className="flex items-center"><div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mr-4"><Phone className="h-5 w-5 text-gray-600" /></div><div><p className="font-semibold text-gray-900">Phone number</p><p className="text-sm text-gray-500">{details.phoneNumber || 'Not provided'}</p></div></div>{renderVerificationStatus(details.verifiedPhone)}</div>
                            <div className="p-5 bg-white border border-gray-100 rounded-xl"><div className="flex items-center justify-between mb-4"><div className="flex items-center"><div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mr-4"><CreditCard className="h-5 w-5 text-gray-600" /></div><div><p className="font-semibold text-gray-900">Driver's license</p><p className="text-sm text-gray-500">{details.driversLicenseNumber ? `Number: ••••${details.driversLicenseNumber.slice(-4)}` : 'Not provided'}</p>{details.driversLicenseExpiry && <p className="text-xs text-gray-400">Expires: {new Date(details.driversLicenseExpiry).toLocaleDateString()}</p>}</div></div>{renderVerificationStatus(details.verifiedLicense)}</div>{isEditing && <div className="mt-4 pt-4 border-t border-gray-100">{renderFileUpload('Driver\'s License Image', details.driversLicenseUrl, uploadingLicense, () => licenseInputRef.current?.click(), licenseInputRef, handleLicenseUpload)}</div>}{details.driversLicenseUrl && !isEditing && <div className="mt-4 pt-4 border-t border-gray-100"><a href={details.driversLicenseUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-[#00A699] hover:underline"><FileText className="h-4 w-4" />View license document</a></div>}</div>
                            <div className="p-5 bg-white border border-gray-100 rounded-xl"><div className="flex items-center justify-between mb-4"><div className="flex items-center"><div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mr-4"><Shield className="h-5 w-5 text-gray-600" /></div><div><p className="font-semibold text-gray-900">Government ID</p><p className="text-sm text-gray-500">{details.nationalIdNumber ? `ID: ••••${details.nationalIdNumber.slice(-4)}` : 'Not provided'}</p></div></div>{renderVerificationStatus(details.verifiedId)}</div>{isEditing && <div className="mt-4 pt-4 border-t border-gray-100">{renderFileUpload('Government ID Image', details.nationalIdNumber ? 'Uploaded' : undefined, uploadingId, () => idInputRef.current?.click(), idInputRef, handleIdUpload)}</div>}</div>
                        </div>
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg"><p className="text-sm text-blue-700"><strong>Note:</strong> Verifying your identity helps build trust with hosts and guests. Verified users are more likely to have successful bookings.</p></div>
                    </div>
                )}

                {/* RESERVATIONS TAB */}
                {activeTab === 'reservations' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Reservations</h2>
                        {renderReservations()}
                    </div>
                )}
            </div>
        </div>
    )
}