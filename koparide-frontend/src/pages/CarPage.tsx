// CarDetailsPage.tsx
import React, { useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Users,
    Gauge,
    Fuel,
    Car as CarIcon,
    Settings,
    Droplet,
} from "lucide-react";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import { LocationSearch } from "../components/locations/LocationsSearch";

/**
 * CarDetailsPage
 *
 * - Keeps your gallery, layout, and existing UI.
 * - Wires datetime-local inputs to state and recalculates days, subtotal, protection, tax, promo, and total live.
 * - Uses UTC-midnight normalization for day calculations to avoid timezone/DST issues.
 * - Protection is implemented as a flat per-trip fee (change to per-day by multiplying by days if desired).
 * - Promo code demo: SAVE1000 subtracts a fixed amount.
 */

const mockCar = {
    title: "2025 Toyota Sequoia Platinum",
    rating: 5.0,
    trips: 59,
    host: {
        name: "Hash Cars",
        trips: 1814,
        joined: "Jul 2021",
        rating: 4.9,
        profileImage:
            "http://localhost:4000/uploads/licenses/alvano-putra-TdAatXFLWak-unsplash.jpg",
    },
    features: {
        seats: "7",
        fuelType: "Petrol",
        fuelConsumption: "20",
        transmission: "Automatic",
        cruiseControl: true,
        cc: "2500",
    },
    class: "Deluxe Class",
    classNote: "Guests under 30 must pass additional safety checks",
    price: 4000,

    trip: {
        start: "4/11/2026 · 10:00 AM",
        end: "4/14/2026 · 10:00 AM",
        location: "Oakland, CA 94621",
    },
    images: [
        "http://localhost:4000/uploads/licenses/1772651847333-527049013.png",
        "http://localhost:4000/uploads/licenses/alvano-putra-TdAatXFLWak-unsplash.jpg",
        "http://localhost:4000/uploads/licenses/ivan-kazlouskij-GjKmrL2QgSM-unsplash.jpg",
        "http://localhost:4000/uploads/licenses/nick-mollenbeck-wR30lR9ZdJQ-unsplash.jpg",
        "http://localhost:4000/uploads/licenses/sven-d-a4S6KUuLeoM-unsplash.jpg",
    ],
};

const TAX_RATE = 0.08; // 8% example tax
const PROTECTION_RATES = {
    none: 0,
    standard: 1200, // flat per trip (change to per-day by multiplying by days)
    enhanced: 2000,
};

// default local datetime value (YYYY-MM-DDTHH:mm)
const formattedTodayLocal = (() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
})();

export const CarPage: React.FC = () => {
    // gallery state
    const [current, setCurrent] = useState(0);
    const [showModal, setShowModal] = useState(false);

    // booking state (controlled inputs)
    const [startDateTime, setStartDateTime] = useState<string>("");
    const [endDateTime, setEndDateTime] = useState<string>("");
    const [protection, setProtection] = useState<"none" | "standard" | "enhanced">(
        "standard"
    );
    const [promoCode, setPromoCode] = useState<string>("");

    // gallery navigation
    const prevSlide = () =>
        setCurrent((prev) => (prev === 0 ? mockCar.images.length - 1 : prev - 1));
    const nextSlide = () =>
        setCurrent((prev) =>
            prev === mockCar.images.length - 1 ? 0 : prev + 1
        );

    // Utility: compute full days between two local datetime strings (normalize to UTC midnight)
    const computeDays = (startLocal: string, endLocal: string) => {
        if (!startLocal || !endLocal) return 0;

        const start = new Date(startLocal);
        const end = new Date(endLocal);

        const startMs = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
        const endMs = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

        const diffDays = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    // Derived values (live)
    const days = useMemo(() => computeDays(startDateTime, endDateTime), [startDateTime, endDateTime]);

    const dailyRate = mockCar.price;

    const subtotal = useMemo(() => +(dailyRate * days), [dailyRate, days]);

    const protectionCost = useMemo(() => PROTECTION_RATES[protection] || 0, [protection]);

    const tax = useMemo(() => +((subtotal + protectionCost) * TAX_RATE), [subtotal, protectionCost]);

    const promoDiscount = useMemo(() => {
        if (promoCode.trim().toUpperCase() === "SAVE1000") return 1000;
        return 0;
    }, [promoCode]);

    const total = useMemo(() => {
        const raw = subtotal + protectionCost + tax - promoDiscount;
        return +(raw > 0 ? raw : 0);
    }, [subtotal, protectionCost, tax, promoDiscount]);

    // Validation
    const dateError = useMemo(() => {
        if (!startDateTime || !endDateTime) return "";
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        if (end <= start) return "Return must be after pickup.";
        return "";
    }, [startDateTime, endDateTime]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                    {/* Gallery Card */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="grid grid-cols-3 gap-2">
                            {/* Hero image */}
                            <div className="relative col-span-2 h-72 md:h-96">
                                <img
                                    src={mockCar.images[current]}
                                    alt={`Car ${current + 1}`}
                                    className="w-full h-full object-cover bg-gray-100 transition-all duration-500"
                                />

                                <button
                                    onClick={() => setShowModal(true)}
                                    className="absolute bottom-3 right-3 bg-white/90 px-4 py-2 text-sm font-semibold rounded shadow hover:bg-white"
                                >
                                    View {mockCar.images.length} photos
                                </button>

                                <button
                                    onClick={prevSlide}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Two stacked previews */}
                            <div className="flex flex-col gap-2 h-72 md:h-96">
                                <div
                                    onClick={nextSlide}
                                    className="cursor-pointer flex-1 rounded-lg overflow-hidden opacity-80 hover:opacity-100 transition"
                                >
                                    <img
                                        src={mockCar.images[(current + 1) % mockCar.images.length]}
                                        alt="Next preview"
                                        className="w-full h-full object-cover bg-gray-100"
                                    />
                                </div>
                                <div
                                    onClick={prevSlide}
                                    className="cursor-pointer flex-1 rounded-lg overflow-hidden opacity-80 hover:opacity-100 transition"
                                >
                                    <img
                                        src={mockCar.images[(current + 2) % mockCar.images.length]}
                                        alt="Next preview"
                                        className="w-full h-full object-cover bg-gray-100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dots indicator */}
                        <div className="flex justify-center gap-2 mt-4 pb-4">
                            {mockCar.images.map((_, index) => (
                                <span
                                    key={index}
                                    onClick={() => setCurrent(index)}
                                    className={`w-3 h-3 rounded-full cursor-pointer ${
                                        current === index ? "bg-[#00a699]" : "bg-gray-300"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Main content: left details + right booking summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Vehicle Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold">{mockCar.title}</h1>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>⭐ {mockCar.rating}</span>
                                    <span>({mockCar.trips} trips)</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-6 text-xs text-gray-700">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span>{mockCar.features.seats} seats</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Gauge className="w-4 h-4 text-gray-500" />
                                    <span>{mockCar.features.cc} cc</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Fuel className="w-4 h-4 text-gray-500" />
                                    <span>{mockCar.features.fuelType}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CarIcon className="w-4 h-4 text-gray-500" />
                                    <span>{mockCar.features.cruiseControl ? "Cruise Control" : "No Cruise Control"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-gray-500" />
                                    <span>{mockCar.features.transmission}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Droplet className="w-4 h-4 text-gray-500" />
                                    <span>{mockCar.features.fuelConsumption} MPG</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-700 mt-4">
                                <img
                                    src={mockCar.host.profileImage}
                                    alt={mockCar.host.name}
                                    className="w-12 h-12 rounded-full object-cover border"
                                />
                                <div>
                                    <p className="font-semibold">Host: {mockCar.host.name}</p>
                                    <p>{mockCar.host.trips} trips · Joined {mockCar.host.joined}</p>
                                    <p>Host rating: {mockCar.host.rating} ⭐</p>
                                </div>
                            </div>

                            <div className="mt-4">
                <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                  {mockCar.class}
                </span>
                                <p className="text-xs text-gray-600 mt-2">{mockCar.classNote}</p>
                            </div>

                            <div className="mt-8 border-t pt-6">
                                <h2 className="text-lg font-semibold mb-4">Rules of the Road</h2>
                                <ul className="space-y-3 text-sm">
                                    <li>
                                        <strong>No smoking allowed:</strong> Smoking in any vehicle will result in a $150 fine.
                                    </li>
                                    <li>
                                        <strong>Keep the vehicle tidy:</strong> Unreasonably dirty vehicles may result in a fine.
                                    </li>
                                    <li>
                                        <strong>Refuel the vehicle:</strong> Vehicle should have the same amount of fuel.
                                    </li>
                                    <li>
                                        <strong>No off‑roading:</strong> Vehicles are not permitted to be driven off‑road.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Right: Booking Card */}
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                            {/* Price */}
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-green-600">
                                    Ksh {mockCar.price}
                                </span>
                                <span className="text-sm text-gray-500">Per Day</span>
                            </div>

                            {/* Trip Dates */}
                            <div className="text-sm text-gray-700 space-y-3">
                                <div className="flex flex-col">
                                    <label className="font-semibold mb-1">Trip start</label>
                                    <input
                                        type="datetime-local"
                                        value={startDateTime || formattedTodayLocal}
                                        onChange={(e) => setStartDateTime(e.target.value)}
                                        className="border rounded px-2 py-1 text-sm"
                                        aria-label="Trip start"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="font-semibold mb-1">Trip end</label>
                                    <input
                                        type="datetime-local"
                                        value={endDateTime || formattedTodayLocal}
                                        onChange={(e) => setEndDateTime(e.target.value)}
                                        className="border rounded px-2 py-1 text-sm"
                                        aria-label="Trip end"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="font-semibold mb-1">Pickup & return location</label>
                                    <LocationSearch onSelect={() => {}} />
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="mt-2 text-sm text-gray-700 space-y-2">
                                <div className="flex justify-between">
                                    <span>Days</span>
                                    <span>{days}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>Ksh {subtotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-4 border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-500">Total</p>
                                    </div>
                                    <div className="text-xl font-semibold text-gray-900">Ksh {total.toLocaleString()}</div>
                                </div>
                            </div>

                            <button
                                disabled={days === 0 || !!dateError}
                                onClick={() => alert("Proceed to reservation (demo)")}
                                className={`mt-4 w-full py-3 rounded-lg font-semibold text-white ${days === 0 || !!dateError ? "bg-gray-300 cursor-not-allowed" : "bg-[#00a699] hover:opacity-95"}`}
                            >
                                Confirm and pay
                            </button>

                            {dateError && <p className="text-xs text-red-600 mt-2">{dateError}</p>}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};
