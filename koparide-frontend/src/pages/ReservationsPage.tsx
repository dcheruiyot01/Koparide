import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import api from "../api/axios";

// Import components
import { CarHeader } from "../components/reservation/CarHeader";
import { TripDetails } from "../components/reservation/TripDetails";
import { ProtectionPlans } from "../components/reservation/ProtectionPlan";
import { CheckoutSummary } from "../components/reservation/CheckoutSummary";
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
import { PROTECTION_PRICES, TAX_RATE } from "../components/reservation/types";

export const ReservationPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const checkoutSummaryRef = useRef<{ getCardPaymentMethod: () => Promise<string | null> }>(null);

    // Validation errors state
    const [validationErrors, setValidationErrors] = useState({
        license: false,
        terms: false,
    });

    // Core data states
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [bookingState, setBookingState] = useState<BookingState | null>(null);
    const [reservationId, setReservationId] = useState<number | null>(null); // Added reservationId state

    // UI states
    const [selectedRate] = useState<RateType>("nonrefundable");
    const [selectedProtection, setSelectedProtection] = useState<ProtectionType>("standard");
    const [promoApplied, setPromoApplied] = useState<PromoApplied | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'mpesa'>('card');
    const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');

    // License & terms
    const [licenseExpired] = useState(true);
    const [licenseAcknowledged, setLicenseAcknowledged] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);

    // Processing
    const [processing, setProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // ==================== DERIVED PRICES ====================
    const basePrice = useMemo(() => {
        if (!car || !bookingState) return 0;
        return Number(car.pricePerDay) * bookingState.days;
    }, [car, bookingState]);

    const protectionCost = useMemo(() => PROTECTION_PRICES[selectedProtection], [selectedProtection]);

    const subtotal = useMemo(() => basePrice + protectionCost, [basePrice, protectionCost]);

    const discountAmount = useMemo(() => {
        if (promoApplied) return Math.min(promoApplied.discount, subtotal);
        return 0;
    }, [promoApplied, subtotal]);

    const taxAmount = useMemo(() => (subtotal - discountAmount) * TAX_RATE, [subtotal, discountAmount]);

    const totalAmount = useMemo(() => subtotal - discountAmount + taxAmount, [subtotal, discountAmount, taxAmount]);

    const canProceed = useMemo(() => {
        if (!car || !bookingState) return false;
        if (licenseExpired && !licenseAcknowledged) return false;
        if (!termsAgreed) return false;
        if (processing) return false;
        return true;
    }, [car, bookingState, licenseExpired, licenseAcknowledged, termsAgreed, processing]);

    // ==================== EFFECTS ====================
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

    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        const fetchCar = async () => {
            try {
                setLoading(true);
                setFetchError(null);
                const res = await api.get(`/api/cars/${id}`, { signal: controller.signal, timeout: 10000 });
                const raw = res.data?.data ?? res.data ?? null;
                if (!raw) {
                    setFetchError("Car not found");
                    setCar(null);
                    return;
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
                    imagesList: raw.imagesList || [],
                    owner: raw.owner || { id: 0, name: "Unknown Host", email: "" },
                    renter: raw.renter || null,
                    rating: raw.rating || 0,
                    trips: raw.trips || 0,
                };
                setCar(normalized);
            } catch (err: any) {
                if (err.name === "CanceledError" || err.name === "AbortError") return;
                setFetchError(err.response?.status === 404 ? "Car not found" : "Failed to load car details");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        fetchCar();
        return () => controller.abort();
    }, [id]);

    // ==================== HANDLERS ====================
    const handleGoBack = useCallback(() => navigate(`/cars/${id}`), [id, navigate]);

    const handlePaymentMethodChange = useCallback((method: 'card' | 'mpesa', details?: any) => {
        setSelectedMethod(method);
        if (method === 'mpesa' && details?.phoneNumber) {
            setMpesaPhoneNumber(details.phoneNumber);
        }
    }, []);

    const handleApplyPromo = useCallback(async (code: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const promos: Record<string, number> = { "SAVE34": 34, "WELCOME10": 10, "FIRSTRIDE": 25 };
        const normalizedCode = code.trim().toUpperCase();
        if (promos[normalizedCode]) {
            setPromoApplied({ discount: promos[normalizedCode], code: normalizedCode });
        } else {
            throw new Error("Invalid promo code");
        }
    }, []);

    const handleConfirmPayment = useCallback(async () => {
        // Validate required fields
        const errors = {
            license: licenseExpired && !licenseAcknowledged,
            terms: !termsAgreed,
        };
        setValidationErrors(errors);

        if (errors.license || errors.terms) {
            if (errors.license) {
                document.getElementById('license-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (errors.terms) {
                document.getElementById('terms-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setProcessing(true);
        setPaymentError(null);

        try {
            // Validate car and booking state
            if (!car || !bookingState) {
                throw new Error('Missing car or booking information');
            }

            // Get payment details based on selected method
            let paymentDetails: any = {};

            if (selectedMethod === 'card') {
                if (!checkoutSummaryRef.current) {
                    throw new Error('Payment form not initialized');
                }
                const paymentMethodId = await checkoutSummaryRef.current.getCardPaymentMethod();
                if (!paymentMethodId) {
                    throw new Error('Please enter valid card details');
                }
                paymentDetails = { paymentMethodId };
            } else {
                if (!mpesaPhoneNumber || mpesaPhoneNumber.length < 10) {
                    throw new Error('Please enter a valid M-Pesa phone number');
                }
                paymentDetails = { phoneNumber: mpesaPhoneNumber };
            }

            // Step 1: Create reservation
            const reservationPayload = {
                carId: car.id,
                startDate: bookingState.startDate,
                endDate: bookingState.endDate,
                pickupLocation: bookingState.location,
                protectionPlan: selectedProtection,
                promoCode: promoApplied?.code || null,
                subtotal,
                protectionCost,
                taxAmount,
                discountAmount,
                totalAmount,
                currency: 'KES',
            };

            console.log('Creating reservation...', reservationPayload);
            const reservationRes = await api.post('/api/reservations', reservationPayload);

            if (!reservationRes.data?.reservation?.id) {
                throw new Error('Failed to create reservation');
            }

            const reservation = reservationRes.data.reservation;
            setReservationId(reservation.id);

            // Step 2: Process payment
            const paymentPayload = {
                method: selectedMethod,
                reservationId: reservation.id,
                paymentDetails,
            };

            console.log('Processing payment...', paymentPayload);
            const paymentRes = await api.post('/api/payments/process', paymentPayload);

            // Step 3: Handle response
            if (paymentRes.data?.success) {
                // Payment successful
                navigate(`/bookings/confirmation`, {
                    state: {
                        car,
                        booking: bookingState,
                        total: totalAmount,
                        protection: selectedProtection,
                        rate: selectedRate,
                        reservationId: reservation.id,
                        transactionId: paymentRes.data.payment?.transactionId ||
                            paymentRes.data.payment?.checkoutRequestId,
                        paymentMethod: selectedMethod,
                    }
                });
            } else {
                throw new Error(paymentRes.data?.message || 'Payment processing failed');
            }
        } catch (error: any) {
            console.error('Payment error:', error);

            // Handle different error types
            let errorMessage = 'Payment failed. Please try again.';

            if (error.response) {
                // Backend returned an error response
                errorMessage = error.response.data?.message ||
                    `Server error: ${error.response.status}`;
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'No response from server. Please check your connection.';
            } else if (error.message) {
                // Local error
                errorMessage = error.message;
            }

            setPaymentError(errorMessage);
        } finally {
            setProcessing(false);
        }
    }, [
        car, bookingState, totalAmount, selectedProtection, selectedRate, subtotal,
        protectionCost, taxAmount, discountAmount, promoApplied, selectedMethod,
        mpesaPhoneNumber, checkoutSummaryRef, navigate, licenseExpired,
        licenseAcknowledged, termsAgreed
    ]);

    // ==================== LOADING & ERROR STATES ====================
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
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md mx-auto">
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

    // ==================== MAIN RENDER ====================
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                {/* Simple back link */}
                <button
                    onClick={handleGoBack}
                    className="flex items-center text-sm text-gray-500 hover:text-[#00A699] mb-6 group"
                >
                    <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to car details
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <CarHeader car={car} bookingState={bookingState} />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip details</h2>
                            <TripDetails
                                bookingState={bookingState}
                                licenseExpired={licenseExpired}
                                licenseAcknowledged={licenseAcknowledged}
                                onLicenseAcknowledge={setLicenseAcknowledged}
                                error={validationErrors.license}
                            />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Protection plan</h2>
                            <ProtectionPlans
                                selectedProtection={selectedProtection}
                                onProtectionChange={setSelectedProtection}
                            />
                        </div>
                    </div>

                    {/* Right column */}
                    <aside className="lg:col-span-1 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            <CheckoutSummary
                                ref={checkoutSummaryRef}
                                selectedMethod={selectedMethod}
                                onMethodChange={handlePaymentMethodChange}
                                mpesaPhoneNumber={mpesaPhoneNumber}
                                onMpesaPhoneChange={setMpesaPhoneNumber}
                                basePrice={basePrice}
                                protectionCost={protectionCost}
                                discountAmount={discountAmount}
                                taxAmount={taxAmount}
                                totalAmount={totalAmount}
                                days={bookingState.days}
                                selectedRate={selectedRate}
                                promoApplied={promoApplied}
                                onApplyPromo={handleApplyPromo}
                                onPaymentMethodChange={handlePaymentMethodChange}
                                termsAgreed={termsAgreed}
                                onTermsChange={setTermsAgreed}
                                termsError={validationErrors.terms}
                            />
                            <ActionButtons
                                canProceed={canProceed}
                                processing={processing}
                                paymentError={paymentError}
                                onConfirm={handleConfirmPayment}
                                onBack={handleGoBack}
                            />
                            <InfoCard />
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
};