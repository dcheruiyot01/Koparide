// pages/admin/AdminUserProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../layout/NavBar';
import { Footer } from '../../layout/Footer';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileTabs } from '../../components/profile/ProfileTabs';
import type { UserProfileData, UserDetails } from '../../types/profile';
import api from '../../api/axios';
import { Loader2, ArrowLeft } from 'lucide-react';

export const AdminUserProfile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'verifications' | 'reservations'>('about');

    useEffect(() => {
        // Guard: if no userId in URL, show error
        if (!userId) {
            setError('User ID is missing from the URL.');
            setLoading(false);
            return;
        }

        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get(`/api/admin/users/${userId}/profile`);
                const data = res.data.user;
                if (!data) throw new Error('No user data received');
                setProfileData(data);
                // Transform to UserDetails
                setUserDetails({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    about: data.about || '',
                    languages: data.languagePreference === 'en' ? 'English' : data.languagePreference || 'Not specified',
                    phoneNumber: data.phoneNumber || 'Not specified',
                    address: data.address || 'Not specified',
                    rentalCount: data.rentalCount || 0,
                    rating: Number(data.rating) || 0,
                    memberSince: data.createdAt ? new Date(data.createdAt).getFullYear().toString() : 'Unknown',
                    responseRate: data.responseRate || 98,
                    trips: data.rentalCount || 0,
                    reviews: data.reviewCount || 0,
                    verifiedEmail: data.isVerified || false,
                    verifiedPhone: !!data.phoneNumber,
                    verifiedLicense: !!data.driversLicenseUrl,
                    verifiedId: !!data.nationalIdNumber,
                    nationalIdNumber: data.nationalIdNumber,
                    driversLicenseUrl: data.driversLicenseUrl,
                    driversLicenseNumber: data.driversLicenseNumber,
                    driversLicenseExpiry: data.driversLicenseExpiry,
                    gender: data.gender,
                    dateOfBirth: data.dateOfBirth,
                    preferredCarType: data.preferredCarType,
                    notificationPreferences: { email: true, sms: false, push: true },
                });
            } catch (err: any) {
                console.error('Fetch user profile error:', err);
                setError(err.response?.data?.message || 'Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00A699]" />
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !profileData || !userDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error || 'User not found'}</p>
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="bg-[#00A699] text-white px-4 py-2 rounded-lg"
                        >
                            Back to Users
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const headerUser = {
        name: `${profileData.firstName ?? ''} ${profileData.lastName ?? ''}`.trim() || 'User',
        initials: `${profileData.firstName?.[0] ?? ''}${profileData.lastName?.[0] ?? ''}`.toUpperCase() || 'U',
        location: profileData.address || 'Location not set',
        memberSince: userDetails.memberSince,
        responseRate: userDetails.responseRate,
        trips: userDetails.trips,
        reviews: userDetails.reviews,
        rating: userDetails.rating,
        verifiedEmail: userDetails.verifiedEmail,
        verifiedPhone: userDetails.verifiedPhone,
        verifiedLicense: userDetails.verifiedLicense,
        verifiedId: userDetails.verifiedId,
        profileImageUrl: profileData.profileImageUrl || '',
        onProfileImageUpload: () => {},
        uploadingImage: false,
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Users
                    </button>
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24">
                            <ProfileHeader user={headerUser} onEditProfile={() => {}} />
                        </div>
                        <div className="w-full lg:flex-1">
                            <ProfileTabs
                                user={headerUser}
                                details={userDetails}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                isEditing={false}
                                onToggleEdit={() => {}}
                                onSaveProfile={async () => {}}
                                saveLoading={false}
                                readOnly={true}
                            />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};