// seeders/20260310-profile-seed.js
const { Profile } = require('../models'); // adjust path if needed

async function seedProfiles() {
    try {
        await Profile.bulkCreate([
            {
                userid: 1,
                firstName: 'Demo',
                lastName: 'Example',
                phoneNumber: '+254700000001',
                nationalIdNumber: '12345678',
                driversLicenseNumber: 'DL-001',
                gender: 'Male',
                dateOfBirth: '1990-05-15',
                profileImageUrl: 'https://localhost:4000/uploads/profiles/1772651839168-764418797.png',
                driversLicenseUrl: 'https://localhost:4000/uploads/profiles/1772651839168-764418797.png',
                address: 'Machakos, Kenya',
                about: 'Car enthusiast and frequent renter.',
                rentalCount: 5,
                rating: 4.5,
                preferredCarType: 'SUV',
                languagePreference: 'en',
                notificationPreferences: { email: true, sms: true, push: true }
            },
            {
                userid: 2,
                firstName: 'Daniel',
                lastName: 'Cheruiyot',
                phoneNumber: '+254700000002',
                nationalIdNumber: '87654321',
                driversLicenseNumber: 'DL-002',
                gender: 'Male',
                dateOfBirth: '1991-01-15',
                profileImageUrl: 'https://localhost:4000/uploads/profiles/1772651839168-764418797.png',
                driversLicenseUrl: 'https://localhost:4000/uploads/profiles/1772651839168-764418797.png',
                address: 'Nairobi, Kenya',
                about: 'Loves road trips and exploring new places.',
                rentalCount: 2,
                rating: 4.0,
                preferredCarType: 'Sedan',
                languagePreference: 'en',
                notificationPreferences: { email: true, sms: false, push: true }
            }
        ]);

        console.log('✅ Profiles seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding profiles:', error);
    }
}

seedProfiles();
