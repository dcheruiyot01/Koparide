// src/auth/AuthContext.tsx
import {
    createContext,
    useState,
    useEffect,
    ReactNode,
    useCallback
} from "react";
import api, { setAuthToken } from "../api/axios";
import type { AuthResponse, User } from "../types/auth";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface Props {
    children: ReactNode;
}

export const AuthProvider = ({ children }: Props): JSX.Element => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * On app startup, hydrate auth state from localStorage.
     * This keeps the user logged in across page reloads.
     */
    useEffect(() => {
        const storedToken = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setAuthToken(storedToken); // attach to axios globally
            setUser(JSON.parse(storedUser));
        }

        setLoading(false);
    }, []);

    /**
     * Persist auth state in React + localStorage.
     * Called after login/register/oauth.
     */
    const persistAuth = (data: AuthResponse) => {
        setUser(data.user);
        setToken(data.token);
        setAuthToken(data.token);

        localStorage.setItem("accessToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
    };

    /**
     * Register new user.
     */
    const register = useCallback(async (name: string, email: string, password: string) => {
        const res = await api.post<AuthResponse>("/auth/register", { name, email, password });
        persistAuth(res.data);
    }, []);

    /**
     * Normal email/password login.
     */
    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post<AuthResponse>("/auth/login", { email, password });
        persistAuth(res.data);
    }, []);

    /**
     * Google OAuth login.
     */
    const googleLogin = useCallback(async (credential: string) => {
        const res = await api.post<AuthResponse>("/auth/oauth/google", { credential });
        persistAuth(res.data);
    }, []);

    /**
     * Logout clears backend session + local state.
     */
    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout"); // backend clears refresh cookie
        } catch {
            // Ignore network errors — logout should still clear local state
        } finally {
            setUser(null);
            setToken(null);
            setAuthToken(null);

            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
        }
    }, []);

    const value: AuthContextValue = {
        user,
        token,
        loading,
        login,
        googleLogin,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
