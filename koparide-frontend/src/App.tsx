import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { VerifyEmailRequest } from "./pages/auth/VerifyEmailRequest";
import { VerifyEmail } from "./pages/auth/VerifyEmail";
import { Dashboard } from "./pages/auth/Dashboard";
import { HomePage } from "./layout/HomePage";
import { DashboardLayout } from "./layout/ DashboardLayout";
import { useAuth } from "./auth/useAuth";

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


                {/*<Route*/}
                {/*    path="/"*/}
                {/*    element={*/}
                {/*            <LandingLayout>*/}
                {/*                <LandingPage />*/}
                {/*            </LandingLayout>*/}
                {/*    }*/}
                {/*/>*/}
                {/* Protected Dashboard */}
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
