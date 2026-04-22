import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Toaster } from "react-hot-toast";

import { Navbar } from "./layout/Navbar";
import { ProtectedRoute } from "./auth/ProtectedRoute";

import { Login } from "./pages/auth/user/Login";
import { Register } from "./pages/auth/user/Register";
import { ForgotPassword } from "./pages/auth/user/ForgotPassword";
import { ResetPassword } from "./pages/auth/user/ResetPassword";
import { VerifyEmailRequest } from "./pages/auth/user/VerifyEmailRequest";
import { VerifyEmail } from "./pages/auth/user/VerifyEmail";

import { HomePage } from "./layout/HomePage";
import { ProfileHome } from "./layout/ProfileHome";
import { HostPage } from "./pages/HostPage";
import { CarPage } from "./pages/CarPage";
import { CarsPage } from "./pages/CarsPage";
import { MessagesNotificationsPage } from "./pages/MessagesPage";
import { ReservationPage } from "./pages/ReservationsPage";
import { BookingConfirmation } from "./pages/BookingConfirmation";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const App = () => {
    return (
        <BrowserRouter>
            {/* Navbar MUST be here so it can render the modal */}
            <Navbar />

            <Elements stripe={stripePromise}>
                <Toaster position="top-center" />

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

                    {/* Car detail page (public) */}
                    <Route path="/cars/:id" element={<CarPage />} />

                    {/* Reservation page (protected) */}
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
