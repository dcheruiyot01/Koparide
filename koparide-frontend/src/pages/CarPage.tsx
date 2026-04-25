import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Users, Gauge, Fuel, Car, Settings, Droplet, Star, AlertCircle } from "lucide-react";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import { LocationSearch } from "../components/locations/LocationsSearch";
import api from "../api/axios";

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

const getFormattedToday = (): string => new Date().toISOString().slice(0, 16);
const getFormattedTomorrow = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
};

const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return MIN_BOOKING_DAYS;
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(0, 0, 0, 0);
    if (end <= start) return MIN_BOOKING_DAYS;
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.max(MIN_BOOKING_DAYS, Math.round(diffDays));
};

const isValidDateRange = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(0, 0, 0, 0);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return start >= now && end > start;
};

// ==================== MAIN COMPONENT ====================

export const CarPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [car, setCar] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [startDateTime, setStartDateTime] = useState<string>(getFormattedToday());
    const [endDateTime, setEndDateTime] = useState<string>(getFormattedTomorrow());
    const [days, setDays] = useState<number>(MIN_BOOKING_DAYS);
    const [location, setLocation] = useState<string>("");
    const [bookingError, setBookingError] = useState<string | null>(null);
    const galleryRef = useRef<HTMLDivElement>(null);

    // Derived values
    const basePricePerDay = car ? Number(car.pricePerDay) : 0;
    const driverFeePerDay = car?.driverFeePerDay ?? 0;
    const rentalType = car?.rentalType || 'self_drive';
    const totalPricePerDay = rentalType === 'with_driver' ? basePricePerDay + driverFeePerDay : basePricePerDay;
    const totalPrice = useMemo(() => days * totalPricePerDay, [days, totalPricePerDay]);

    const isBookingValid = useMemo(() => (
        location.trim() !== "" &&
        isValidDateRange(startDateTime, endDateTime) &&
        days >= MIN_BOOKING_DAYS &&
        days <= MAX_BOOKING_DAYS
    ), [location, startDateTime, endDateTime, days]);

    // Effects
    useEffect(() => {
        setDays(calculateDays(startDateTime, endDateTime));
        if (startDateTime && endDateTime) {
            const start = new Date(startDateTime); start.setHours(0, 0, 0, 0);
            const end = new Date(endDateTime); end.setHours(0, 0, 0, 0);
            const now = new Date(); now.setHours(0, 0, 0, 0);
            if (start < now) setBookingError("Start date cannot be in the past");
            else if (end <= start) setBookingError("End date must be after start date");
            else if (calculateDays(startDateTime, endDateTime) > MAX_BOOKING_DAYS)
                setBookingError(`Maximum booking period is ${MAX_BOOKING_DAYS} days`);
            else setBookingError(null);
        }
    }, [startDateTime, endDateTime]);

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
                const res = await api.get(`/api/cars/${id}`, { signal: controller.signal, timeout: 10000 });
                const raw = res.data?.data ?? res.data;
                if (!raw) throw new Error("Car not found");

                const normalized = {
                    id: raw.id,
                    ownerId: raw.ownerId,
                    make: raw.make || "Unknown",
                    model: raw.model || "Vehicle",
                    year: raw.year || new Date().getFullYear(),
                    pricePerDay: raw.pricePerDay || 0,
                    driverFeePerDay: raw.driverFeePerDay ?? 0,
                    rentalType: raw.rentalType || 'self_drive',
                    classification: raw.classification || "Standard",
                    seats: raw.seats || 5,
                    fuelType: raw.fuelType || "Gasoline",
                    mpg: raw.mpg || 0,
                    transmission: raw.transmission || "Automatic",
                    cruiseControl: raw.cruiseControl || false,
                    cc: raw.cc || 0,
                    status: raw.status || "pending",
                    is_deleted: raw.is_deleted || false,
                    rented_to: raw.rented_to || null,
                    createdAt: raw.createdAt || new Date().toISOString(),
                    updatedAt: raw.updatedAt || new Date().toISOString(),
                    imagesList: raw.imagesList || [],
                    owner: raw.owner || { id: 0, name: "Unknown Host", email: "", createdAt: new Date().toISOString(), defaultProfile: null },
                    renter: raw.renter || null,
                    rating: raw.rating || 0,
                    trips: raw.trips || 0,
                    class: raw.class || "Standard",
                    classNote: raw.classNote || "",
                };
                setCar(normalized);
            } catch (err: any) {
                if (err.name === "CanceledError" || err.name === "AbortError") return;
                console.error(err);
                setFetchError(err.response?.status === 404 ? "Car not found" : "Failed to load car details");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        fetchCar();
        return () => controller.abort();
    }, [id]);

    // Handlers
    const handlePrevSlide = useCallback(() => {
        if (!car?.imagesList.length) return;
        setCurrentImageIndex(prev => prev === 0 ? car.imagesList.length - 1 : prev - 1);
    }, [car?.imagesList.length]);

    const handleNextSlide = useCallback(() => {
        if (!car?.imagesList.length) return;
        setCurrentImageIndex(prev => prev === car.imagesList.length - 1 ? 0 : prev + 1);
    }, [car?.imagesList.length]);

    const handleLocationSelect = useCallback((address: string) => {
        setLocation(address);
        setBookingError(null);
    }, []);

    const handleReserve = useCallback(() => {
        if (!car) return;
        if (!location.trim()) {
            setBookingError("Please select a pickup location");
            return;
        }
        if (!isValidDateRange(startDateTime, endDateTime)) {
            setBookingError("Please select valid start and end dates");
            return;
        }
        if (days > MAX_BOOKING_DAYS) {
            setBookingError(`Maximum booking period is ${MAX_BOOKING_DAYS} days`);
            return;
        }
        navigate(`/cars/${car.id}/reservations`, {
            state: {
                totalPrice,
                startDate: startDateTime,
                endDate: endDateTime,
                days,
                location,
                rentalType: car.rentalType,
                driverFeePerDay: car.driverFeePerDay,
                car: {
                    id: car.id,
                    make: car.make,
                    model: car.model,
                    year: car.year,
                    pricePerDay: car.pricePerDay,
                    driverFeePerDay: car.driverFeePerDay,
                }
            }
        });
    }, [car, location, startDateTime, endDateTime, days, totalPrice, navigate]);

    const handleOpenModal = useCallback(() => {
        setShowModal(true);
        document.body.style.overflow = 'hidden';
    }, []);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        document.body.style.overflow = 'unset';
    }, []);

    // Render helpers
    const renderLoading = () => (
        <div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12"><div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A699] mx-auto" /><p className="mt-4 text-gray-600">Loading car details...</p></div></main><Footer /></div>
    );

    const renderError = () => (
        <div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12"><div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md mx-auto"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2><p className="text-red-600 mb-6">{fetchError}</p><button onClick={() => window.location.reload()} className="bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-2 rounded-lg font-medium transition">Try Again</button></div></main><Footer /></div>
    );

    const renderGallery = () => {
        if (!car?.imagesList.length) return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden"><div className="h-96 bg-gray-200 flex items-center justify-center"><img src={DEFAULT_CAR_IMAGE} alt="Default car" className="w-full h-full object-cover" /></div></div>
        );
        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden" ref={galleryRef}>
                <div className="grid grid-cols-3 gap-2">
                    <div className="relative col-span-2 h-72 md:h-96">
                        <img src={car.imagesList[currentImageIndex]?.url || DEFAULT_CAR_IMAGE} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE; }} />
                        {car.imagesList.length > 1 && (<button onClick={handleOpenModal} className="absolute bottom-3 right-3 bg-white/90 px-4 py-2 text-sm font-semibold rounded shadow hover:bg-white transition">View {car.imagesList.length} photos</button>)}
                        {car.imagesList.length > 1 && (<><button onClick={handlePrevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"><ChevronLeft className="w-5 h-5" /></button><button onClick={handleNextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"><ChevronRight className="w-5 h-5" /></button></>)}
                    </div>
                    {car.imagesList.length > 1 && (
                        <div className="flex flex-col gap-2 h-72 md:h-96">
                            <div onClick={handleNextSlide} className="cursor-pointer flex-1 rounded-lg overflow-hidden opacity-80 hover:opacity-100"><img src={car.imagesList[(currentImageIndex + 1) % car.imagesList.length]?.url || DEFAULT_CAR_IMAGE} alt="Next preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE; }} /></div>
                            <div onClick={handlePrevSlide} className="cursor-pointer flex-1 rounded-lg overflow-hidden opacity-80 hover:opacity-100"><img src={car.imagesList[(currentImageIndex + 2) % car.imagesList.length]?.url || DEFAULT_CAR_IMAGE} alt="Previous preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE; }} /></div>
                        </div>
                    )}
                </div>
                {car.imagesList.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4 pb-4">
                        {car.imagesList.map((_: any, index: number) => (<button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-3 h-3 rounded-full cursor-pointer transition ${currentImageIndex === index ? "bg-[#00a699]" : "bg-gray-300 hover:bg-gray-400"}`} aria-label={`Go to image ${index + 1}`} />))}
                    </div>
                )}
            </div>
        );
    };

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
        return (<div className="flex flex-wrap gap-6 text-sm text-gray-700">{specs.map(({ icon: Icon, label, value }) => (<div key={label} className="flex items-center gap-2"><Icon className="w-4 h-4 text-gray-500" /><span><span className="font-medium">{label}:</span> {value}</span></div>))}</div>);
    };

    const renderModal = () => {
        if (!showModal || !car?.imagesList.length) return null;
        return (
            <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50">
                <button onClick={handleCloseModal} className="absolute top-4 right-4 text-white bg-black/60 p-2 rounded-full hover:bg-black transition z-10"><X className="w-6 h-6" /></button>
                <div className="relative w-full max-w-6xl h-[80vh] flex items-center justify-center px-4">
                    <img src={car.imagesList[currentImageIndex]?.url || DEFAULT_CAR_IMAGE} alt={`${car.make} ${car.model}`} className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE; }} />
                    {car.imagesList.length > 1 && (<><button onClick={handlePrevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black transition"><ChevronLeft className="w-6 h-6" /></button><button onClick={handleNextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black transition"><ChevronRight className="w-6 h-6" /></button></>)}
                </div>
                <div className="flex justify-center gap-2 mt-4">{car.imagesList.map((_: any, index: number) => (<button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-3 h-3 rounded-full cursor-pointer transition ${currentImageIndex === index ? "bg-white" : "bg-gray-500 hover:bg-gray-400"}`} aria-label={`Go to image ${index + 1}`} />))}</div>
            </div>
        );
    };

    const renderBookingCard = () => {
        if (!car) return null;

        const baseTotal = basePricePerDay * days;
        const driverTotal = (rentalType === 'with_driver' ? driverFeePerDay : 0) * days;
        const tripTotal = baseTotal + driverTotal;

        return (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4 sticky top-24">
                {/* Price per day summary */}
                <div>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-[#00A699]">
                            Price break down
                        </span>
                    </div>
                    {rentalType === 'with_driver' && driverFeePerDay > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                            (Ksh {basePricePerDay.toLocaleString()} base + Ksh {driverFeePerDay.toLocaleString()} driver fee)
                        </div>
                    )}
                </div>

                {/* Detailed breakdown */}
                <div className="border-t pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Base price ({days} days)</span>
                        <span className="text-gray-900">Ksh {baseTotal.toLocaleString()}</span>
                    </div>
                    {rentalType === 'with_driver' && driverFeePerDay > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Driver fee ({days} days)</span>
                            <span className="text-gray-900">Ksh {driverTotal.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium text-gray-900">Total for trip</span>
                        <span className="font-bold text-[#00A699]">Ksh {tripTotal.toLocaleString()}</span>
                    </div>
                </div>

                {/* Booking form */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDateTime.split('T')[0]}
                                onChange={(e) => setStartDateTime(`${e.target.value}T12:00`)}
                                min={new Date().toISOString().split('T')[0]}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Pickup day</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDateTime.split('T')[0]}
                                onChange={(e) => setEndDateTime(`${e.target.value}T12:00`)}
                                min={startDateTime.split('T')[0]}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Return day</p>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
                        ⏰ Time is not considered – you pay per full day. Pickup anytime on start day, return anytime on end day.
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1">Pickup & return location</label>
                        <LocationSearch onSelect={handleLocationSelect} />
                    </div>

                    {bookingError && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{bookingError}</div>
                    )}

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
                    <p className="text-xs text-gray-500 text-center">You won't be charged yet</p>
                </div>
            </div>
        );
    };

    if (loading) return renderLoading();
    if (fetchError || !car) return renderError();

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                    <nav className="text-sm text-gray-500"><ol className="flex items-center space-x-2"><li><a href="/cars" className="hover:text-[#00A699]">Cars</a></li><li><span className="mx-2">/</span></li><li className="text-gray-900 font-medium">{car.make} {car.model}</li></ol></nav>
                    {renderGallery()}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between"><h1 className="text-3xl font-bold text-gray-900">{car.year} {car.make} {car.model}</h1></div>
                            {renderSpecs()}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"><img src={car.owner.defaultProfile || DEFAULT_PROFILE_IMAGE} alt={car.owner.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow" onError={(e) => (e.target as HTMLImageElement).src = DEFAULT_PROFILE_IMAGE} /><div><p className="font-semibold text-gray-900">Hosted by {car.owner.name}</p><p className="text-sm text-gray-500">Joined {new Date(car.owner.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p></div></div>
                            {car.class && (<div className="mt-4"><span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">{car.class}</span>{car.classNote && <p className="text-sm text-gray-600 mt-2">{car.classNote}</p>}</div>)}
                            <div className="mt-8 border-t pt-6"><h2 className="text-xl font-semibold mb-4">Rules of the Road</h2><ul className="space-y-3 text-sm"><li className="flex items-start gap-2"><span className="text-red-500 font-bold">•</span><span><strong>No smoking allowed:</strong> Smoking in any vehicle will result in a $150 fine.</span></li><li className="flex items-start gap-2"><span className="text-red-500 font-bold">•</span><span><strong>Keep the vehicle tidy:</strong> Unreasonably dirty vehicles may result in a fine.</span></li><li className="flex items-start gap-2"><span className="text-red-500 font-bold">•</span><span><strong>Refuel the vehicle:</strong> Vehicle should have the same amount of fuel.</span></li><li className="flex items-start gap-2"><span className="text-red-500 font-bold">•</span><span><strong>No off‑roading:</strong> Vehicles are not permitted to be driven off‑road.</span></li></ul></div>
                        </div>
                        <div className="lg:col-span-1">{renderBookingCard()}</div>
                    </div>
                </div>
            </main>
            <Footer />
            {renderModal()}
        </div>
    );
};