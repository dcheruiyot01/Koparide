import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import { CarListingsPage } from "./pages/CarListingsPage"
import { MessagesNotificationsPage } from "./pages/MessagesPage"
import {ReservationPage} from "./pages/ReservationsPage";

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
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage/>} />
                <Route path="/listings" element={<CarListingsPage/>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmailRequest />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />

                {/*-- protected routes --*/}
                <Route
                    path="/profile"
                    element={
                    <ProtectedRoute>
                        <ProfileHome />
                    </ProtectedRoute> } />
                <Route
                    path="/messages"
                    element={
                    <ProtectedRoute>
                        <MessagesNotificationsPage />
                    </ProtectedRoute> } />
                <Route
                    path="/host"
                    element={
                        <ProtectedRoute>
                            <HostPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cars/1"
                    element={
                        <ProtectedRoute>
                            <CarPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cars/1/reservations"
                    element={
                        <ProtectedRoute>
                            <ReservationPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};
