// components/AdminRoute.tsx
import { useContext, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';

export const AdminRoute = ({ children }: { children: JSX.Element }) => {
    const auth = useContext(AuthContext);
    const location = useLocation();
    const hasOpenedModal = useRef(false);

    const { user, openAuthModal } = auth || {};

    useEffect(() => {
        if (!user && openAuthModal && !hasOpenedModal.current) {
            hasOpenedModal.current = true;
            // Store the attempted path so we can redirect after login
            sessionStorage.setItem('redirectAfterAuth', location.pathname);
            openAuthModal('login');
        }
    }, [user, openAuthModal, location.pathname]);

    if (!user) {
        return null;
    }

    if (user.role !== 'admin') {
        return <Navigate to="/" />;
    }

    // Clear the stored redirect if we successfully reached the admin page
    sessionStorage.removeItem('redirectAfterAuth');
    return children;
};