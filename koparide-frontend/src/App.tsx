import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Login } from "./pages/auth/user/Login.tsx";
import { Register } from "./pages/auth/user/Register.tsx";
import { ForgotPassword } from "./pages/auth/user/ForgotPassword.tsx";
import { ResetPassword } from "./pages/auth/user/ResetPassword.tsx";
import { VerifyEmailRequest } from "./pages/auth/user/VerifyEmailRequest.tsx";
import { VerifyEmail } from "./pages/auth/user/VerifyEmail.tsx";
import { Dashboard } from "./pages/auth/Dashboard";
import { HomePage } from "./layout/HomePage";
import { DashboardLayout } from "./layout/ DashboardLayout";
import { useAuth } from "./auth/useAuth";
import { ProfileHome } from "./layout/ProfileHome"

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
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <Dashboard />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};
