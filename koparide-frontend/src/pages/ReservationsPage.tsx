import React, { useMemo, useState, useEffect } from "react";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import api from "../api/axios"; // axios instance

import {
    Calendar,
    MapPin,
    CreditCard,
    ShieldCheck,
    Clock,
    AlertCircle,
} from "lucide-react";

/**
 * ReservationPage
 *
 * Production-ready reservation / checkout page styled with Tailwind CSS.
 * - Layout mirrors the screenshot: left column with booking details and options,
 *   right column with booking summary and price breakdown.
 * - Uses mocked data (replace with API calls in production).
 * - Reuses patterns and classes from CarListingsPage for visual consistency.
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

interface Owner {
    id: number;
    name: string;
    email: string;
}

interface Car {
    id: number;
    ownerId: number;
    make: string;
    model: string;
    year: number;
    pricePerDay: string;
    classification: string;
    fuelType: string;
    status: string;
    rented_to: number | null;
    imagesList: CarImage[];
    owner: Owner;
    renter: Owner | null;
}

const mockedCar = {
    id: 42,
    name: "Chevrolet Silverado EV",
    year: 2024,
    rating: 5.0,
    trips: 4,
    location: "Orlando, FL 32801",
    imageUrl: "http://localhost:4000/uploads/licenses/alvano-putra-TdAatXFLWak-unsplash.jpg",
    distanceIncluded: 450,
    extraMileFee: 0.7,
};

const mockedBooking = {
    start: new Date("2026-04-03T10:00:00"),
    end: new Date("2026-04-06T10:00:00"),
    nights: 3,
};

const TAX_RATE = 0.0765; // example sales tax

export const ReservationPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const loc = useLocation();
    const { totalPrice, startDate, endDate, days, location } = loc.state || {};




    // UI state
    const [selectedRate, setSelectedRate] = useState<"nonrefundable" | "refundable">(
        "nonrefundable"
    );
    const [selectedProtection, setSelectedProtection] = useState<
        "none" | "standard" | "enhanced"
    >("standard");
    const [paymentMethod, setPaymentMethod] = useState({
        brand: "Visa",
        last4: "1423",
    });
    const [promoCode, setPromoCode] = useState("");
    const [licenseExpired, setLicenseExpired] = useState(true);

    // Mocked pricing (these would normally come from backend)
    const baseRates = {
        nonrefundable:totalPrice,
        refundable: 339.92,
    };

    const protectionPrices = {
        none: 0,
        standard: 15.0,
        enhanced: 25.0,
    };

    // Derived values
    const subtotal = useMemo(() => {
        // For demo: use selected base rate minus a mocked "savings" for nonrefundable
        const base = selectedRate === "nonrefundable" ? baseRates.nonrefundable : baseRates.refundable;
        const protection = protectionPrices[selectedProtection];
        // Pretend subtotal excludes tax
        return Math.max(0, base - (selectedRate === "nonrefundable" ? 0 : 0)) + protection;
    }, [selectedRate, selectedProtection]);

    const calctotal = useMemo(() => {
        return +(subtotal).toFixed(2);
    }, [subtotal]);

    // Promo code application (mock)
    const applyPromo = () => {
        if (promoCode.trim().toLowerCase() === "SAVE34") {
            // For demo, subtract Ksh 34 from subtotal (but not below 0)
            const newSubtotal = Math.max(0, subtotal - 34);
            // We won't mutate subtotal directly; show a toast in real app. Here we simulate by setting refundable -> nonrefundable
            alert("Promo applied: Save Ksh 34 (demo). Totals will reflect the discount.");
        } else {
            alert("Invalid promo code (demo). Try SAVE34.");
        }
    };

    // Fetch car details
    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();

        const fetchCar = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await api.get(`/api/cars/${id}`, { signal: controller.signal });
                const raw = res.data?.data ?? res.data ?? null;

                if (!raw) {
                    setFetchError("Car not found");
                    setCar(null);
                    return;
                }

                // Normalize shape to Car interface
                const normalized: Car = {
                    id: raw.id,
                    ownerId: raw.ownerId,
                    make: raw.make,
                    model: raw.model,
                    year: raw.year,
                    pricePerDay: raw.pricePerDay,
                    classification: raw.classification,
                    fuelType: raw.fuelType,
                    status: raw.status,
                    rented_to: raw.rented_to,
                    imagesList: Array.isArray(raw.imagesList) ? raw.imagesList : [],
                    owner: raw.owner,
                    renter: raw.renter,
                };

                setCar(normalized);
            } catch (err: any) {
                if (err.name === "CanceledError" || err.name === "AbortError") return;
                setFetchError("Failed to load car details");
                console.error("fetchCar error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCar();
        return () => controller.abort();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (fetchError) return <div>{fetchError}</div>;
    if (!car) return <div>No car found</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Constrained centered layout similar to screenshot */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column: booking details and options (spans 2 cols on large screens) */}
                    <section className="lg:col-span-2 space-y-6">
                        {/* Car header */}
                        <div className="bg-white rounded-xl shadow p-5 flex items-start gap-4">
                            <img
                                src={car.imagesList[1].url}
                                alt={car.make}
                                className="w-28 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-gray-900">{car.year} {car.make} {car.model}</h2>
                                <span className="text-sm font-bold text-green-600">
                                  Price per day: {car.pricePerDay}
                                </span>
                                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {mockedCar.location}
                                </p>
                            </div>
                        </div>

                        {/* Dates & Location */}
                        <div className="bg-white rounded-xl shadow p-5">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Dates & Location</h3>
                            <p className="text-sm font-medium text-gray-900">
                                Pick up: {location}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-xs text-gray-500">Pick up</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {startDate}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-xs text-gray-500">Return</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {endDate}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* License warning */}
                            {licenseExpired && (
                                <div className="mt-4 flex items-start gap-3 bg-yellow-50 border-l-4 border-yellow-300 p-3 rounded">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-yellow-800">Your driver’s license has expired</p>
                                        <p className="text-sm text-yellow-700">
                                            Update your license before your trip starts to avoid cancellation.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Protection options */}
                        <div className="bg-white rounded-xl shadow p-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">Protection</h3>
                                <button
                                    className="text-sm text-[#00a699] font-medium"
                                    onClick={() => setSelectedProtection("standard")}
                                >
                                    Add
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mt-2">Choose a protection plan for your trip.</p>

                            <div className="mt-4 space-y-3">
                                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="protection"
                                        checked={selectedProtection === "none"}
                                        onChange={() => setSelectedProtection("none")}
                                        className="form-radio"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium">No protection</p>
                                                <p className="text-xs text-gray-500">You are responsible for damage</p>
                                            </div>
                                            <div className="text-sm text-gray-900">Ksh 0</div>
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent">
                                    <input
                                        type="radio"
                                        name="protection"
                                        checked={selectedProtection === "standard"}
                                        onChange={() => setSelectedProtection("standard")}
                                        className="form-radio"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium">Protection plan</p>
                                                <p className="text-xs text-gray-500">Reduces your liability</p>
                                            </div>
                                            <div className="text-sm text-gray-900">Ksh {protectionPrices.standard.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="protection"
                                        checked={selectedProtection === "enhanced"}
                                        onChange={() => setSelectedProtection("enhanced")}
                                        className="form-radio"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium">Enhanced roadside assistance</p>
                                                <p className="text-xs text-gray-500">Includes towing and on-road help</p>
                                            </div>
                                            <div className="text-sm text-gray-900">Ksh {protectionPrices.enhanced.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Booking rate selection */}
                        {/*<div className="bg-white rounded-xl shadow p-5">*/}
                        {/*    <h3 className="text-sm font-semibold text-gray-900">Booking rate</h3>*/}
                        {/*    <p className="text-sm text-gray-500 mt-1">Choose the rate that fits your needs.</p>*/}

                        {/*    <div className="mt-4 space-y-3">*/}
                        {/*        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">*/}
                        {/*            <input*/}
                        {/*                type="radio"*/}
                        {/*                name="rate"*/}
                        {/*                checked={selectedRate === "nonrefundable"}*/}
                        {/*                onChange={() => setSelectedRate("nonrefundable")}*/}
                        {/*                className="form-radio mt-1"*/}
                        {/*            />*/}
                        {/*            <div className="flex-1">*/}
                        {/*                <div className="flex justify-between items-start">*/}
                        {/*                    <div>*/}
                        {/*                        <p className="text-sm font-medium">Non-refundable</p>*/}
                        {/*                        <p className="text-xs text-gray-500">Cancel for free for 24 hours. After that, non-refundable.</p>*/}
                        {/*                        <p className="text-xs text-green-600 mt-1">Save Ksh 34, limited-time offer</p>*/}
                        {/*                    </div>*/}
                        {/*                    <div className="text-sm text-gray-900">Ksh {baseRates.nonrefundable.toFixed(2)}</div>*/}
                        {/*                </div>*/}
                        {/*            </div>*/}
                        {/*        </label>*/}

                        {/*        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">*/}
                        {/*            <input*/}
                        {/*                type="radio"*/}
                        {/*                name="rate"*/}
                        {/*                checked={selectedRate === "refundable"}*/}
                        {/*                onChange={() => setSelectedRate("refundable")}*/}
                        {/*                className="form-radio mt-1"*/}
                        {/*            />*/}
                        {/*            <div className="flex-1">*/}
                        {/*                <div className="flex justify-between items-start">*/}
                        {/*                    <div>*/}
                        {/*                        <p className="text-sm font-medium">Refundable</p>*/}
                        {/*                        <p className="text-xs text-gray-500">Cancel for free before Apr 2. Flexible payment options available.</p>*/}
                        {/*                    </div>*/}
                        {/*                    <div className="text-sm text-gray-900">Ksh {baseRates.refundable.toFixed(2)}</div>*/}
                        {/*                </div>*/}
                        {/*            </div>*/}
                        {/*        </label>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/* Payment method */}
                        <div className="bg-white rounded-xl shadow p-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">Payment method</h3>
                                <button
                                    className="text-sm text-[#00a699] font-medium"
                                    onClick={() => alert("Update payment method (demo)")}
                                >
                                    Update
                                </button>
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium">{paymentMethod.brand} •••• •••• •••• {paymentMethod.last4}</p>
                                    <p className="text-xs text-gray-500">Payment will be processed according to your selected rate.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Right column: summary */}
                    <aside className="space-y-6">
                        <div className="bg-white rounded-xl shadow p-5 sticky top-28">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Trip summary</h3>

                            <div className="flex items-start gap-3">
                                <img
                                    src={car.imagesList[1].url}
                                    alt={car.model}
                                    className="w-20 h-14 object-cover rounded-md flex-shrink-0"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{car.year} {car.make} {car.model}</p>
                                    {/*<p className="text-xs text-gray-500">{mockedCar.year} · {mockedCar.rating}★ ({mockedCar.trips} trips)</p>*/}
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-700 space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>Ksh {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Sales tax</span>
                                    <span>Ksh  {}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Distance included</span>
                                    <span>{mockedCar.distanceIncluded} miles</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Extra mile fee</span>
                                    <span>Ksh {mockedCar.extraMileFee.toFixed(2)} / mile</span>
                                </div>
                            </div>

                            <div className="mt-4 border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-500">Trip total</p>
                                        <p className="text-xs text-gray-500">Includes taxes and fees</p>
                                    </div>
                                    <div className="text-xl font-semibold text-gray-900">Ksh {calctotal.toFixed(2)}</div>
                                </div>
                            </div>

                            {/* Promo code */}
                            <div className="mt-4">
                                <label className="sr-only">Promo code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Promo code"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a699]"
                                    />
                                    <button
                                        onClick={applyPromo}
                                        className="bg-[#00a699] text-white px-4 py-2 rounded text-sm font-medium"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>

                            <button
                                className="mt-4 w-full bg-[#00a699] text-white py-3 rounded-lg font-semibold hover:opacity-95"
                                onClick={() => alert("Proceed to payment (demo)")}
                            >
                                Confirm and pay
                            </button>

                            <p className="text-xs text-gray-500 mt-3">
                                By confirming you agree to the host's terms and the rental policy.
                            </p>
                        </div>

                        {/* Small info card */}
                        <div className="bg-white rounded-xl shadow p-4 text-sm text-gray-700">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900">Protection & roadside</p>
                                    <p className="text-xs text-gray-500">Add protection to reduce your liability and get roadside assistance.</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
};
