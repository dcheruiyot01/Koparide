import React, { useState } from 'react'
import {
    MapPin,
    Globe,
    Briefcase,
    GraduationCap,
    Star,
    Mail,
    Phone,
    CreditCard,
    Shield,
    CheckCircle2,
    XCircle,
    Edit2,
} from 'lucide-react'
import type { UserProfile } from "../profile/ProfileHeader"
export interface UserDetails {
    bio: string
    languages: string
    work: string
    school: string
}
interface ProfileTabsProps {
    user: UserProfile
    details: UserDetails
    activeTab: 'about' | 'reviews' | 'verifications'
    onTabChange: (tab: 'about' | 'reviews' | 'verifications') => void
        isEditing: boolean
    onToggleEdit: () => void
        onSaveProfile: (newDetails: UserDetails) => void
}
// Mock Reviews Data
const mockReviews = [
    {
        id: 1,
        author: 'Sarah M.',
        initials: 'SM',
        date: 'October 2023',
        rating: 5,
        text: 'John was a fantastic host! The car was spotless and exactly as described. Communication was prompt and pickup/dropoff was a breeze. Highly recommend!',
        car: 'Tesla Model 3 2022',
    },
    {
        id: 2,
        author: 'David L.',
        initials: 'DL',
        date: 'August 2023',
        rating: 5,
        text: 'Great experience renting from John. He was very accommodating when my flight was delayed. The car drives perfectly.',
        car: 'BMW 3 Series 2021',
    },
    {
        id: 3,
        author: 'Emily R.',
        initials: 'ER',
        date: 'June 2023',
        rating: 4,
        text: 'Good car, clean interior. Pickup location was a bit tricky to find but John helped guide me over the phone.',
        car: 'Toyota RAV4 2020',
    },
    {
        id: 4,
        author: 'Michael T.',
        initials: 'MT',
        date: 'April 2023',
        rating: 5,
        text: 'Seamless rental. The Tesla was fully charged and ready to go. John gave a quick walkthrough of the features since it was my first time driving an EV.',
        car: 'Tesla Model 3 2022',
    },
]
export function ProfileTabs({
                                user,
                                details,
                                activeTab,
                                onTabChange,
                                isEditing,
                                onToggleEdit,
                                onSaveProfile,
                            }: ProfileTabsProps) {
    const [editForm, setEditForm] = useState<UserDetails>(details)
    const handleSave = () => {
        onSaveProfile(editForm)
    }
    const handleCancel = () => {
        setEditForm(details)
        onToggleEdit()
    }
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 px-2 sm:px-6 overflow-x-auto">
                <button
                    onClick={() => onTabChange('about')}
                    className={`px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'about' ? 'border-[#00A699] text-[#00A699]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    About
                </button>
                <button
                    onClick={() => onTabChange('reviews')}
                    className={`px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-[#00A699] text-[#00A699]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Reviews ({user.reviews})
                </button>
                <button
                    onClick={() => onTabChange('verifications')}
                    className={`px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'verifications' ? 'border-[#00A699] text-[#00A699]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Verifications
                </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-8">
                {/* ABOUT TAB */}
                {activeTab === 'about' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                About {user.name.split(' ')[0]}
                            </h2>
                            {!isEditing && (
                                <button
                                    onClick={onToggleEdit}
                                    className="p-2 text-gray-400 hover:text-[#00A699] hover:bg-[#00A699]/10 rounded-full transition-colors"
                                    aria-label="Edit profile"
                                >
                                    <Edit2 className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Bio
                                    </label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                bio: e.target.value,
                                            })
                                        }
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none transition"
                                        placeholder="Tell others about yourself..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Languages
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.languages}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    languages: e.target.value,
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Work
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.work}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    work: e.target.value,
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none transition"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            School
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.school}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    school: e.target.value,
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleSave}
                                        className="bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-2.5 rounded-full font-medium transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {details.bio || "This user hasn't added a bio yet."}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 pt-6 border-t border-gray-100">
                                    <div className="flex items-start">
                                        <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Lives in</p>
                                            <p className="font-medium text-gray-900">
                                                {user.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <Globe className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Languages</p>
                                            <p className="font-medium text-gray-900">
                                                {details.languages || 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <Briefcase className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Work</p>
                                            <p className="font-medium text-gray-900">
                                                {details.work || 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <GraduationCap className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">School</p>
                                            <p className="font-medium text-gray-900">
                                                {details.school || 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* REVIEWS TAB */}
                {activeTab === 'reviews' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex items-center mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mr-4">
                                {user.reviews} Reviews
                            </h2>
                            <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <Star className="h-4 w-4 text-[#00A699] fill-current mr-1.5" />
                                <span className="font-bold text-gray-900">{user.rating}</span>
                                <span className="text-gray-500 text-sm ml-1">
                  overall rating
                </span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {mockReviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-gray-600 font-semibold text-sm">
                          {review.initials}
                        </span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {review.author}
                                                </p>
                                                <p className="text-xs text-gray-500">{review.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < review.rating ? 'text-[#00A699] fill-current' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-700 mb-3">{review.text}</p>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Rented: {review.car}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* VERIFICATIONS TAB */}
                {activeTab === 'verifications' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Trust & Verification
                        </h2>
                        <p className="text-gray-500 mb-8">
                            Verifications help build trust in the community and keep everyone
                            safe.
                        </p>

                        <div className="space-y-0 divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                            {/* Email */}
                            <div className="flex items-center justify-between p-5 bg-white">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mr-4">
                                        <Mail className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Email address</p>
                                        <p className="text-sm text-gray-500">
                                            For receipts and account updates
                                        </p>
                                    </div>
                                </div>
                                {user.verifiedEmail ? (
                                    <div className="flex items-center text-green-600 text-sm font-medium">
                                        <CheckCircle2 className="h-5 w-5 mr-1.5" />
                                        Verified
                                    </div>
                                ) : (
                                    <button className="text-[#00A699] text-sm font-semibold hover:underline">
                                        Verify
                                    </button>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="flex items-center justify-between p-5 bg-white">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mr-4">
                                        <Phone className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Phone number</p>
                                        <p className="text-sm text-gray-500">
                                            For trip updates and communication
                                        </p>
                                    </div>
                                </div>
                                {user.verifiedPhone ? (
                                    <div className="flex items-center text-green-600 text-sm font-medium">
                                        <CheckCircle2 className="h-5 w-5 mr-1.5" />
                                        Verified
                                    </div>
                                ) : (
                                    <button className="text-[#00A699] text-sm font-semibold hover:underline">
                                        Verify
                                    </button>
                                )}
                            </div>

                            {/* License */}
                            <div className="flex items-center justify-between p-5 bg-white">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mr-4">
                                        <CreditCard className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Driver's license
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Required to book or host cars
                                        </p>
                                    </div>
                                </div>
                                {user.verifiedLicense ? (
                                    <div className="flex items-center text-green-600 text-sm font-medium">
                                        <CheckCircle2 className="h-5 w-5 mr-1.5" />
                                        Verified
                                    </div>
                                ) : (
                                    <button className="text-[#00A699] text-sm font-semibold hover:underline">
                                        Verify
                                    </button>
                                )}
                            </div>

                            {/* Gov ID */}
                            <div className="flex items-center justify-between p-5 bg-white">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mr-4">
                                        <Shield className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Government ID</p>
                                        <p className="text-sm text-gray-500">
                                            Extra layer of security
                                        </p>
                                    </div>
                                </div>
                                {user.verifiedId ? (
                                    <div className="flex items-center text-green-600 text-sm font-medium">
                                        <CheckCircle2 className="h-5 w-5 mr-1.5" />
                                        Verified
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center text-gray-400 text-sm font-medium">
                                            <XCircle className="h-5 w-5 mr-1.5" />
                                            Not verified
                                        </div>
                                        <button className="text-[#00A699] text-sm font-semibold hover:underline">
                                            Verify
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
