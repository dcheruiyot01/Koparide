// components/profile/ProfileHeader.tsx
import React from 'react'
import {
    MapPin,
    Calendar,
    CheckCircle2,
    ShieldCheck,
    Mail,
    Phone,
    CreditCard,
    User,
    Star,
    MessageCircle,
    AlertCircle,
} from 'lucide-react'

export interface UserProfile {
    id: string | number
    name: string
    firstName?: string
    lastName?: string
    initials: string
    email?: string
    phoneNumber?: string
    location: string
    address?: string
    memberSince: string
    responseRate: number
    trips: number
    reviews: number
    rating: number
    verifiedEmail: boolean
    verifiedPhone: boolean
    verifiedLicense: boolean
    verifiedId: boolean
    profileImageUrl?: string
    about?: string
    languages?: string
    preferredCarType?: string
}

interface ProfileHeaderProps {
    user: UserProfile
    onEditProfile: () => void
    isLoading?: boolean
    onViewAllReviews?: () => void
}

export function ProfileHeader({
                                  user,
                                  onEditProfile,
                                  isLoading = false,
                                  onViewAllReviews
                              }: ProfileHeaderProps) {

    // Helper function to get display name
    const getDisplayName = () => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        if (user.firstName) return user.firstName
        if (user.lastName) return user.lastName
        return user.name || 'User'
    }

    // Helper function to get member since formatted date
    const getFormattedMemberSince = () => {
        if (!user.memberSince) return 'Recently'

        try {
            const date = new Date(user.memberSince)
            if (isNaN(date.getTime())) return user.memberSince

            return date.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            })
        } catch {
            return user.memberSince
        }
    }

    // Helper function to get location display
    const getLocationDisplay = () => {
        return user.location || user.address || 'Location not specified'
    }

    // Get response rate color based on percentage
    const getResponseRateColor = () => {
        const rate = user.responseRate || 0
        if (rate >= 90) return 'bg-green-500'
        if (rate >= 70) return 'bg-yellow-500'
        if (rate >= 50) return 'bg-orange-500'
        return 'bg-red-500'
    }

    // Get response rate text
    const getResponseRateText = () => {
        const rate = user.responseRate || 0
        if (rate >= 90) return 'Excellent'
        if (rate >= 70) return 'Good'
        if (rate >= 50) return 'Fair'
        return 'Needs Improvement'
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="p-6 md:p-8 flex flex-col items-center text-center border-b border-gray-100">
                    <div className="h-24 w-24 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 w-32 bg-gray-200 rounded-full mb-6"></div>
                    <div className="h-10 w-full bg-gray-200 rounded-full"></div>
                </div>
            </div>
        )
    }

    // No user data state
    if (!user || Object.keys(user).length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col items-center text-center">
                    <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Unable to load profile
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Please try refreshing the page
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-[#00A699] text-white rounded-lg hover:bg-[#007A6E] transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            {/* Profile Header Section */}
            <div className="p-6 md:p-8 flex flex-col items-center text-center border-b border-gray-100">
                {/* Avatar with fallback */}
                <div className="relative">
                    {user.profileImageUrl ? (
                        <img
                            src={user.profileImageUrl}
                            alt={getDisplayName()}
                            className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
                        />
                    ) : (
                        <div className="h-24 w-24 bg-gradient-to-br from-[#00A699] to-[#007A6E] rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-3xl font-bold">
                                {user.initials || getDisplayName().charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}

                    {/* Online status indicator (optional) */}
                    <div className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                {/* Name & Basic Info */}
                <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">
                    {getDisplayName()}
                </h1>

                {/* Email (if available) */}
                {user.email && (
                    <div className="flex items-center text-gray-500 text-sm mb-1">
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        <span>{user.email}</span>
                    </div>
                )}

                {/* Location */}
                <div className="flex items-center text-gray-500 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>{getLocationDisplay()}</span>
                </div>

                {/* Member Since */}
                <div className="flex items-center text-gray-500 text-sm mt-1 mb-3">
                    <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>Joined {getFormattedMemberSince()}</span>
                </div>

                {/* Response Rate with dynamic styling */}
                {user.responseRate !== undefined && user.responseRate > 0 && (
                    <div className="inline-flex items-center bg-gray-50 px-3 py-1.5 rounded-full text-sm font-medium mb-6 border border-gray-100">
                        <div className={`h-2 w-2 ${getResponseRateColor()} rounded-full mr-2 animate-pulse`}></div>
                        <span className="text-gray-700">
                            {user.responseRate}% response rate
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                            ({getResponseRateText()})
                        </span>
                    </div>
                )}

                {/* Edit Profile Button */}
                <button
                    onClick={onEditProfile}
                    className="w-full py-2.5 border-2 border-[#00A699] text-[#00A699] font-semibold rounded-full hover:bg-[#00A699] hover:text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-100 focus:outline-none focus:ring-2 focus:ring-[#00A699] focus:ring-offset-2"
                    aria-label="Edit profile information"
                >
                    Edit Profile
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
                <div className="p-4 text-center transition-all hover:bg-gray-50">
                    <p className="text-2xl font-bold text-gray-900">
                        {user.trips || 0}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Trips
                    </p>
                </div>
                <div
                    className="p-4 text-center transition-all hover:bg-gray-50 cursor-pointer"
                    onClick={onViewAllReviews}
                >
                    <p className="text-2xl font-bold text-gray-900">
                        {user.reviews || 0}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                        <Star className="h-3 w-3" />
                        Reviews
                    </p>
                </div>
                <div className="p-4 text-center transition-all hover:bg-gray-50">
                    <p className="text-2xl font-bold text-gray-900">
                        {user.rating || 0}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Rating
                    </p>
                </div>
            </div>

            {/* Verifications Summary */}
            <div className="p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#00A699]" />
                    Verified Information
                </h3>

                {!user.verifiedEmail && !user.verifiedPhone && !user.verifiedLicense && !user.verifiedId ? (
                    <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No verified information yet</p>
                        <button
                            onClick={onEditProfile}
                            className="mt-2 text-xs text-[#00A699] hover:underline"
                        >
                            Complete your verification
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {user.verifiedEmail && (
                            <div className="flex items-center justify-between text-gray-700 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                    <span>Email address</span>
                                </div>
                                <Mail className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}

                        {user.verifiedPhone && (
                            <div className="flex items-center justify-between text-gray-700 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                    <span>Phone number</span>
                                </div>
                                <Phone className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}

                        {user.verifiedLicense && (
                            <div className="flex items-center justify-between text-gray-700 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                    <span>Driver's license</span>
                                </div>
                                <CreditCard className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}

                        {user.verifiedId && (
                            <div className="flex items-center justify-between text-gray-700 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                    <span>Government ID</span>
                                </div>
                                <ShieldCheck className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>
                )}

                {/* Verification progress indicator */}
                {user && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Profile completion</span>
                            <span>
                                {Math.floor(
                                    ([
                                        user.verifiedEmail,
                                        user.verifiedPhone,
                                        user.verifiedLicense,
                                        user.verifiedId,
                                        !!user.location,
                                        !!user.about,
                                    ].filter(Boolean).length / 6) * 100
                                )}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-[#00A699] h-1.5 rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.floor(
                                        ([
                                            user.verifiedEmail,
                                            user.verifiedPhone,
                                            user.verifiedLicense,
                                            user.verifiedId,
                                            !!user.location,
                                            !!user.about,
                                        ].filter(Boolean).length / 6) * 100
                                    )}%`
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Default export for compatibility with your existing imports
export default ProfileHeader