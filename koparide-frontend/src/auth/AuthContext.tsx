// src/auth/AuthContext.tsx
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode
} from "react";
import api, { setAuthToken } from "../api/axios";

export interface User {
    id: number;
    name: string;
    email: string;
    profileImageUrl?: string | null;
    role: "renter" | "host" | "admin";
}

interface AuthResponse {
    token: string;
    user: User;
}

type AuthModalType = "login" | "register" | null;

interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;

    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    logout: () => Promise<void>;

    authModalOpen: boolean;
    authModalType: AuthModalType;
    openAuthModal: (type: AuthModalType, redirectTo?: string) => void;
    closeAuthModal: () => void;

    intendedRoute: string | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

interface Props {
    children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalType, setAuthModalType] = useState<AuthModalType>(null);
    const [intendedRoute, setIntendedRoute] = useState<string | null>(null);

    // hydrate from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setAuthToken(storedToken);
            setUser(JSON.parse(storedUser));
        }

        setLoading(false);
    }, []);

    const persistAuth = (data: AuthResponse) => {
        setUser(data.user);
        setToken(data.token);
        setAuthToken(data.token);

        localStorage.setItem("accessToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setAuthModalOpen(false);
        setAuthModalType(null);
    };

    const openAuthModal = (type: AuthModalType, redirectTo?: string) => {
        if (!type) return;
        const currentPath = window.location.pathname + window.location.search;
        setAuthModalType(type);
        setAuthModalOpen(true);
        setIntendedRoute(redirectTo || currentPath);
    };

    const closeAuthModal = () => {
        setAuthModalOpen(false);
        setAuthModalType(null);
    };

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            const res = await api.post<AuthResponse>("/auth/register", {
                name,
                email,
                password
            });
            persistAuth(res.data);
        },
        []
    );

    const login = useCallback(
        async (email: string, password: string) => {
            const res = await api.post<AuthResponse>("/auth/login", {
                email,
                password
            });
            persistAuth(res.data);
        },
        []
    );

    const googleLogin = useCallback(async (credential: string) => {
        const res = await api.post<AuthResponse>("/auth/oauth/google", {
            credential
        });
        persistAuth(res.data);
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // ignore network errors on logout
        } finally {
            setUser(null);
            setToken(null);
            setAuthToken(null);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            setIntendedRoute(null);
        }
    }, []);

    // optional: handle global refresh failures (401 from /auth/refresh)
    useEffect(() => {
        const interceptorId = api.interceptors.response.use(
            (res) => res,
            async (error) => {
                // if refresh itself fails, force logout
                if (
                    error.config?.url?.includes("/auth/refresh") &&
                    error.response?.status === 401
                ) {
                    await logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptorId);
        };
    }, [logout]);

    const value: AuthContextValue = {
        user,
        token,
        loading,
        login,
        register,
        googleLogin,
        logout,
        authModalOpen,
        authModalType,
        openAuthModal,
        closeAuthModal,
        intendedRoute
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
