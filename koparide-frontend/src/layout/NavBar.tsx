import React, { useEffect, useState, useRef } from "react"
import {
    Car,
    Menu,
    X,
    User,
    LogOut,
    Heart,
    MessageSquare,
    Settings,
    Briefcase,
    Calendar
} from "lucide-react"
import { useAuth } from "../auth/useAuth"
import { RegisterModal } from "../pages/auth/RegisterModal"
import { LoginModal } from "../pages/auth/LoginModal"

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const dropdownRef = useRef(null)
    const [registerOpen, setRegisterOpen] = useState(false)
    const [loginOpen, setLoginOpen] = useState(false)
    const { user, logout } = useAuth()

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Prevent scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isMobileMenuOpen])

    // Close mobile menu on link click
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false)
    }

    // Close profile dropdown
    const closeProfileDropdown = () => {
        setIsProfileOpen(false)
    }

    // Handle logout
    const handleLogout = () => {
        logout()
        closeProfileDropdown()
        closeMobileMenu()
    }

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.name) return "U"
        return user.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled ? "bg-white shadow-md py-3" : "bg-transparent py-5"
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
                            Wheelaway {"{KopaRide}"}
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <a
                            href="#explore"
                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition no-underline hover:no-underline ${
                                isScrolled ? "text-gray-700" : "text-white"}`}
                        >
                            Explore
                        </a>

                        <a
                            href="#how-it-works"
                            className={`text-sm font-medium transition hover:opacity-80 no-underline hover:no-underline ${
                                isScrolled ? "text-gray-700" : "text-white"
                            }`}
                        >
                            How it works
                        </a>

                        <a
                            href="#become-a-host"
                            className={`text-sm font-medium transition hover:opacity-80 no-underline hover:no-underline ${
                                isScrolled ? "text-gray-700" : "text-white"
                            }`}
                        >
                            Become a host
                        </a>
                    </div>

                    {/* Auth Section */}
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
                                    <div className="bg-[#00A699] rounded-full h-8 w-8 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                            {getUserInitials()}
                                        </span>
                                    </div>
                                </button>

                                {/* Desktop Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {user.name || 'User'}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {user.email || 'user@example.com'}
                                            </p>
                                        </div>

                                        <div className="py-1">
                                            <a
                                                href="#trips"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                                                onClick={closeProfileDropdown}
                                            >
                                                <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                                                Trips
                                            </a>
                                            <a
                                                href="#favorites"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                                                onClick={closeProfileDropdown}
                                            >
                                                <Heart className="h-4 w-4 mr-3 text-gray-400" />
                                                Favorites
                                            </a>
                                            <a
                                                href="#messages"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                                                onClick={closeProfileDropdown}
                                            >
                                                <MessageSquare className="h-4 w-4 mr-3 text-gray-400" />
                                                Messages
                                            </a>
                                            <a
                                                href="#host-mode"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                                                onClick={closeProfileDropdown}
                                            >
                                                <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                                                Host mode
                                            </a>
                                        </div>

                                        <div className="border-t border-gray-100 py-1">
                                            <a
                                                href="#account"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                                                onClick={closeProfileDropdown}
                                            >
                                                <Settings className="h-4 w-4 mr-3 text-gray-400" />
                                                Account
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
                                <a
                                    onClick={() => setLoginOpen(true)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium no-underline hover:no-underline hover:opacity-80 transition ${
                                        isScrolled ? "text-gray-700" : "text-white"
                                    }`}
                                >
                                    Sign in
                                </a>

                                <a
                                    onClick={() => setRegisterOpen(true)}
                                    className="bg-[#00A699] hover:bg-[#007A6E] text-white px-5 py-2 rounded-full text-sm font-medium transition shadow-sm no-underline hover:no-underline"
                                >
                                    Sign up
                                </a>
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
                            {/* User Profile Header */}
                            <div className="flex items-center space-x-3 px-2 py-3 border-b border-gray-100 mb-2">
                                <div className="bg-[#00A699] rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-bold">
                                        {getUserInitials()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{user.name || 'User'}</p>
                                    <p className="text-xs text-gray-500">{user.email || ''}</p>
                                </div>
                            </div>

                            {/* Mobile Menu Links with Icons */}
                            <a
                                href="#trips"
                                className="flex items-center text-gray-700 font-medium py-3 px-2 hover:bg-gray-50 rounded-lg no-underline"
                                onClick={closeMobileMenu}
                            >
                                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                                Trips
                            </a>
                            <a
                                href="#favorites"
                                className="flex items-center text-gray-700 font-medium py-3 px-2 hover:bg-gray-50 rounded-lg no-underline"
                                onClick={closeMobileMenu}
                            >
                                <Heart className="h-5 w-5 mr-3 text-gray-400" />
                                Favorites
                            </a>
                            <a
                                href="#messages"
                                className="flex items-center text-gray-700 font-medium py-3 px-2 hover:bg-gray-50 rounded-lg no-underline"
                                onClick={closeMobileMenu}
                            >
                                <MessageSquare className="h-5 w-5 mr-3 text-gray-400" />
                                Messages
                            </a>
                            <a
                                href="#host-mode"
                                className="flex items-center text-gray-700 font-medium py-3 px-2 hover:bg-gray-50 rounded-lg no-underline"
                                onClick={closeMobileMenu}
                            >
                                <Briefcase className="h-5 w-5 mr-3 text-gray-400" />
                                Host mode
                            </a>

                            <div className="border-t border-gray-100 my-2"></div>

                            <a
                                href="#account"
                                className="flex items-center text-gray-700 font-medium py-3 px-2 hover:bg-gray-50 rounded-lg no-underline"
                                onClick={closeMobileMenu}
                            >
                                <Settings className="h-5 w-5 mr-3 text-gray-400" />
                                Account
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
                                href="#explore"
                                className="text-gray-700 font-medium py-3 border-b border-gray-50 no-underline hover:no-underline"
                                onClick={closeMobileMenu}
                            >
                                Explore
                            </a>

                            <a
                                href="#how-it-works"
                                className="text-gray-700 font-medium py-3 border-b border-gray-50 no-underline hover:no-underline"
                                onClick={closeMobileMenu}
                            >
                                How it works
                            </a>

                            <a
                                href="#become-a-host"
                                className="text-gray-700 font-medium py-3 border-b border-gray-50 no-underline hover:no-underline"
                                onClick={closeMobileMenu}
                            >
                                Become a host
                            </a>

                            <div className="flex flex-col space-y-3 pt-4">
                                <a
                                    href="/login"
                                    className="text-gray-700 font-medium text-left py-2 no-underline hover:no-underline"
                                    onClick={closeMobileMenu}
                                >
                                    Sign in
                                </a>

                                <a
                                    href="/signup"
                                    className="bg-[#00A699] text-white px-5 py-3 rounded-full text-sm font-medium text-center no-underline hover:no-underline"
                                    onClick={closeMobileMenu}
                                >
                                    Sign up
                                </a>
                            </div>
                        </>
                    )}
                </div>
            )}
            <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
            <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </nav>
    )
}