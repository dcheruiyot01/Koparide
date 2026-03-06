import React, { useState } from 'react'
import { Navbar } from '../layout/NavBar'
import { Footer } from '../layout/Footer'
import { ProfileHeader } from '../components/profile/ProfileHeader'
import type { UserProfile } from '../components/profile/ProfileHeader'
import  { ProfileTabs } from '../components/profile/ProfileTabs'
import type { UserDetails } from '../components/profile/ProfileTabs'
// TODO: Remove Mock Data
const mockUser: UserProfile = {
    name: 'John Doe',
    initials: 'JD',
    location: 'San Francisco, CA',
    memberSince: '2021',
    responseRate: 98,
    trips: 12,
    reviews: 8,
    rating: 4.9,
    verifiedEmail: true,
    verifiedPhone: true,
    verifiedLicense: true,
    verifiedId: false,
}
const initialDetails: UserDetails = {
    bio: "Hi, I'm John! I'm a software engineer living in SF. I love road trips down the PCH and exploring national parks on the weekends. I take great care of my cars and expect the same from my guests. Always happy to provide local recommendations for food and sights!",
    languages: 'English, Spanish',
    work: 'Software Engineer at TechCorp',
    school: 'UC Berkeley',
}
export const ProfilePage=()=> {
    const [activeTab, setActiveTab] = useState<
        'about' | 'reviews' | 'verifications'
    >('about')
    const [isEditing, setIsEditing] = useState(false)
    const [userDetails, setUserDetails] = useState<UserDetails>(initialDetails)
    const handleSaveProfile = (newDetails: UserDetails) => {
        setUserDetails(newDetails)
        setIsEditing(false)
    }
    const handleEditProfileClick = () => {
        setActiveTab('about')
        setIsEditing(true)
    }
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Page Layout: Sidebar + Content */}
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Left Sidebar (Sticky on desktop) */}
                        <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24">
                            <ProfileHeader
                                user={mockUser}
                                onEditProfile={handleEditProfileClick}
                            />
                        </div>

                        {/* Right Content Area */}
                        <div className="w-full lg:flex-1">
                            <ProfileTabs
                                user={mockUser}
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
    )
}
