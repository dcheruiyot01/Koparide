// pages/ProfilePage.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../layout/NavBar';
import { Footer } from '../layout/Footer';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import type { UserProfileData, UserDetails } from '../types/profile';
import api from '../api/axios';
import { AuthContext } from '../auth/AuthContext';

export const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'verifications'>('about');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect if not logged in
    useEffect(() => {
        if (!auth?.user) {
            navigate('/login');
        }
    }, [auth, navigate]);

    // Fetch profile data
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!auth?.user?.id) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch user profile data
                const response = await api.get(`/api/profile`);

                if (response.data) {
                    const data: UserProfileData = response.data;
                    setProfileData(data);
                    console.log('data', data);
                    // Transform to UserDetails format
                    const details: UserDetails = {
                        about: data?.about ?? '',
                        languages: data?.languagePreference === 'en'
                            ? 'English'
                            : data?.languagePreference ?? 'Not specified',
                        phoneNumber: data?.phoneNumber ?? 'Not specified',
                        address: data?.address ?? 'Not specified',
                        rentalCount: data?.rentalCount ?? 0,
                        rating: Number(data?.rating ?? 0),
                        memberSince: data?.createdAt
                            ? new Date(data.createdAt).getFullYear().toString()
                            : 'Unknown',
                        responseRate: 98, // TODO: replace with actual calculation
                        trips: data?.rentalCount ?? 0,
                        reviews: 8, // TODO: fetch from reviews API
                        verifiedEmail: Boolean(data?.isVerified),
                        verifiedPhone: Boolean(data?.phoneNumber),
                        verifiedLicense: Boolean(data?.driversLicenseUrl),
                        verifiedId: Boolean(data?.nationalIdNumber),
                    };

                    setUserDetails(details);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                setError('Failed to load profile data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [auth?.user?.id]);

    // Handle profile picture upload
    const handleProfilePictureUpload = async (file: File) => {
        if (!auth?.user?.id || !profileData) return;

        try {
            setUploadingImage(true);

            const formData = new FormData();
            formData.append('profileImage', file);

            const response = await api.post(`/api/users/${auth.user.id}/profile/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data) {
                // Update profile data with new image URL
                setProfileData(prev => prev ? {
                    ...prev,
                    profile: {
                        ...prev.profile,
                        profileImageUrl: response.data.profileImageUrl
                    }
                } : null);
            }
        } catch (err) {
            console.error('Failed to upload profile picture:', err);
            alert('Failed to upload profile picture. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };

    // Handle profile save
    const handleSaveProfile = async (newDetails: UserDetails) => {
        if (!auth?.user?.id || !profileData) return;

        try {
            setLoading(true);

            // Update profile data
            const updateData = {
                about: newDetails.about,
                languagePreference: newDetails.languages === 'English' ? 'en' : newDetails.languages,
                phoneNumber: newDetails.phoneNumber,
                address: newDetails.address,
            };

            const response = await api.put(`/api/profile`, updateData);

            if (response.data) {
                setUserDetails(newDetails);
                setIsEditing(false);
            }
        } catch (err) {
            console.error('Failed to update profile:', err);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
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
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A699] mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading profile...</p>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Error state
    if (error || !profileData || !userDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="flex-grow pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md mx-auto">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                            <p className="text-red-600 mb-6">{error || 'Failed to load profile'}</p>
                            <button
                                onClick={() => window.location.reload()}
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

    // Transform profile data for ProfileHeader
    const headerUser = {
        name: `${profileData?.firstName ?? ''} ${profileData?.lastName ?? ''}`.trim(),
        initials: `${profileData?.firstName?.[0] ?? ''}${profileData?.lastName?.[0] ?? ''}`,
        location: profileData?.address ?? 'Location not set',
        memberSince: userDetails?.memberSince ?? 'Unknown',
        responseRate: userDetails?.responseRate ?? 0,
        trips: userDetails?.trips ?? 0,
        reviews: userDetails?.reviews ?? 0,
        rating: userDetails?.rating ?? 0,
        verifiedEmail: Boolean(userDetails?.verifiedEmail),
        verifiedPhone: Boolean(userDetails?.verifiedPhone),
        verifiedLicense: Boolean(userDetails?.verifiedLicense),
        verifiedId: Boolean(userDetails?.verifiedId),
        profileImageUrl: profileData?.profileImageUrl ?? '',
        onProfileImageUpload: handleProfilePictureUpload,
        uploadingImage: uploadingImage ?? false,
    };


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Left Sidebar */}
                        <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24">
                            <ProfileHeader
                                user={headerUser}
                                onEditProfile={handleEditProfileClick}
                            />
                        </div>

                        {/* Right Content Area */}
                        <div className="w-full lg:flex-1">
                            <ProfileTabs
                                user={headerUser}
                                details={userDetails}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                isEditing={isEditing}
                                onToggleEdit={() => setIsEditing(!isEditing)}
                                onSaveProfile={handleSaveProfile}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};