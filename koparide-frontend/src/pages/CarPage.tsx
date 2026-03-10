import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Users, Gauge, Fuel, Car, Settings, Droplet, Star, AlertCircle } from "lucide-react";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import { LocationSearch } from "../components/locations/LocationsSearch";
import api from "../api/axios";

// ==================== TYPES ====================

/**
 * Car image interface matching API response
 */
interface CarImage {
    id: number;
    carId: number;
    url: string;
    altText: string;
    isPrimary: boolean;
    position: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * Owner/Renter interface
 */
interface User {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    defaultProfile?: string;
}

/**
 * Complete car interface matching API response
 */
interface Car {
    id: number;
    ownerId: number;
    make: string;
    model: string;
    year: number;
    pricePerDay: string;
    classification: string;
    seats: number;
    fuelType: string;
    mpg: string;
    transmission: string;
    cruiseControl: boolean;
    cc: number;
    status: string;
    is_deleted: boolean;
    rented_to: number | null;
    createdAt: string;
    updatedAt: string;
    imagesList: CarImage[];
    owner: User;
    renter: User | null;
    // Optional fields that might be added
    rating?: number;
    trips?: number;
    class?: string;
    classNote?: string;
}

// ==================== CONSTANTS ====================

/** Default profile image fallback */
const DEFAULT_PROFILE_IMAGE = "http://localhost:4000/uploads/licenses/profile.png";

/** Default car image fallback */
const DEFAULT_CAR_IMAGE = "https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=764&q=80";

/** Minimum days for booking */
const MIN_BOOKING_DAYS = 1;

/** Maximum days for booking */
const MAX_BOOKING_DAYS = 30;

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date for datetime-local input (YYYY-MM-DDTHH:MM)
 */
const getFormattedToday = (): string => {
    const today = new Date();
    return today.toISOString().slice(0, 16);
};

/**
 * Get tomorrow's date formatted for datetime-local
 */
const getFormattedTomorrow = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
};

/**
 * Calculate number of days between two dates (ignoring time)
 * Always returns at least 1 day
 */
const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return MIN_BOOKING_DAYS;

    // Create date objects and set to midnight to ignore time
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    // If end is before or equal to start, default to 1 day
    if (end <= start) return MIN_BOOKING_DAYS;

    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Round to nearest integer and ensure at least 1 day
    return Math.max(MIN_BOOKING_DAYS, Math.round(diffDays));
};

/**
 * Validate date range (ignoring time)
 */
const isValidDateRange = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return false;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return start >= now && end > start;
};

// ==================== MAIN COMPONENT ====================

export const CarPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // ==================== STATE ====================

    // Car data
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Image gallery
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);

    // Booking state - default to today and tomorrow for 1-day booking
    const [startDateTime, setStartDateTime] = useState<string>(getFormattedToday());
    const [endDateTime, setEndDateTime] = useState<string>(getFormattedTomorrow());
    const [days, setDays] = useState<number>(MIN_BOOKING_DAYS);
    const [location, setLocation] = useState<string>("");
    const [bookingError, setBookingError] = useState<string | null>(null);

    // Refs for performance
    const galleryRef = useRef<HTMLDivElement>(null);

    // ==================== DERIVED VALUES ====================

    /**
     * Calculate total price based on days and car price
     */
    const totalPrice = useMemo(() => {
        if (!car) return 0;
        return days * Number(car.pricePerDay);
    }, [car, days]);

    /**
     * Check if booking is valid
     */
    const isBookingValid = useMemo(() => {
        return (
            location.trim() !== "" &&
            isValidDateRange(startDateTime, endDateTime) &&
            days >= MIN_BOOKING_DAYS &&
            days <= MAX_BOOKING_DAYS
        );
    }, [location, startDateTime, endDateTime, days]);

    // ==================== EFFECTS ====================

    /**
     * Calculate days when dates change (ignoring time)
     */
    useEffect(() => {
        setDays(calculateDays(startDateTime, endDateTime));

        // Validate dates
        if (startDateTime && endDateTime) {
            const start = new Date(startDateTime);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDateTime);
            end.setHours(0, 0, 0, 0);

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            if (start < now) {
                setBookingError("Start date cannot be in the past");
            } else if (end <= start) {
                setBookingError("End date must be after start date");
            } else if (calculateDays(startDateTime, endDateTime) > MAX_BOOKING_DAYS) {
                setBookingError(`Maximum booking period is ${MAX_BOOKING_DAYS} days`);
            } else {
                setBookingError(null);
            }
        }
    }, [startDateTime, endDateTime]);

    /**
     * Fetch car details on mount or ID change
     */
    useEffect(() => {
        if (!id) {
            setFetchError("No car ID provided");
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        const fetchCar = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await api.get(`/api/cars/${id}`, {
                    signal: controller.signal,
                    timeout: 10000 // 10 second timeout
                });

                // Handle different response structures
                const raw = res.data?.data ?? res.data ?? null;

                if (!raw) {
                    setFetchError("Car not found");
                    setCar(null);
                    return;
                }

                // Validate required fields
                if (!raw.imagesList || !Array.isArray(raw.imagesList)) {
                    console.warn("Car has no images array, using empty array");
                    raw.imagesList = [];
                }

                // Normalize shape to Car interface
                const normalized: Car = {
                    id: raw.id,
                    ownerId: raw.ownerId,
                    make: raw.make || "Unknown",
                    model: raw.model || "Vehicle",
                    year: raw.year || new Date().getFullYear(),
                    pricePerDay: raw.pricePerDay || "0",
                    classification: raw.classification || "Standard",
                    seats: raw.seats || 5,
                    fuelType: raw.fuelType || "Gasoline",
                    mpg: raw.mpg || "0",
                    transmission: raw.transmission || "Automatic",
                    cruiseControl: raw.cruiseControl || false,
                    cc: raw.cc || 0,
                    status: raw.status || "pending",
                    is_deleted: raw.is_deleted || false,
                    rented_to: raw.rented_to || null,
                    createdAt: raw.createdAt || new Date().toISOString(),
                    updatedAt: raw.updatedAt || new Date().toISOString(),
                    imagesList: raw.imagesList,
                    owner: raw.owner || {
                        id: 0,
                        name: "Unknown Host",
                        email: "",
                        createdAt: new Date().toISOString(),
                    },
                    renter: raw.renter || null,
                    rating: raw.rating || 0,
                    trips: raw.trips || 0,
                    class: raw.class || "Standard",
                    classNote: raw.classNote || "Standard vehicle class",
                };

                setCar(normalized);

                // Log for debugging (remove in production)
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Car loaded:', normalized);
                }
            } catch (err: any) {
                // Handle different error types
                if (err.name === "CanceledError" || err.name === "AbortError") {
                    return; // Request was cancelled
                }

                if (err.code === "ECONNABORTED") {
                    setFetchError("Request timeout. Please check your connection.");
                } else if (err.response?.status === 404) {
                    setFetchError("Car not found");
                } else if (err.response?.status === 401) {
                    setFetchError("Unauthorized access");
                } else {
                    setFetchError("Failed to load car details. Please try again.");
                }

                console.error("fetchCar error:", err);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchCar();

        // Cleanup function to abort fetch if component unmounts
        return () => {
            controller.abort();
        };
    }, [id]);

    // ==================== HANDLERS ====================

    /**
     * Navigate to previous image
     */
    const handlePrevSlide = useCallback(() => {
        if (!car?.imagesList.length) return;
        setCurrentImageIndex(prev =>
            prev === 0 ? car.imagesList.length - 1 : prev - 1
        );
    }, [car?.imagesList.length]);

    /**
     * Navigate to next image
     */
    const handleNextSlide = useCallback(() => {
        if (!car?.imagesList.length) return;
        setCurrentImageIndex(prev =>
            prev === car.imagesList.length - 1 ? 0 : prev + 1
        );
    }, [car?.imagesList.length]);

    /**
     * Handle location selection from LocationSearch component
     */
    const handleLocationSelect = useCallback((address: string) => {
        setLocation(address);
        setBookingError(null); // Clear any booking errors when location is set

        // Log in development only
        if (process.env.NODE_ENV !== 'production') {
            console.log("Location selected:", address);
        }
    }, []);

    /**
     * Handle reserve button click
     */
    const handleReserve = useCallback(() => {
        if (!car) return;

        // Validate location
        if (!location || location.trim() === "") {
            setBookingError("Please select a pickup location before continuing");
            return;
        }

        // Validate dates
        if (!isValidDateRange(startDateTime, endDateTime)) {
            setBookingError("Please select valid start and end dates");
            return;
        }

        // Validate days
        if (days > MAX_BOOKING_DAYS) {
            setBookingError(`Maximum booking period is ${MAX_BOOKING_DAYS} days`);
            return;
        }

        // Navigate to reservations page with booking details
        navigate(`/cars/${car.id}/reservations`, {
            state: {
                totalPrice,
                startDate: startDateTime,
                endDate: endDateTime,
                days,
                location,
                car: {
                    id: car.id,
                    make: car.make,
                    model: car.model,
                    year: car.year,
                    pricePerDay: car.pricePerDay,
                },
            },
        });
    }, [car, location, startDateTime, endDateTime, days, totalPrice, navigate]);

    /**
     * Handle image click to open modal
     */
    const handleOpenModal = useCallback(() => {
        setShowModal(true);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }, []);

    /**
     * Handle modal close
     */
    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        // Restore body scroll
        document.body.style.overflow = 'unset';
    }, []);

    // ==================== RENDER HELPERS ====================

    /**
     * Render loading state
     */
    const renderLoading = () => (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <div className="flex justify-center items-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A699] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading car details...</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );

    /**
     * Render error state
     */
    const renderError = () => (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md mx-auto">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                    <p className="text-red-600 mb-6">{fetchError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-2 rounded-lg font-medium transition"
                    >
                        Try Again
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );

    /**
     * Render image gallery
     */
    const renderGallery = () => {
        if (!car?.imagesList.length) {
            return (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-96 bg-gray-200 flex items-center justify-center">
                        <img
                            src={DEFAULT_CAR_IMAGE}
                            alt="Default car"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden" ref={galleryRef}>
                <div className="grid grid-cols-3 gap-2">
                    {/* Hero image */}
                    <div className="relative col-span-2 h-72 md:h-96">
                        <img
                            src={car.imagesList[currentImageIndex]?.url || DEFAULT_CAR_IMAGE}
                            alt={`${car.make} ${car.model} - Image ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover bg-gray-100 transition-all duration-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE;
                            }}
                        />

                        {/* Overlay button */}
                        {car.imagesList.length > 1 && (
                            <button
                                onClick={handleOpenModal}
                                className="absolute bottom-3 right-3 bg-white/90 px-4 py-2 text-sm font-semibold rounded shadow hover:bg-white transition"
                            >
                                View {car.imagesList.length} photos
                            </button>
                        )}

                        {/* Navigation arrows */}
                        {car.imagesList.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrevSlide}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleNextSlide}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition"
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Two stacked previews */}
                    {car.imagesList.length > 1 && (
                        <div className="flex flex-col gap-2 h-72 md:h-96">
                            <div
                                onClick={handleNextSlide}
                                className="cursor-pointer flex-1 rounded-lg overflow-hidden opacity-80 hover:opacity-100 transition"
                            >
                                <img
                                    src={car.imagesList[(currentImageIndex + 1) % car.imagesList.length]?.url || DEFAULT_CAR_IMAGE}
                                    alt="Next preview"
                                    className="w-full h-full object-cover bg-gray-100"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE;
                                    }}
                                />
                            </div>
                            <div
                                onClick={handlePrevSlide}
                                className="cursor-pointer flex-1 rounded-lg overflow-hidden opacity-80 hover:opacity-100 transition"
                            >
                                <img
                                    src={car.imagesList[(currentImageIndex + 2) % car.imagesList.length]?.url || DEFAULT_CAR_IMAGE}
                                    alt="Previous preview"
                                    className="w-full h-full object-cover bg-gray-100"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE;
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Dots indicator */}
                {car.imagesList.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4 pb-4">
                        {car.imagesList.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-3 h-3 rounded-full cursor-pointer transition ${
                                    currentImageIndex === index ? "bg-[#00a699]" : "bg-gray-300 hover:bg-gray-400"
                                }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    /**
     * Render vehicle specifications
     */
    const renderSpecs = () => {
        if (!car) return null;

        const specs = [
            { icon: Users, label: "Seats", value: car.seats },
            { icon: Gauge, label: "Engine", value: `${car.cc} cc` },
            { icon: Fuel, label: "Fuel", value: car.fuelType },
            { icon: Car, label: "Cruise", value: car.cruiseControl ? "Yes" : "No" },
            { icon: Settings, label: "Transmission", value: car.transmission },
            { icon: Droplet, label: "Fuel Economy", value: `${car.mpg} MPG` },
        ];

        return (
            <div className="flex flex-wrap gap-6 text-sm text-gray-700">
                {specs.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span>
                            <span className="font-medium">{label}:</span> {value}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    /**
     * Render modal gallery
     */
    const renderModal = () => {
        if (!showModal || !car?.imagesList.length) return null;

        return (
            <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50">
                {/* Close button */}
                <button
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 text-white bg-black/60 p-2 rounded-full hover:bg-black transition z-10"
                    aria-label="Close gallery"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Image + arrows */}
                <div className="relative w-full max-w-6xl h-[80vh] flex items-center justify-center px-4">
                    <img
                        src={car.imagesList[currentImageIndex]?.url || DEFAULT_CAR_IMAGE}
                        alt={`${car.make} ${car.model} - Image ${currentImageIndex + 1}`}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE;
                        }}
                    />

                    {car.imagesList.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevSlide}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black transition"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleNextSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black transition"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>

                {/* Dots inside modal */}
                {car.imagesList.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {car.imagesList.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-3 h-3 rounded-full cursor-pointer transition ${
                                    currentImageIndex === index ? "bg-white" : "bg-gray-500 hover:bg-gray-400"
                                }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    /**
     * Render booking card
     */
    const renderBookingCard = () => {
        if (!car) return null;

        return (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4 sticky top-24">
                {/* Price */}
                <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-[#00A699]">
                        Ksh {Number(car.pricePerDay).toLocaleString()} per day
                    </span>
                </div>

                {/* Total for selected dates */}
                {days > 0 && (
                    <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium">Total for {days} day{days !== 1 ? 's' : ''}:</span>
                        <span className="font-bold text-[#00A699]">Ksh {totalPrice.toLocaleString()}</span>
                    </div>
                )}

                {/* Booking form */}
                <div className="space-y-4">
                    {/* Trip Dates - Note: Time is ignored in calculations */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDateTime.split('T')[0]}
                                onChange={(e) => {
                                    const newDate = e.target.value;
                                    setStartDateTime(`${newDate}T12:00`); // Set to noon to avoid timezone issues
                                }}
                                min={new Date().toISOString().split('T')[0]}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Pickup day</p>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDateTime.split('T')[0]}
                                onChange={(e) => {
                                    const newDate = e.target.value;
                                    setEndDateTime(`${newDate}T12:00`); // Set to noon to avoid timezone issues
                                }}
                                min={startDateTime.split('T')[0]}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Return day</p>
                        </div>
                    </div>

                    {/* Info: Time not considered */}
                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
                        ⏰ Time is not considered - you pay per full day. Pickup anytime on start day, return anytime on end day.
                    </div>

                    {/* Location */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Pickup & return location</label>
                        <LocationSearch onSelect={handleLocationSelect} />
                    </div>

                    {/* Error message */}
                    {bookingError && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                            {bookingError}
                        </div>
                    )}

                    {/* Continue Button */}
                    <button
                        onClick={handleReserve}
                        disabled={!isBookingValid}
                        className={`w-full py-3 rounded-lg font-semibold transition ${
                            isBookingValid
                                ? "bg-[#00A699] hover:bg-[#007A6E] text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        Continue to Book
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                        You won't be charged yet
                    </p>
                </div>
            </div>
        );
    };

    // ==================== MAIN RENDER ====================

    if (loading) return renderLoading();
    if (fetchError || !car) return renderError();

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                    {/* Breadcrumb navigation */}
                    <nav className="text-sm text-gray-500">
                        <ol className="flex items-center space-x-2">
                            <li><a href="/cars" className="hover:text-[#00A699]">Cars</a></li>
                            <li><span className="mx-2">/</span></li>
                            <li className="text-gray-900 font-medium">{car.make} {car.model}</li>
                        </ol>
                    </nav>

                    {/* Gallery */}
                    {renderGallery()}

                    {/* Vehicle Details Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Vehicle Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Title + Rating */}
                            <div className="flex items-center justify-between">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {car.year} {car.make} {car.model}
                                </h1>
                                {car.rating && car.rating > 0 && (
                                    <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                        <span className="font-semibold">{car.rating.toFixed(1)}</span>
                                        {car.trips && (
                                            <span className="text-gray-500 text-sm ml-1">
                                                ({car.trips} trips)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Vehicle Features */}
                            {renderSpecs()}

                            {/* Host Info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <img
                                    src={car.owner.defaultProfile || DEFAULT_PROFILE_IMAGE}
                                    alt={car.owner.name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = DEFAULT_PROFILE_IMAGE;
                                    }}
                                />
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        Hosted by {car.owner.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Joined {new Date(car.owner.createdAt).toLocaleDateString('en-US', {
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                    </p>
                                    {car.rating && (
                                        <p className="text-sm text-gray-600">
                                            ⭐ {car.rating.toFixed(1)} Host rating
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Vehicle Class */}
                            {car.class && (
                                <div className="mt-4">
                                    <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                                        {car.class}
                                    </span>
                                    {car.classNote && (
                                        <p className="text-sm text-gray-600 mt-2">{car.classNote}</p>
                                    )}
                                </div>
                            )}

                            {/* Rules Section */}
                            <div className="mt-8 border-t pt-6">
                                <h2 className="text-xl font-semibold mb-4">Rules of the Road</h2>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold">•</span>
                                        <span><strong>No smoking allowed:</strong> Smoking in any vehicle will result in a $150 fine.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold">•</span>
                                        <span><strong>Keep the vehicle tidy:</strong> Unreasonably dirty vehicles may result in a fine.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold">•</span>
                                        <span><strong>Refuel the vehicle:</strong> Vehicle should have the same amount of fuel.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold">•</span>
                                        <span><strong>No off‑roading:</strong> Vehicles are not permitted to be driven off‑road.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Right: Booking Card */}
                        <div className="lg:col-span-1">
                            {renderBookingCard()}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Modal Gallery */}
            {renderModal()}
        </div>
    );
};