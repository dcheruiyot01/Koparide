// pages/ProfilePage.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../layout/NavBar';
import { Footer } from '../layout/Footer';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import type { UserProfileData, UserDetails } from '../types/profile';
import api from '../api/axios';
import { AuthContext } from '../auth/AuthContext';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'verifications' | 'reservations'>('about');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [saving, setSaving] = useState(false);

    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    // Auto-dismiss success message after 5 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Auto-dismiss error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Redirect if not logged in
    useEffect(() => {
        if (!auth?.user) navigate('/login');
    }, [auth, navigate]);

    // Transform API data to UserDetails format
    const transformToUserDetails = useCallback((data: UserProfileData): UserDetails => ({
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
        notificationPreferences: data.notificationPreferences || { email: true, sms: false, push: true },
    }), []);

    // Fetch profile data
    const fetchProfileData = useCallback(async () => {
        if (!auth?.user?.id) return;
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/api/profile');
            const data: UserProfileData = response.data.user || response.data;
            setProfileData(data);
            setUserDetails(transformToUserDetails(data));
        } catch (err: any) {
            console.error('Failed to fetch profile:', err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, [auth?.user?.id, transformToUserDetails]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    // Handle profile picture upload
    const handleProfilePictureUpload = async (file: File) => {
        if (!auth?.user?.id) return;
        const formData = new FormData();
        formData.append('profileImage', file);
        try {
            setUploadingImage(true);
            const response = await api.post(`/api/users/${auth.user.id}/profile/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data?.profileImageUrl) {
                setProfileData(prev => prev ? { ...prev, profileImageUrl: response.data.profileImageUrl } : null);
                setSuccessMessage('Profile picture updated successfully');
            }
        } catch (err: any) {
            console.error('Failed to upload profile picture:', err);
            setError(err.response?.data?.message || 'Failed to upload profile picture');
        } finally {
            setUploadingImage(false);
        }
    };

    // Handle profile save – shows success/error messages
    const handleSaveProfile = async (newDetails: UserDetails) => {
        if (!auth?.user?.id) return;
        try {
            setSaving(true);
            const updateData = {
                firstName: newDetails.firstName,
                lastName: newDetails.lastName,
                about: newDetails.about,
                languagePreference: newDetails.languages === 'English' ? 'en' : newDetails.languages,
                phoneNumber: newDetails.phoneNumber !== 'Not specified' ? newDetails.phoneNumber : '',
                address: newDetails.address !== 'Not specified' ? newDetails.address : '',
                nationalIdNumber: newDetails.nationalIdNumber,
                gender: newDetails.gender,
                dateOfBirth: newDetails.dateOfBirth,
                preferredCarType: newDetails.preferredCarType,
                driversLicenseNumber: newDetails.driversLicenseNumber,
                driversLicenseExpiry: newDetails.driversLicenseExpiry,
                notificationPreferences: newDetails.notificationPreferences,
            };
            const response = await api.put('/api/profile', updateData);
            if (response.data?.user || response.data) {
                const updatedData = response.data.user || response.data;
                setProfileData(updatedData);
                setUserDetails(transformToUserDetails(updatedData));
                setIsEditing(false);
                setSuccessMessage(response.data.message || 'Profile updated successfully');
            }
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleEditProfileClick = () => {
        setActiveTab('about');
        setIsEditing(true);
    };

    // Loading state
    if (loading && !profileData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="flex-grow pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A699] mx-auto" />
                                <p className="mt-4 text-gray-600">Loading profile...</p>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Error state (only when no profile data and error is set)
    if ((error && !profileData) || (!profileData && !userDetails)) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="flex-grow pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md mx-auto">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                            <p className="text-red-600 mb-6">{error || 'Failed to load profile'}</p>
                            <button
                                onClick={fetchProfileData}
                                className="bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-2 rounded-lg font-medium transition"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Transform profile data for ProfileHeader (safe because we have profileData and userDetails)
    const headerUser = {
        name: `${profileData!.firstName ?? ''} ${profileData!.lastName ?? ''}`.trim() || 'User',
        initials: `${profileData!.firstName?.[0] ?? ''}${profileData!.lastName?.[0] ?? ''}`.toUpperCase() || 'U',
        location: profileData!.address || 'Location not set',
        memberSince: userDetails!.memberSince,
        responseRate: userDetails!.responseRate,
        trips: userDetails!.trips,
        reviews: userDetails!.reviews,
        rating: userDetails!.rating,
        verifiedEmail: userDetails!.verifiedEmail,
        verifiedPhone: userDetails!.verifiedPhone,
        verifiedLicense: userDetails!.verifiedLicense,
        verifiedId: userDetails!.verifiedId,
        profileImageUrl: profileData!.profileImageUrl || '',
        onProfileImageUpload: handleProfilePictureUpload,
        uploadingImage,
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Toast / Banner for success and error messages */}
                    {(successMessage || error) && (
                        <div className={`mb-6 rounded-lg p-4 flex items-center justify-between shadow-md ${
                            successMessage ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                            <div className="flex items-center gap-2">
                                {successMessage ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                )}
                                <span className={successMessage ? 'text-green-800' : 'text-red-800'}>
                                    {successMessage || error}
                                </span>
                            </div>
                            <button
                                onClick={() => { setSuccessMessage(null); setError(null); }}
                                className="text-gray-500 hover:text-gray-700"
                                aria-label="Dismiss"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Left Sidebar */}
                        <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24">
                            <ProfileHeader user={headerUser} onEditProfile={handleEditProfileClick} />
                        </div>

                        {/* Right Content Area */}
                        <div className="w-full lg:flex-1">
                            <ProfileTabs
                                user={headerUser}
                                details={userDetails!}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                isEditing={isEditing}
                                onToggleEdit={() => setIsEditing(!isEditing)}
                                onSaveProfile={handleSaveProfile}
                                saveLoading={saving}
                                onShowSuccess={setSuccessMessage}
                                onShowError={setError}
                            />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProfilePage;