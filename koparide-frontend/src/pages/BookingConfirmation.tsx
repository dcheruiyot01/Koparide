// pages/BookingConfirmation.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../layout/NavBar';
import { Footer } from '../layout/Footer';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';

export const BookingConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('');

    // Get data passed via state (from successful direct payment)
    const stateData = location.state as any;
    const car = stateData?.car;
    const booking = stateData?.booking;
    const total = stateData?.total;
    const protection = stateData?.protection;
    const rate = stateData?.rate;
    const reservationId = stateData?.reservationId;

    // Check for Stripe redirect query params
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const paymentIntent = query.get('payment_intent');
        const paymentIntentClientSecret = query.get('payment_intent_client_secret');
        const redirectStatus = query.get('redirect_status'); // 'succeeded' or 'failed'

        if (paymentIntent && redirectStatus) {
            // We came back from Stripe redirect
            if (redirectStatus === 'succeeded') {
                setStatus('success');
                setMessage('Payment successful! Your booking is confirmed.');
                // Optionally fetch the updated reservation from your backend
                if (reservationId) {
                    api.get(`/api/reservations/${reservationId}`).then(res => {
                        // You could update local state if needed
                    }).catch(console.error);
                }
            } else {
                setStatus('failed');
                setMessage('Payment failed or was cancelled. Please try again.');
            }
        } else if (stateData && car) {
            // Direct success (no redirect)
            setStatus('success');
            setMessage('Payment successful! Your booking is confirmed.');
        } else {
            // No data – show error
            setStatus('failed');
            setMessage('No booking information found.');
        }
    }, [location, reservationId]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 text-[#00A699] animate-spin" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                    {status === 'success' ? (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
                            <p className="text-gray-500 mb-8">{message}</p>

                            {car && booking && (
                                <div className="border-t border-gray-100 pt-6 text-left">
                                    <h2 className="font-semibold text-gray-900 mb-4">Trip Details</h2>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-gray-500">Car:</span> {car.make} {car.model} {car.year}</p>
                                        <p><span className="text-gray-500">Dates:</span> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
                                        <p><span className="text-gray-500">Location:</span> {booking.location}</p>
                                        <p><span className="text-gray-500">Protection plan:</span> {protection}</p>
                                        <p><span className="text-gray-500">Total paid:</span> Ksh {total?.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                    <XCircle className="w-10 h-10 text-red-600" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                            <p className="text-gray-500 mb-8">{message}</p>
                            <button
                                onClick={() => navigate('/cars')}
                                className="bg-[#00A699] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#007A6E]"
                            >
                                Browse Cars
                            </button>
                        </>
                    )}

                    {status === 'success' && (
                        <button
                            onClick={() => navigate('/profile')}
                            className="mt-8 bg-[#00A699] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#007A6E] w-full"
                        >
                            View My Bookings
                        </button>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};