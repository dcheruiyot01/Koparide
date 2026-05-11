// src/layout/Navbar.tsx (or wherever you keep it)
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Car,
    Menu,
    X,
    User,
    LogOut,
    MessageSquare,
    Briefcase,
    Shield
} from "lucide-react";

import { useAuth } from "../auth/useAuth";
import { RegisterModal } from "../pages/auth/user/RegisterModal";
import { LoginModal } from "../pages/auth/user/LoginModal";

/**
 * Navbar:
 * - Uses global auth modal from AuthContext
 * - No local login/register modal state
 * - "Sign in" → opens login modal
 * - "Sign up" → opens register modal
 * - Admin users see an extra "Admin" link
 */
export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

    const {
        user,
        logout,
        authModalOpen,
        authModalType,
        openAuthModal,
        closeAuthModal
    } = useAuth();

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Prevent scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileMenuOpen]);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const closeProfileDropdown = () => setIsProfileOpen(false);

    const handleLogout = () => {
        logout();
        navigate("/");
        closeProfileDropdown();
        closeMobileMenu();
    };

    const getUserInitials = () => {
        if (!user?.name) return "U";
        return user.name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const isAdmin = user?.role === "admin";

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled ? "bg-white shadow-md py-3" : "bg-[#00a699] py-5"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center cursor-pointer">
                        <Car
                            className={`h-8 w-8 ${
                                isScrolled ? "text-[#00A699]" : "text-white"
                            }`}
                        />
                        <span
                            className={`ml-2 text-xl font-bold ${
                                isScrolled ? "text-gray-900" : "text-white"
                            }`}
                        >
                            <a href="/" className="no-underline text-inherit">
                                WheelAway {`{Kenya}`}
                            </a>
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <a
                            href="/cars"
                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition no-underline hover:no-underline ${
                                isScrolled ? "text-gray-700" : "text-white"
                            }`}
                        >
                            Explore
                        </a>

                        <a
                            href="/#how-it-works"
                            className={`text-sm font-medium transition hover:opacity-80 no-underline hover:no-underline ${
                                isScrolled ? "text-gray-700" : "text-white"
                            }`}
                        >
                            How it works
                        </a>

                        <a
                            href="/host"
                            className={`text-sm font-medium transition hover:opacity-80 no-underline hover:no-underline ${
                                isScrolled ? "text-gray-700" : "text-white"
                            }`}
                        >
                            Become a host
                        </a>

                        {/* Admin link (visible only to admin users) */}
                        {isAdmin && (
                            <a
                                href="/admin"
                                className={`text-sm font-medium transition hover:opacity-80 no-underline hover:no-underline flex items-center gap-1 ${
                                    isScrolled ? "text-gray-700" : "text-white"
                                }`}
                            >
                                <Shield className="h-4 w-4" />
                                Admin
                            </a>
                        )}
                    </div>

                    {/* Auth Section (Desktop) */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className={`flex items-center space-x-2 border rounded-full px-2 py-1 transition-all hover:shadow-md ${
                                        isScrolled
                                            ? "bg-white border-gray-300 text-gray-700"
                                            : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                                    }`}
                                    aria-label="User menu"
                                    aria-expanded={isProfileOpen}
                                >
                                    <Menu className="h-4 w-4 ml-1" />
                                    <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-[#00A699]">
                                        {user?.profileImageUrl ? (
                                            <img
                                                src={user.profileImageUrl}
                                                alt="Profile"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-white text-xs font-bold">
                                                {getUserInitials()}
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {/* Desktop Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {user.name || "User"}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {user.email || "user@example.com"}
                                            </p>
                                        </div>

                                        <div className="py-1">
                                            {/* Admin link in dropdown (visible only to admins) */}
                                            {isAdmin && (
                                                <a
                                                    href="/admin"
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                                                    onClick={closeProfileDropdown}
                                                >
                                                    <Shield className="h-4 w-4 mr-3 text-gray-400" />
                                                    Admin Dashboard
                                                </a>
                                            )}
                                            <a
                                                href="/messages"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                                                onClick={closeProfileDropdown}
                                            >
                                                <MessageSquare className="h-4 w-4 mr-3 text-gray-400" />
                                                Messages
                                            </a>
                                            <a
                                                href="/host"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                                                onClick={closeProfileDropdown}
                                            >
                                                <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                                                Host mode
                                            </a>
                                        </div>

                                        <div className="border-t border-gray-100 py-1">
                                            <a
                                                href="/profile"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                                                onClick={closeProfileDropdown}
                                            >
                                                <User className="h-4 w-4 mr-3 text-gray-400" />
                                                Profile
                                            </a>
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-0 focus:outline-none focus:ring-0"
                                            >
                                                <LogOut className="h-4 w-4 mr-3" />
                                                Log out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => openAuthModal("login")}
                                    className="bg-[#00A699] hover:bg-[#007A6E] text-white px-5 py-2 rounded-full text-sm font-medium transition shadow-sm no-underline hover:no-underline"
                                >
                                    Sign in
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openAuthModal("register")}
                                    className="bg-[#00A699] hover:bg-[#007A6E] text-white px-5 py-2 rounded-full text-sm font-medium transition shadow-sm no-underline hover:no-underline"
                                >
                                    Sign up
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2 rounded-md ${
                                isScrolled ? "text-gray-700" : "text-white"
                            }`}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white absolute top-full left-0 right-0 shadow-lg border-t border-gray-100 py-4 px-4 flex flex-col space-y-1 animate-in slide-in-from-top-5 duration-200 max-h-[80vh] overflow-y-auto">
                    {user ? (
                        <>
                            <div className="flex items-center space-x-3 px-2 py-3 border-b border-gray-100 mb-2">
                                <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-[#00A699]">
                                    {user?.profileImageUrl ? (
                                        <img
                                            src={user.profileImageUrl}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white text-xs font-bold">
                                            {getUserInitials()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {user.name || "User"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {user.email || ""}
                                    </p>
                                </div>
                            </div>

                            {/* Admin link in mobile menu (visible only to admins) */}
                            {isAdmin && (
                                <a
                                    href="/admin"
                                    className="flex items-center text-gray-700 font-medium py-3 px-2 hover:bg-gray-50 rounded-lg no-underline"
                                    onClick={closeMobileMenu}
                                >
                                    <Shield className="h-5 w-5 mr-3 text-gray-400" />
                                    Admin Dashboard
                                </a>
                            )}

                            <a
                                href="/messages"
                                className="flex items-center text-gray-700 font-medium py-3 px-2 hover:bg-gray-50 rounded-lg no-underline"
                                onClick={closeMobileMenu}
                            >
                                <MessageSquare className="h-5 w-5 mr-3 text-gray-400" />
                                Messages
                            </a>
                            <a
                                href="/host"
                                className="flex items-center text-gray-700 font-medium py-3 px-2 hover:bg-gray-50 rounded-lg no-underline"
                                onClick={closeMobileMenu}
                            >
                                <Briefcase className="h-5 w-5 mr-3 text-gray-400" />
                                Host mode
                            </a>

                            <div className="border-t border-gray-100 my-2" />

                            <a
                                href="/profile"
                                className="flex items-center text-gray-700 font-medium py-3 px-2 hover:bg-gray-50 rounded-lg no-underline"
                                onClick={closeMobileMenu}
                            >
                                <User className="h-5 w-5 mr-3 text-gray-400" />
                                Profile
                            </a>
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center text-red-600 font-medium py-3 px-2 hover:bg-red-50 rounded-lg"
                            >
                                <LogOut className="h-5 w-5 mr-3" />
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <a
                                href="/cars"
                                className="text-gray-700 font-medium py-3 border-b border-gray-50 no-underline hover:no-underline"
                                onClick={closeMobileMenu}
                            >
                                Explore
                            </a>
                            <a
                                href="/#how-it-works"
                                className="text-gray-700 font-medium py-3 border-b border-gray-50 no-underline hover:no-underline"
                                onClick={closeMobileMenu}
                            >
                                How it works
                            </a>
                            <a
                                href="/host"
                                className="text-gray-700 font-medium py-3 border-b border-gray-50 no-underline hover:no-underline"
                                onClick={closeMobileMenu}
                            >
                                Become a host
                            </a>
                            <div className="flex flex-col space-y-3 pt-4">
                                <button
                                    type="button"
                                    className="text-gray-700 font-medium text-left py-2"
                                    onClick={() => {
                                        closeMobileMenu();
                                        openAuthModal("login");
                                    }}
                                >
                                    Sign in
                                </button>
                                <button
                                    type="button"
                                    className="bg-[#00A699] text-white px-5 py-3 rounded-full text-sm font-medium text-center"
                                    onClick={() => {
                                        closeMobileMenu();
                                        openAuthModal("register");
                                    }}
                                >
                                    Sign up
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Global Auth Modals */}
            {authModalOpen && authModalType === "register" && (
                <RegisterModal open={true} onClose={closeAuthModal} />
            )}
            {authModalOpen && authModalType === "login" && (
                <LoginModal open={true} onClose={closeAuthModal} />
            )}
        </nav>
    );
};