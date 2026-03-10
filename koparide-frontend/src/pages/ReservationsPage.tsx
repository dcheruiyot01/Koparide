import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import api from "../api/axios";

// Import components
import { CarHeader } from "../components/reservation/CarHeader";
import { TripDetails } from "../components/reservation/TripDetails";
import { ProtectionPlans } from "../components/reservation/ProtectionPlan";
import { PaymentMethod } from "../components/reservation/PaymentMethod";
import { PriceSummary } from "../components/reservation/PriceSummary";
import { ActionButtons } from "../components/reservation/ActionsButton";
import { InfoCard } from "../components/reservation/InfoCard";

// Import types and constants
import type {
    Car,
    BookingState,
    ProtectionType,
    RateType,
    PaymentMethod as PaymentMethodType,
    PromoApplied
} from "../components/reservation/types";
import { PROTECTION_PRICES, TAX_RATE, DEFAULT_CAR_IMAGE } from "../components/reservation/types";

// ==================== MAIN COMPONENT ====================

export const ReservationPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    // ==================== STATE ====================

    // Car data
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Booking data from navigation state
    const [bookingState, setBookingState] = useState<BookingState | null>(null);

    // UI state
    const [selectedRate] = useState<RateType>("nonrefundable"); // Can be expanded later
    const [selectedProtection, setSelectedProtection] = useState<ProtectionType>("standard");
    const [promoApplied, setPromoApplied] = useState<PromoApplied | null>(null);

    // Payment method state
    const [paymentMethod] = useState<PaymentMethodType>({
        brand: "Visa",
        last4: "1423",
        expiry: "04/26",
        default: true,
    });

    // License warning
    const [licenseExpired] = useState(true); // Would come from user profile
    const [licenseAcknowledged, setLicenseAcknowledged] = useState(false);

    // Terms agreement
    const [termsAgreed, setTermsAgreed] = useState(false);

    // Processing state
    const [processing, setProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // ==================== DERIVED VALUES ====================

    const basePrice = useMemo(() => {
        if (!car || !bookingState) return 0;
        return Number(car.pricePerDay) * bookingState.days;
    }, [car, bookingState]);

    const protectionCost = useMemo(() => {
        return PROTECTION_PRICES[selectedProtection];
    }, [selectedProtection]);

    const subtotal = useMemo(() => {
        return basePrice + protectionCost;
    }, [basePrice, protectionCost]);

    const discountAmount = useMemo(() => {
        if (promoApplied) {
            return Math.min(promoApplied.discount, subtotal);
        }

        // Non-refundable rate gets an automatic discount
        if (selectedRate === "nonrefundable" && basePrice > 0) {
            return Math.min(0, basePrice);
        }

        return 0;
    }, [selectedRate, basePrice, promoApplied, subtotal]);

    const taxAmount = useMemo(() => {
        return (subtotal - discountAmount) * TAX_RATE;
    }, [subtotal, discountAmount]);

    const totalAmount = useMemo(() => {
        return subtotal - discountAmount + taxAmount;
    }, [subtotal, discountAmount, taxAmount]);

    const canProceed = useMemo(() => {
        if (!car || !bookingState) return false;
        if (licenseExpired && !licenseAcknowledged) return false;
        if (!termsAgreed) return false;
        if (processing) return false;
        return true;
    }, [car, bookingState, licenseExpired, licenseAcknowledged, termsAgreed, processing]);

    // ==================== EFFECTS ====================

    // Extract booking state from location
    useEffect(() => {
        const state = location.state as BookingState;

        if (!state) {
            navigate(`/cars/${id}`, {
                replace: true,
                state: { error: "Please select dates and location first" }
            });
            return;
        }

        setBookingState(state);
    }, [location.state, id, navigate]);

    // Fetch car details
    useEffect(() => {
        if (!id) return;

        const controller = new AbortController();

        const fetchCar = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await api.get(`/api/cars/${id}`, {
                    signal: controller.signal,
                    timeout: 10000
                });

                const raw = res.data?.data ?? res.data ?? null;

                if (!raw) {
                    setFetchError("Car not found");
                    setCar(null);
                    return;
                }

                if (!raw.imagesList || !Array.isArray(raw.imagesList)) {
                    raw.imagesList = [];
                }

                const normalized: Car = {
                    id: raw.id,
                    ownerId: raw.ownerId,
                    make: raw.make || "Unknown",
                    model: raw.model || "Vehicle",
                    year: raw.year || new Date().getFullYear(),
                    pricePerDay: raw.pricePerDay || "0",
                    classification: raw.classification || "Standard",
                    fuelType: raw.fuelType || "Gasoline",
                    status: raw.status || "pending",
                    rented_to: raw.rented_to || null,
                    imagesList: raw.imagesList,
                    owner: raw.owner || {
                        id: 0,
                        name: "Unknown Host",
                        email: "",
                    },
                    renter: raw.renter || null,
                    rating: raw.rating || 0,
                    trips: raw.trips || 0,
                };

                setCar(normalized);
            } catch (err: any) {
                if (err.name === "CanceledError" || err.name === "AbortError") return;

                if (err.code === "ECONNABORTED") {
                    setFetchError("Request timeout. Please check your connection.");
                } else if (err.response?.status === 404) {
                    setFetchError("Car not found");
                } else {
                    setFetchError("Failed to load car details");
                }

                console.error("fetchCar error", err);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchCar();
        return () => controller.abort();
    }, [id]);

    // ==================== HANDLERS ====================

    const handleApplyPromo = useCallback(async (code: string) => {
        // Mock API call - replace with actual API
        await new Promise(resolve => setTimeout(resolve, 500));

        const normalizedCode = code.trim().toUpperCase();

        const promos: Record<string, number> = {
            "SAVE34": 34,
            "WELCOME10": 10,
            "FIRSTRIDE": 25,
        };

        if (promos[normalizedCode]) {
            setPromoApplied({ discount: promos[normalizedCode], code: normalizedCode });
        } else {
            throw new Error("Invalid promo code");
        }
    }, []);

    const handleConfirmPayment = useCallback(async () => {
        if (!canProceed) return;

        setProcessing(true);
        setPaymentError(null);

        try {
            // Mock payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Navigate to confirmation page
            navigate(`/bookings/confirmation`, {
                state: {
                    car,
                    booking: bookingState,
                    total: totalAmount,
                    protection: selectedProtection,
                    rate: selectedRate,
                }
            });
        } catch (error) {
            setPaymentError("Payment failed. Please try again.");
            console.error("Payment error:", error);
        } finally {
            setProcessing(false);
        }
    }, [canProceed, car, bookingState, totalAmount, selectedProtection, selectedRate, navigate]);

    const handleGoBack = useCallback(() => {
        navigate(`/cars/${id}`);
    }, [id, navigate]);

    // ==================== RENDER HELPERS ====================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                    <div className="flex justify-center items-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A699] mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading reservation details...</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (fetchError || !car) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md mx-auto">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                        <p className="text-red-600 mb-6">{fetchError || "Failed to load reservation"}</p>
                        <button
                            onClick={handleGoBack}
                            className="bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-2 rounded-lg font-medium transition"
                        >
                            Go Back
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!bookingState) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                {/* Breadcrumb */}
                <nav className="text-sm text-gray-500 mb-6">
                    <ol className="flex items-center space-x-2">
                        <li><a href="/cars" className="hover:text-[#00A699]">Cars</a></li>
                        <li><span className="mx-2">/</span></li>
                        <li><a href={`/cars/${id}`} className="hover:text-[#00A699]">{car.make} {car.model}</a></li>
                        <li><span className="mx-2">/</span></li>
                        <li className="text-gray-900 font-medium">Reservation</li>
                    </ol>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column: booking details */}
                    <section className="lg:col-span-2 space-y-6">
                        <CarHeader car={car} bookingState={bookingState} />

                        <TripDetails
                            bookingState={bookingState}
                            licenseExpired={licenseExpired}
                            licenseAcknowledged={licenseAcknowledged}
                            onLicenseAcknowledge={setLicenseAcknowledged}
                        />

                        <ProtectionPlans
                            selectedProtection={selectedProtection}
                            onProtectionChange={setSelectedProtection}
                        />

                        <PaymentMethod
                            paymentMethod={paymentMethod}
                            termsAgreed={termsAgreed}
                            onTermsChange={setTermsAgreed}
                            onUpdatePayment={() => alert("Update payment method (demo)")}
                        />
                    </section>

                    {/* Right column: summary */}
                    <aside className="space-y-6">
                        <PriceSummary
                            basePrice={basePrice}
                            protectionCost={protectionCost}
                            discountAmount={discountAmount}
                            taxAmount={taxAmount}
                            totalAmount={totalAmount}
                            days={bookingState.days}
                            selectedRate={selectedRate}
                            promoApplied={promoApplied}
                            onApplyPromo={handleApplyPromo}
                        />

                        <ActionButtons
                            canProceed={canProceed}
                            processing={processing}
                            paymentError={paymentError}
                            onConfirm={handleConfirmPayment}
                            onBack={handleGoBack}
                        />

                        <InfoCard />
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
};