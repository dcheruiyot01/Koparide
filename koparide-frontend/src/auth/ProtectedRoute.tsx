// src/auth/ProtectedRoute.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "./useAuth";

interface ProtectedRouteProps {
    children: JSX.Element;
    /**
     * Optional role required to access this route.
     * Currently only "admin" is supported.
     * If not provided, any authenticated user can access.
     */
    requiredRole?: "admin";
}

/**
 * ProtectedRoute Component
 *
 * - If user is NOT authenticated:
 *   - Opens the login modal (via AuthContext)
 *   - Stores the current URL to redirect after login
 *   - Shows a toast notification
 *   - Returns `null` (nothing renders until login is complete)
 * - If user IS authenticated but the required role is not satisfied:
 *   - Shows an "Access Denied" message with a button to go home
 * - Otherwise renders the child components.
 */
export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { user, loading, openAuthModal } = useAuth();
    const navigate = useNavigate();

    // Handle unauthenticated users
    useEffect(() => {
        if (!loading && !user) {
            const currentPath = window.location.pathname + window.location.search;
            // Open the global login modal and store the intended redirect path
            openAuthModal("login", currentPath);
            // Show a user-friendly toast (duplicate ID prevents multiple toasts)
            toast.error("Please log in to continue", { id: "auth-required" });
        }
    }, [loading, user, openAuthModal]);

    // Show a simple loading indicator while checking auth state
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A699]" />
            </div>
        );
    }

    // Not authenticated – block rendering (modal will appear)
    if (!user) {
        return null;
    }

    // Role‑based access control
    if (requiredRole && user.role !== requiredRole) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                <p className="text-gray-600 mb-6">
                    You don't have permission to view this page. This area is restricted to administrators only.
                </p>
                <button
                    onClick={() => navigate("/")}
                    className="bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-2 rounded-lg font-medium transition"
                >
                    Return to Home
                </button>
            </div>
        );
    }

    // Authorized – render the protected content
    return children;
};