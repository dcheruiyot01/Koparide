// types/profile.ts
export interface Profile {
    id: number;
    userid: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    nationalIdNumber?: string;
    driversLicenseNumber: string;
    gender?: 'Male' | 'Female' | 'Other';
    dateOfBirth?: string;
    profileImageUrl?: string;
    driversLicenseUrl?: string;
    address?: string;
    about?: string;
    rentalCount: number;
    rating?: number;
    preferredCarType?: string;
    languagePreference: string;
    notificationPreferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'renter' | 'host' | 'admin';
    isVerified: boolean;
    authProvider: string;
    createdAt: string;
}

export interface UserProfileData {
    user: User;
    profile: Profile;
}

export interface UserDetails {
    about: string;
    languages: string;
    phoneNumber: string;
    address: string;
    rentalCount: number;
    rating: number;
    memberSince: string;
    responseRate?: number;
    trips: number;
    reviews: number;
    verifiedEmail: boolean;
    verifiedPhone: boolean;
    verifiedLicense: boolean;
    verifiedId: boolean;
}