// src/auth/ProtectedRoute.tsx
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./useAuth";

/**
 * Route guard:
 * - If user is not logged in:
 *   - Opens the LOGIN modal
 *   - Stores the current route for redirect
 *   - Shows a toast
 *   - Blocks rendering
 */
export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { user, loading, openAuthModal } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            const currentPath = window.location.pathname + window.location.search;

            // Open login modal and remember where user was going
            openAuthModal("login", currentPath);

            // Toast (ID prevents duplicates)
            toast.error("Please log in to continue", { id: "auth-required" });
        }
    }, [loading, user, openAuthModal]);

    if (loading) return <p>Loading...</p>;
    if (!user) return null;

    return children;
};
