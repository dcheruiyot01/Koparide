import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { Login } from "./pages/auth/user/Login.tsx";
import { Register } from "./pages/auth/user/Register.tsx";
import { ForgotPassword } from "./pages/auth/user/ForgotPassword.tsx";
import { ResetPassword } from "./pages/auth/user/ResetPassword.tsx";
import { VerifyEmailRequest } from "./pages/auth/user/VerifyEmailRequest.tsx";
import { VerifyEmail } from "./pages/auth/user/VerifyEmail.tsx";
import { HomePage } from "./layout/HomePage";
import { useAuth } from "./auth/useAuth";
import { ProfileHome } from "./layout/ProfileHome"
import { HostPage } from "./pages/HostPage"
import { CarPage } from "./pages/CarPage"
import { CarsPage } from "./pages/CarsPage.tsx"
import { MessagesNotificationsPage } from "./pages/MessagesPage"
import { ReservationPage } from "./pages/ReservationsPage";
import { BookingConfirmation } from "./pages/BookingConfirmation";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

/**
 * Protects routes that require authentication.
 */
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { user, loading } = useAuth();

    if (loading) return <p>Loading...</p>;
    if (!user) return <Navigate to="/login" replace />;

    return children;
};

export const App = () => {
    return (
        <BrowserRouter>
            <Elements stripe={stripePromise}>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/cars" element={<CarsPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmailRequest />} />
                    <Route path="/verify-email/:token" element={<VerifyEmail />} />

                    {/* Car detail page - note: this should be public if users can view cars without logging in */}
                    <Route path="/cars/:id" element={<CarPage />} />

                    {/* Reservation page - needs Stripe AND authentication */}
                    <Route
                        path="/cars/:id/reservations"
                        element={
                            <ProtectedRoute>
                                <ReservationPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/bookings/confirmation"
                        element={
                            <ProtectedRoute>
                                <BookingConfirmation />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected routes */}
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfileHome />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/messages"
                        element={
                            <ProtectedRoute>
                                <MessagesNotificationsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/host"
                        element={
                            <ProtectedRoute>
                                <HostPage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Elements>
        </BrowserRouter>
    );
};