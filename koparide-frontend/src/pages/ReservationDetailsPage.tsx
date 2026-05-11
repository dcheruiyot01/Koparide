// pages/ReservationDetailsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../layout/NavBar';
import { Footer } from '../layout/Footer';
import {
    Car,
    Calendar,
    MapPin,
    User,
    Mail,
    CreditCard,
    Receipt,
    Shield,
    Fuel,
    Gauge,
    Settings,
    Users,
    Truck,
    AlertCircle,
} from 'lucide-react';
import api from '../api/axios';

// Type definitions based on your JSON
interface Car {
    id: number;
    make: string;
    model: string;
    year: number;
    pricePerDay: string;
    classification: string;
    seats: number;
    fuelType: string;
    location: string;
    transmission: string;
    cruiseControl: boolean;
    cc: number;
    rentalType: string;
    // add other fields if needed
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Reservation {
    id: number;
    carId: number;
    userId: number;
    startDate: string;
    endDate: string;
    pickupLocation: string;
    protectionPlan: string;
    subtotal: string;
    protectionCost: string;
    taxAmount: string;
    discountAmount: string;
    totalAmount: string;
    currency: string;
    mpesaCheckoutId: string | null;
    mpesaReceipt: string | null;
    status: string;
    car: Car;
    user: User;
}

export const ReservationDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Try to get reservation from location state (passed via navigation)
    const stateReservation = location.state?.reservation as Reservation | undefined;

    useEffect(() => {
        if (stateReservation) {
            // If we already have the full reservation object, use it
            setReservation(stateReservation);
            setLoading(false);
            return;
        }

        // Otherwise fetch by ID from the API
        const fetchReservation = async () => {
            if (!id) {
                setError('No reservation ID provided');
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/api/reservations/${id}`);
                // Adjust according to your actual API response structure
                const data = response.data.reservation || response.data;
                setReservation(data);
            } catch (err: any) {
                console.error('Failed to fetch reservation:', err);
                setError(err.response?.data?.message || 'Could not load reservation details');
            } finally {
                setLoading(false);
            }
        };

        fetchReservation();
    }, [id, stateReservation]);

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: string, currency: string) => {
        return `${currency} ${parseFloat(amount).toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A699]"></div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !reservation) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservation Not Found</h2>
                        <p className="text-gray-500 mb-6">{error || 'Unable to load reservation details.'}</p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="bg-[#00A699] text-white px-6 py-2 rounded-lg hover:bg-[#007A6E]"
                        >
                            Back to My Bookings
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                {/* Header with status badge */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reservation Details</h1>
                        <p className="text-gray-500 mt-1">Reservation #{reservation.id}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                        reservation.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : reservation.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {reservation.status}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content (2/3 width on large screens) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Car Card */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Car className="w-6 h-6 text-[#00A699]" />
                                <h2 className="text-xl font-semibold text-gray-900">Vehicle Information</h2>
                            </div>
                            <div className="border-b border-gray-100 pb-4 mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {reservation.car.make} {reservation.car.model}
                                </h3>
                                <p className="text-gray-500">{reservation.car.year} • {reservation.car.classification}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span>{reservation.car.seats} seats</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-gray-400" />
                                    <span className="capitalize">{reservation.car.transmission}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Fuel className="w-4 h-4 text-gray-400" />
                                    <span className="capitalize">{reservation.car.fuelType}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Gauge className="w-4 h-4 text-gray-400" />
                                    <span>{reservation.car.cc} cc</span>
                                </div>
                                {reservation.car.cruiseControl && (
                                    <div className="flex items-center gap-2 col-span-2">
                                        <Truck className="w-4 h-4 text-gray-400" />
                                        <span>Cruise Control</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <span className="text-gray-600">Car location: {reservation.car.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Rental Period & Pickup */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="w-6 h-6 text-[#00A699]" />
                                <h2 className="text-xl font-semibold text-gray-900">Rental Period</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Start</p>
                                    <p className="font-medium">{formatDate(reservation.startDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">End</p>
                                    <p className="font-medium">{formatDate(reservation.endDate)}</p>
                                </div>
                                <div className="pt-2 border-t border-gray-100">
                                    <p className="text-sm text-gray-500">Pickup Location</p>
                                    <p className="font-medium">{reservation.pickupLocation}</p>
                                </div>
                            </div>
                        </div>

                        {/* Renter Information */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <User className="w-6 h-6 text-[#00A699]" />
                                <h2 className="text-xl font-semibold text-gray-900">Renter Details</h2>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">{reservation.user.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{reservation.user.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (1/3 width) - Payment Summary */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                            <div className="flex items-center gap-3 mb-4">
                                <CreditCard className="w-6 h-6 text-[#00A699]" />
                                <h2 className="text-xl font-semibold text-gray-900">Payment Summary</h2>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{formatCurrency(reservation.subtotal, reservation.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Protection Plan</span>
                                    <div className="text-right">
                                        <span className="capitalize block">{reservation.protectionPlan.replace('_', ' ')}</span>
                                        <span className="text-xs text-gray-400">{formatCurrency(reservation.protectionCost, reservation.currency)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tax</span>
                                    <span>{formatCurrency(reservation.taxAmount, reservation.currency)}</span>
                                </div>
                                {parseFloat(reservation.discountAmount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(reservation.discountAmount, reservation.currency)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-semibold text-gray-900 pt-3 border-t border-dashed">
                                    <span>Total Paid</span>
                                    <span>{formatCurrency(reservation.totalAmount, reservation.currency)}</span>
                                </div>
                            </div>

                            {/* M-Pesa receipt if available */}
                            {reservation.mpesaReceipt && (
                                <div className="mt-6 p-3 bg-blue-50 rounded-xl">
                                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                                        <Receipt className="w-4 h-4" />
                                        <span className="text-sm font-medium">M-Pesa Confirmation</span>
                                    </div>
                                    <p className="text-xs text-blue-600 break-all">Receipt: {reservation.mpesaReceipt}</p>
                                    {reservation.mpesaCheckoutId && (
                                        <p className="text-xs text-blue-600 break-all mt-1">Checkout ID: {reservation.mpesaCheckoutId}</p>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => navigate('/profile')}
                                className="mt-6 w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                            >
                                Back to My Bookings
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};