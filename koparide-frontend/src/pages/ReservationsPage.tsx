// pages/ReservationPage.tsx
import React, { useMemo, useState, useEffect, useCallback, useRef, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import api from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import { AlertCircle } from 'lucide-react';
// Import components
import { CarHeader } from "../components/reservation/CarHeader";
import { TripDetails } from "../components/reservation/TripDetails";
import { ProtectionPlans } from "../components/reservation/ProtectionPlan";
import { CheckoutSummary } from "../components/reservation/CheckoutSummary";
import { ActionButtons } from "../components/reservation/ActionButtons";
import { InfoCard } from "../components/reservation/InfoCard";

// Import types and constants
import type {
    Car,
    BookingState,
    ProtectionType,
    RateType,
    PromoApplied
} from "../components/reservation/types";
import { PROTECTION_PRICES, TAX_RATE } from "../components/reservation/types";

export const ReservationPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const checkoutSummaryRef = useRef<{ getCardPaymentMethod: () => Promise<string | null> }>(null);
    const auth = useContext(AuthContext);

    // Validation errors state (only terms remains)
    const [validationErrors, setValidationErrors] = useState({
        terms: false,
    });

    // Core data states
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [bookingState, setBookingState] = useState<BookingState | null>(null);

    // UI states
    const [selectedRate] = useState<RateType>("nonrefundable");
    const [selectedProtection, setSelectedProtection] = useState<ProtectionType>("none");
    const [promoApplied, setPromoApplied] = useState<PromoApplied | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'mpesa'>('card');
    const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');

    // Terms
    const [termsAgreed, setTermsAgreed] = useState(false);

    // License blocking
    const [licenseBlocked, setLicenseBlocked] = useState(false);
    const [licenseMessage, setLicenseMessage] = useState('');

    // Processing states
    const [processing, setProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentPending, setPaymentPending] = useState(false);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);



    // ==================== DERIVED PRICES ====================
    // Helper to ensure numeric values
    const getBasePricePerDay = useCallback(() => {
        if (!car) return 0;
        return Number(car.pricePerDay);
    }, [car]);

    const getDriverFeePerDay = useCallback(() => {
        if (!car) return 0;
        if (car.rentalType !== 'with_driver') return 0;
        return Number(car.driverFeePerDay ?? 0);
    }, [car]);

    const getTotalPricePerDay = useCallback(() => {
        return getBasePricePerDay() + getDriverFeePerDay();
    }, [getBasePricePerDay, getDriverFeePerDay]);

    // Trip totals (numbers, not strings)
    const carOnlyTotal = useMemo(() => {
        if (!bookingState) return 0;
        return getBasePricePerDay() * bookingState.days;
    }, [bookingState, getBasePricePerDay]);

    const driverTotal = useMemo(() => {
        if (!bookingState) return 0;
        return getDriverFeePerDay() * bookingState.days;
    }, [bookingState, getDriverFeePerDay]);

    const totalCarAndDriver = useMemo(() => carOnlyTotal + driverTotal, [carOnlyTotal, driverTotal]);

    const protectionCost = useMemo(() => PROTECTION_PRICES[selectedProtection], [selectedProtection]);
    const subtotal = useMemo(() => totalCarAndDriver + protectionCost, [totalCarAndDriver, protectionCost]);
    const discountAmount = useMemo(() => promoApplied ? Math.min(promoApplied.discount, subtotal) : 0, [promoApplied, subtotal]);
    const taxAmount = useMemo(() => (subtotal - discountAmount) * TAX_RATE, [subtotal, discountAmount]);
    const totalAmount = useMemo(() => subtotal - discountAmount + taxAmount, [subtotal, discountAmount, taxAmount]);

    const canProceed = useMemo(() => {
        if (!car || !bookingState) return false;
        if (!termsAgreed) return false;
        if (processing || paymentPending) return false;
        return true;
    }, [car, bookingState, termsAgreed, processing, paymentPending]);
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
                    driverFeePerDay: raw.driverFeePerDay ?? 0,
                    rentalType: raw.rentalType || 'self_drive',
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

    // License check
    useEffect(() => {
        const checkLicenseForTrip = async () => {
            if (!auth?.user?.id) return;
            if (!bookingState?.endDate) return;
            try {
                const response = await api.get('/api/profile');
                const profile = response.data.user || response.data;
                const expiry = profile?.driversLicenseExpiry;
                if (!expiry) {
                    setLicenseBlocked(true);
                    setLicenseMessage("You haven't added your driver's license information. Please update your profile before booking a car.");
                    return;
                }
                const today = new Date(); today.setHours(0,0,0,0);
                const expiryDate = new Date(expiry); expiryDate.setHours(0,0,0,0);
                const tripEndDate = new Date(bookingState.endDate); tripEndDate.setHours(0,0,0,0);
                if (expiryDate < today) {
                    setLicenseBlocked(true);
                    setLicenseMessage(`Your driver's license expired on ${expiryDate.toLocaleDateString()}. Please update it in your profile before booking.`);
                    return;
                }
                if (expiryDate < tripEndDate) {
                    setLicenseBlocked(true);
                    setLicenseMessage(`Your driver's license will expire on ${expiryDate.toLocaleDateString()}, which is before your trip ends. Please update your license in your profile before booking this trip.`);
                    return;
                }
                setLicenseBlocked(false);
            } catch (err) {
                console.error("Failed to check license:", err);
                setLicenseBlocked(true);
                setLicenseMessage("Unable to verify your driver's license. Please update your profile and try again.");
            }
        };
        checkLicenseForTrip();
    }, [auth?.user, bookingState]);

    useEffect(() => {
        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, [pollingInterval]);

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

    const pollMpesaPayment = async (checkoutRequestId: string, maxAttempts = 30, intervalMs = 2000): Promise<any> => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, intervalMs));
            try {
                const statusRes = await api.get(`/api/payments/verify/${checkoutRequestId}`);
                if (statusRes.data?.isComplete === true) {
                    return statusRes.data.reservation;
                } else if (statusRes.data?.isComplete === false && statusRes.data?.message) {
                    throw new Error(statusRes.data.message);
                }
            } catch (err) {
                console.warn('Polling attempt failed', attempt, err);
            }
        }
        throw new Error('M-Pesa payment confirmation timeout. Please check your transaction status later.');
    };

    const handleConfirmPayment = useCallback(async () => {
        setValidationErrors(prev => ({ ...prev, terms: !termsAgreed }));
        if (!termsAgreed) {
            document.getElementById('terms-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setProcessing(true);
        setPaymentError(null);

        try {
            if (!car || !bookingState) throw new Error('Missing car or booking information');

            const paymentPayload: any = {
                method: selectedMethod,
                booking: {
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
                }
            };

            if (selectedMethod === 'card') {
                if (!checkoutSummaryRef.current) throw new Error('Payment form not initialized');
                const paymentMethodId = await checkoutSummaryRef.current.getCardPaymentMethod();
                if (!paymentMethodId) throw new Error('Please enter valid card details');
                paymentPayload.paymentDetails = { paymentMethodId };
            } else {
                if (!mpesaPhoneNumber || !/^254[0-9]{9}$/.test(mpesaPhoneNumber)) {
                    throw new Error('Valid M-Pesa phone number required (format 254XXXXXXXXX)');
                }
                paymentPayload.paymentDetails = { phoneNumber: mpesaPhoneNumber };
            }

            const response = await api.post('/api/payments/process', paymentPayload);
            const data = response.data;

            if (selectedMethod === 'card') {
                if (!data.payment?.success) throw new Error(data.payment?.message || 'Card payment failed');
                const reservation = data.payment.reservation;
                navigate('/bookings/confirmation', {
                    state: {
                        car,
                        booking: bookingState,
                        total: totalAmount,
                        protection: selectedProtection,
                        rate: selectedRate,
                        reservationId: reservation.id,
                        transactionId: data.payment.transactionId,
                        paymentMethod: selectedMethod,
                    }
                });
            } else {
                setPaymentPending(true);
                const checkoutRequestId = data.payment?.checkoutRequestId;
                if (!checkoutRequestId) throw new Error('Failed to initiate M-Pesa payment');
                const reservation = await pollMpesaPayment(checkoutRequestId);
                setPaymentPending(false);
                navigate('/bookings/confirmation', {
                    state: {
                        car,
                        booking: bookingState,
                        total: totalAmount,
                        protection: selectedProtection,
                        rate: selectedRate,
                        reservationId: reservation.id,
                        transactionId: reservation.mpesaReceipt || checkoutRequestId,
                        paymentMethod: selectedMethod,
                    }
                });
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            let errorMessage = 'Payment failed. Please try again.';
            if (error.response) {
                errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your connection.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            setPaymentError(errorMessage);
            setPaymentPending(false);
        } finally {
            setProcessing(false);
        }
    }, [
        car, bookingState, totalAmount, selectedProtection, selectedRate, subtotal,
        protectionCost, taxAmount, discountAmount, promoApplied, selectedMethod,
        mpesaPhoneNumber, checkoutSummaryRef, navigate, termsAgreed, pollMpesaPayment
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

    if (licenseBlocked) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center pt-24 pb-16">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">License Required</h2>
                        <p className="text-gray-600 mb-6">{licenseMessage}</p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-3 rounded-lg font-medium transition"
                        >
                            Update My Profile
                        </button>
                        <button
                            onClick={handleGoBack}
                            className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Back to Car Details
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ==================== MAIN RENDER ====================
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
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
                            <TripDetails bookingState={bookingState} />
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
                                basePrice={totalCarAndDriver}          // numeric total (car + driver)
                                driverFeeTotal={driverTotal}            // numeric driver portion
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
                                processing={processing || paymentPending}
                                paymentError={paymentError}
                                onConfirm={handleConfirmPayment}
                                onBack={handleGoBack}
                            />
                            {paymentPending && (
                                <div className="text-center text-sm text-gray-500 mt-2">
                                    Waiting for M-Pesa confirmation... Please check your phone.
                                </div>
                            )}
                            <InfoCard />
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
};