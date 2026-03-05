import React, { useEffect, useState } from "react";
import { User, Car } from "lucide-react";
import api from "../../api/axios";

// --------------------
// Types
// --------------------
interface Review {
    id: string;
    reviewer: string;
    comment: string;
    rating: number;
    createdAt: string;
}

interface Profile {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    nationalIdNumber?: string;
    gender?: string;
    dateOfBirth?: string;
    address: string;
    profileImageUrl: string;
    driversLicenseUrl?: string;
    rentalCount: number;
    rating: string;
    preferredCarType: string;
    languagePreference: string;
    createdAt: string;
    reviews?: Review[];
    about?: string;
}

// --------------------
// Component
// --------------------
export const ProfilePage = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadingLicense, setUploadingLicense] = useState(false);

    // Controls whether the page is in edit mode
    const [isEditing, setIsEditing] = useState(false);

    // Form state for editable fields
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        nationalIdNumber: "",
        driversLicenseUrl:"",
        gender: "",
        dateOfBirth: "",
        address: "",
        about: "",
        preferredCarType: "",
        languagePreference: "",
    });

    // --------------------
    // Scroll effect for navbar styling
    // --------------------
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // --------------------
    // Fetch profile on mount
    // --------------------
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get("/api/profile");
                setProfile(res.data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // --------------------
    // Populate form when profile loads
    // --------------------
    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                phoneNumber: profile.phoneNumber || "",
                nationalIdNumber: profile.nationalIdNumber || "",
                driversLicenseUrl: profile.driversLicenseUrl || "",
                gender: profile.gender || "",
                dateOfBirth: profile.dateOfBirth || "",
                address: profile.address || "",
                about: profile.about || "",
                preferredCarType: profile.preferredCarType || "",
                languagePreference: profile.languagePreference || "",
            });
        }
    }, [profile]);

    // --------------------
    // Helper: Resize image before upload
    // --------------------
    const resizeImage = (file: File, maxSize = 400): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };

            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Maintain aspect ratio
                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) return reject("Canvas not supported");

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject("Image resize failed");
                    },
                    "image/jpeg",
                    0.8
                );
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // --------------------
    // Upload profile image
    // --------------------
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);

            const resizedBlob = await resizeImage(file, 400);
            const resizedFile = new File([resizedBlob], file.name, { type: "image/jpeg" });

            const formData = new FormData();
            formData.append("image", resizedFile);

            const res = await api.post("/api/profile/upload-image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setProfile((prev) =>
                prev ? { ...prev, profileImageUrl: res.data.url } : prev
            );
        } catch (err) {
            console.error("Image upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    // --------------------
    // Upload driver's license
    // --------------------
    const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingLicense(true);

            const formData = new FormData();
            formData.append("license", file);
            formData.append("type", "license"); // <-- REQUIRED

            const res = await api.post("/api/profile/upload-license", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setProfile((prev) =>
                prev ? { ...prev, driversLicenseUrl: res.data.url } : prev
            );
        } catch (err) {
            console.error("License upload failed", err);
        } finally {
            setUploadingLicense(false);
        }
    };

    // --------------------
    // Save profile changes
    // --------------------
    const handleSaveProfile = async () => {
        try {
            const res = await api.put("/api/profile", formData);
            setProfile(res.data.profile);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
        }
    };

    // --------------------
    // Loading states
    // --------------------
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Loading profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Unable to load profile.</p>
            </div>
        );
    }

    // --------------------
    // Render
    // --------------------
    return (
        <div className="min-h-screen bg-gray-50">

            {/* -------------------- NAVBAR -------------------- */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white shadow">
                <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center cursor-pointer">
                        <Car className={`h-8 w-8 ${isScrolled ? "text-[#00A699]" : "text-black"}`} />
                        <span className="ml-2 text-xl font-bold text-gray-900">
              <a href="/" className="hover:text-indigo-600">
                WheelAway {`{Kopa Ride}`}
              </a>
            </span>
                    </div>

                    {/* Missing search + actions section */}
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="City, airport, address or hotel"
                            className="border rounded-md px-3 py-2 text-sm w-72"
                        />
                        <button className="text-sm font-medium text-gray-700 hover:text-gray-900">
                            Become a host
                        </button>
                        <button className="text-sm font-medium text-gray-700 hover:text-gray-900">
                            Ask WheelAway
                        </button>
                    </div>
                </div>
            </header>

            {/* -------------------- MAIN CONTENT -------------------- */}
            <main className="max-w-3xl mx-auto px-6 pt-24 pb-10">

                {/* Edit Profile Button */}
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
                        >
                            Cancel Editing
                        </button>
                    )}
                </div>

                {/* -------------------- PROFILE PHOTO -------------------- */}
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {profile.profileImageUrl ? (
                            <img src={profile.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-12 w-12 text-gray-400" />
                        )}
                    </div>

                    <label className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer">
                        {uploading ? "Uploading..." : "Change profile photo"}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                </div>
                </div>

                {/* -------------------- BASIC INFO -------------------- */}
                <div className="mt-6">
                    {!isEditing ? (
                        <>
                            <h2 className="text-lg font-semibold">
                                {profile.firstName} {profile.lastName}
                            </h2>
                            <p className="text-gray-600">Lives {profile.address}</p>
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="border p-2 rounded"
                                placeholder="First name"
                            />
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="border p-2 rounded"
                                placeholder="Last name"
                            />
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="border p-2 rounded col-span-2"
                                placeholder="Address"
                            />
                        </div>
                    )}

                    <p className="text-gray-600 mt-2">
                        Joined{" "}
                        {new Date(profile.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                        })}
                    </p>
                </div>

                {/* -------------------- PERSONAL INFO -------------------- */}
                <div className="mt-8">
                    <h3 className="text-md font-semibold">Personal Information</h3>

                    {!isEditing ? (
                        <div className="mt-3 space-y-2 text-gray-700 text-sm">
                            <p><strong>ID Number:</strong> {profile.nationalIdNumber || "Not provided"}</p>
                            <p><strong>Phone:</strong> {profile.phoneNumber || "Not provided"}</p>
                            <p><strong>Gender:</strong> {profile.gender || "Not specified"}</p>
                            <p><strong>Date of Birth:</strong>
                                {profile.dateOfBirth
                                    ? new Date(profile.dateOfBirth).toLocaleDateString()
                                    : "Not provided"}
                            </p>
                            <p><strong>Driver’s License:</strong>
                                {profile.driversLicenseUrl ? (
                                    <a
                                        href={profile.driversLicenseUrl}
                                        target="_blank"
                                        className="text-indigo-600 underline"
                                    >
                                        View License
                                    </a>
                                ) : (
                                    "Not uploaded"
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-3 grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={formData.nationalIdNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, nationalIdNumber: e.target.value })
                                }
                                className="border p-2 rounded"
                                placeholder="National ID"
                            />
                            <input
                                type="text"
                                value={formData.phoneNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, phoneNumber: e.target.value })
                                }
                                className="border p-2 rounded"
                                placeholder="Phone Number"
                            />

                            <select
                                value={formData.gender}
                                onChange={(e) =>
                                    setFormData({ ...formData, gender: e.target.value })
                                }
                                className="border p-2 rounded"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>

                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) =>
                                    setFormData({ ...formData, dateOfBirth: e.target.value })
                                }
                                className="border p-2 rounded"
                            />

                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">
                                    Upload Driver’s License
                                </label>

                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleLicenseUpload}
                                    className="border p-2 rounded w-full"
                                />

                                {uploadingLicense && (
                                    <p className="text-xs text-gray-500 mt-1">Uploading license...</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* -------------------- ABOUT -------------------- */}
                <div className="mt-8">
                    <h3 className="text-md font-semibold">About {profile.firstName}</h3>

                    {!isEditing ? (
                        <p className="mt-2 text-gray-700">{profile.about || "No bio yet."}</p>
                    ) : (
                        <textarea
                            value={formData.about}
                            onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                            className="mt-2 w-full border rounded-md p-3 text-sm min-h-[120px]"
                        />
                    )}
                </div>

                {/* -------------------- PREFERENCES -------------------- */}
                <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-gray-700">
                    {!isEditing ? (
                        <>
                            <p>Preferred car type: {profile.preferredCarType}</p>
                            <p>Language: {profile.languagePreference}</p>
                        </>
                    ) : (
                        <>
                            <input
                                type="text"
                                value={formData.preferredCarType}
                                onChange={(e) =>
                                    setFormData({ ...formData, preferredCarType: e.target.value })
                                }
                                className="border p-2 rounded"
                                placeholder="Preferred car type"
                            />
                            <input
                                type="text"
                                value={formData.languagePreference}
                                onChange={(e) =>
                                    setFormData({ ...formData, languagePreference: e.target.value })
                                }
                                className="border p-2 rounded"
                                placeholder="Language preference"
                            />
                        </>
                    )}
                </div>

                {/* -------------------- REVIEWS -------------------- */}
                <div className="mt-10">
                    <h3 className="text-md font-semibold">Reviews</h3>

                    {profile.reviews?.length ? (
                        <ul className="mt-4 space-y-4">
                            {profile.reviews.map((review) => (
                                <li key={review.id} className="border rounded-md p-4 bg-white shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{review.reviewer}</span>
                                        <span className="text-yellow-500">⭐ {review.rating}</span>
                                    </div>

                                    <p className="mt-2 text-gray-700">{review.comment}</p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-gray-500">No reviews yet.</p>
                    )}
                </div>

                {/* -------------------- SAVE / CANCEL BUTTONS -------------------- */}
                {isEditing && (
                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={handleSaveProfile}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Save Changes
                        </button>

                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};
