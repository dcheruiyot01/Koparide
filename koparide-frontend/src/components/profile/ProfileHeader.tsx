import React from 'react'
import {
    MapPin,
    Calendar,
    CheckCircle2,
    ShieldCheck,
    Mail,
    Phone,
    CreditCard,
} from 'lucide-react'
export interface UserProfile {
    name: string
    initials: string
    location: string
    memberSince: string
    responseRate: number
    trips: number
    reviews: number
    rating: number
    verifiedEmail: boolean
    verifiedPhone: boolean
    verifiedLicense: boolean
    verifiedId: boolean
}
interface ProfileHeaderProps {
    user: UserProfile
    onEditProfile: () => void
}
export function ProfileHeader({ user, onEditProfile }: ProfileHeaderProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col items-center text-center border-b border-gray-100">
                {/* Avatar */}
                <div className="h-24 w-24 bg-[#00A699] rounded-full flex items-center justify-center mb-4 shadow-md">
                    <span className="text-white text-3xl font-bold">{user.initials}</span>
                </div>

                {/* Name & Basic Info */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h1>

                <div className="flex items-center text-gray-500 text-sm mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{user.location}</span>
                </div>

                <div className="flex items-center text-gray-500 text-sm mb-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Member since {user.memberSince}</span>
                </div>

                {/* Response Rate */}
                <div className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    {user.responseRate}% response rate
                </div>

                {/* Edit Button */}
                <button
                    onClick={onEditProfile}
                    className="w-full py-2.5 border-2 border-[#00A699] text-[#00A699] font-semibold rounded-full hover:bg-[#00A699] hover:text-white transition-colors"
                >
                    Edit Profile
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{user.trips}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                        Trips
                    </p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{user.reviews}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                        Reviews
                    </p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{user.rating}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                        Rating
                    </p>
                </div>
            </div>

            {/* Verifications Summary */}
            <div className="p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                    Verified Info
                </h3>
                <div className="space-y-3">
                    {user.verifiedEmail && (
                        <div className="flex items-center text-gray-700 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                            Email address
                        </div>
                    )}
                    {user.verifiedPhone && (
                        <div className="flex items-center text-gray-700 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                            Phone number
                        </div>
                    )}
                    {user.verifiedLicense && (
                        <div className="flex items-center text-gray-700 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                            Driver's license
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
