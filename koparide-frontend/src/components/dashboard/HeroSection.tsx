import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Car, ChevronDown, Loader2, AlertCircle } from "lucide-react";

// ==================== TYPES ====================

type CarType = "Any type" | "SUV" | "Sedan" | "Sports" | "Electric" | "Truck";

interface NominatimResponse {
    address?: {
        city?: string;
        town?: string;
        village?: string;
        county?: string;
        state?: string;
        region?: string;
    };
    display_name?: string;
}

// ==================== CONSTANTS ====================

const CAR_TYPES: CarType[] = ["Any type", "SUV", "Sedan", "Sports", "Electric", "Truck"];

const CONFIG = {
    geolocation: {
        timeout: 10000,
        maximumAge: 60000,
        enableHighAccuracy: false
    } as PositionOptions,
    nominatim: {
        baseUrl: "https://nominatim.openstreetmap.org/reverse",
        userAgent: "Koparide/1.0 (contact@koparide.com)",
        timeout: 8000
    },
    validation: {
        minYear: 1900,
        maxYear: new Date().getFullYear() + 1,
        maxPrice: 1_000_000,
        priceStep: 100
    }
};

// ==================== UTILITIES ====================

const debounce = <T extends (...args: any[]) => any>(fn: T, ms: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), ms);
    };
};

const isValidYear = (year: string): boolean => {
    if (!year) return true;
    const num = Number(year);
    return !isNaN(num) && num >= CONFIG.validation.minYear && num <= CONFIG.validation.maxYear;
};

const isValidPrice = (price: string): boolean => {
    if (!price) return true;
    const num = Number(price);
    return !isNaN(num) && num >= 0 && num <= CONFIG.validation.maxPrice;
};

// ==================== MAIN COMPONENT ====================

export const HeroSection: React.FC = () => {
    const navigate = useNavigate();

    // ==================== STATE ====================

    const [location, setLocation] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [year, setYear] = useState("");
    const [carType, setCarType] = useState<CarType>("Any type");

    const [geolocation, setGeolocation] = useState({
        isLocating: false,
        error: null as string | null,
        success: false
    });

    const [validation, setValidation] = useState({
        priceError: null as string | null,
        yearError: null as string | null
    });

    // ==================== REFS ====================

    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);
    const locationInputRef = useRef<HTMLInputElement>(null);

    // ==================== LIFECYCLE ====================

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            // Only abort if controller exists
            if (abortRef.current) {
                abortRef.current.abort();
                abortRef.current = null;
            }
        };
    }, []);

    // ==================== GEOLOCATION ====================

    const reverseGeocode = useCallback(async (lat: number, lon: number, signal?: AbortSignal): Promise<string> => {
        const url = new URL(CONFIG.nominatim.baseUrl);
        url.search = new URLSearchParams({
            format: "json",
            lat: String(lat),
            lon: String(lon),
            zoom: "10",
            addressdetails: "1"
        }).toString();

        // Create a new controller for this request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.nominatim.timeout);

        try {
            const res = await fetch(url, {
                headers: {
                    "Accept-Language": "en",
                    "User-Agent": CONFIG.nominatim.userAgent
                },
                // Use the passed signal or the new controller's signal
                signal: signal || controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data: NominatimResponse = await res.json();
            const addr = data.address || {};

            return addr.city || addr.town || addr.village || addr.county ||
                addr.state || addr.region || data.display_name?.split(",")[0] || "";
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }, []);

    const detectLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            setGeolocation(prev => ({ ...prev, error: "Geolocation not supported" }));
            return;
        }

        setGeolocation({ isLocating: true, error: null, success: false });

        // Abort any existing request
        if (abortRef.current) {
            abortRef.current.abort();
        }

        // Create new abort controller
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, CONFIG.geolocation);
            });

            if (!mountedRef.current || signal.aborted) return;

            const place = await reverseGeocode(
                position.coords.latitude,
                position.coords.longitude,
                signal // Pass the signal to reverseGeocode
            );

            if (!mountedRef.current || signal.aborted) return;

            if (place) {
                setLocation(place);
                setGeolocation({ isLocating: false, error: null, success: true });
                locationInputRef.current?.focus();
            } else {
                setGeolocation({ isLocating: false, error: "Location not found", success: false });
            }
        } catch (err: any) {
            if (!mountedRef.current || signal.aborted) return;

            const errorMap: Record<number, string> = {
                1: "Location access denied",
                2: "Location unavailable",
                3: "Location timed out"
            };

            setGeolocation({
                isLocating: false,
                error: err.code ? errorMap[err.code] : "Unable to detect location",
                success: false
            });
        } finally {
            // Only clear if we're still mounted and this is the current controller
            if (mountedRef.current && abortRef.current?.signal === signal) {
                abortRef.current = null;
            }
        }
    }, [reverseGeocode]);

    // Auto-detect on mount (only once)
    useEffect(() => {
        let isActive = true;

        if (!location) {
            detectLocation().catch(() => {
                if (isActive) {
                    // Error is already handled in detectLocation
                }
            });
        }

        return () => {
            isActive = false;
        };
    }, []); // Empty deps - only run once on mount

    // ==================== VALIDATION ====================

    const validatePrice = useCallback((value: string) => {
        if (!value) {
            setValidation(prev => ({ ...prev, priceError: null }));
            return true;
        }
        if (!isValidPrice(value)) {
            setValidation(prev => ({
                ...prev,
                priceError: `Max ${CONFIG.validation.maxPrice.toLocaleString()}`
            }));
            return false;
        }
        setValidation(prev => ({ ...prev, priceError: null }));
        return true;
    }, []);

    const validateYear = useCallback((value: string) => {
        if (!value) {
            setValidation(prev => ({ ...prev, yearError: null }));
            return true;
        }
        if (!isValidYear(value)) {
            setValidation(prev => ({
                ...prev,
                yearError: `${CONFIG.validation.minYear}-${CONFIG.validation.maxYear}`
            }));
            return false;
        }
        setValidation(prev => ({ ...prev, yearError: null }));
        return true;
    }, []);

    // Debounced validation
    const debouncedPriceValidate = useMemo(() => debounce(validatePrice, 300), [validatePrice]);
    const debouncedYearValidate = useMemo(() => debounce(validateYear, 300), [validateYear]);

    // ==================== HANDLERS ====================

    const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocation(e.target.value);
        setGeolocation(prev => ({ ...prev, error: null, success: false }));
    }, []);

    const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMaxPrice(value);
        debouncedPriceValidate(value);
    }, [debouncedPriceValidate]);

    const handleYearChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setYear(value);
        debouncedYearValidate(value);
    }, [debouncedYearValidate]);

    const handleSearch = useCallback(() => {
        if (!validatePrice(maxPrice) || !validateYear(year)) return;

        const params = new URLSearchParams();
        if (location.trim()) params.set("location", location.trim());
        if (maxPrice.trim()) params.set("price", maxPrice.trim());
        if (year.trim()) params.set("year", year.trim());
        if (carType !== "Any type") params.set("type", carType);

        navigate(`/cars?${params}`);
    }, [location, maxPrice, year, carType, navigate, validatePrice, validateYear]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    }, [handleSearch]);

    const handleQuickLocation = useCallback((loc: string) => {
        setLocation(loc);
        setGeolocation(prev => ({ ...prev, error: null, success: false }));
        locationInputRef.current?.focus();
    }, []);

    // ==================== RENDER HELPERS ====================

    const renderLocationStatus = () => {
        if (geolocation.isLocating) {
            return (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Detecting location...</span>
                </div>
            );
        }

        if (geolocation.success) {
            return (
                <div className="flex items-center gap-2 text-xs text-green-600">
                    <MapPin className="h-3 w-3" />
                    <span>Location detected</span>
                </div>
            );
        }

        if (geolocation.error) {
            return (
                <div className="flex items-center gap-2 text-xs">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">{geolocation.error}</span>
                    <button
                        onClick={detectLocation}
                        className="text-[#00A699] hover:underline ml-1"
                        disabled={geolocation.isLocating}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return (
            <button
                onClick={detectLocation}
                className="text-xs text-[#00A699] hover:underline"
                disabled={geolocation.isLocating}
            >
                Use my location
            </button>
        );
    };

    const quickLocations = useMemo(() => [
        { label: "🇰🇪 Nairobi", value: "Nairobi" },
        { label: "🏖️ Mombasa", value: "Mombasa" },
        { label: "🌊 Kisumu", value: "Kisumu" }
    ], []);

    // ==================== RENDER ====================

    return (
        <div className="relative min-h-[600px] w-full flex items-center justify-center">
            {/* Background with lazy loading */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80"
                    srcSet="
                        https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80 800w,
                        https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80 1200w,
                        https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80 1600w
                    "
                    sizes="(max-width: 768px) 800px, (max-width: 1200px) 1200px, 1600px"
                    alt="Scenic road for road trips"
                    className="w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/50 to-gray-900/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center pt-20">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-4">
                    Find your perfect ride
                </h1>
                <p className="text-lg md:text-xl text-white/90 text-center mb-10 max-w-2xl">
                    Rent unique cars from local hosts. Wherever you want to go.
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-2 md:p-3">
                    <div className="flex flex-col md:flex-row md:items-start">

                        {/* Location */}
                        <div className="flex-1 p-2 md:border-r border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                Where
                            </label>
                            <div className="flex items-center relative">
                                <MapPin className="h-5 w-5 text-gray-400 absolute left-3" />
                                <input
                                    ref={locationInputRef}
                                    type="text"
                                    placeholder="City, airport, or address"
                                    value={location}
                                    onChange={handleLocationChange}
                                    onKeyPress={handleKeyPress}
                                    className="w-full pl-8 pr-4 py-1 text-gray-900 font-medium placeholder-gray-400 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-[#00A699] rounded"
                                    aria-label="Enter pickup location"
                                />
                            </div>
                            <div className="mt-2 min-h-[24px]">
                                {renderLocationStatus()}
                            </div>
                        </div>

                        {/* Max Price */}
                        <div className="flex-1 p-2 md:border-r border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                Max Price (Ksh)
                            </label>
                            <div className="flex items-center relative">
                                <span className="absolute left-3 text-gray-400">Ksh</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={CONFIG.validation.maxPrice}
                                    step={CONFIG.validation.priceStep}
                                    placeholder="e.g. 5000"
                                    value={maxPrice}
                                    onChange={handlePriceChange}
                                    onKeyPress={handleKeyPress}
                                    className={`w-full pl-12 pr-4 py-1 font-medium bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-[#00A699] rounded ${
                                        validation.priceError ? 'text-red-600' : 'text-gray-900'
                                    }`}
                                    aria-label="Maximum price per day"
                                />
                            </div>
                            {validation.priceError && (
                                <p className="text-xs text-red-600 mt-1 ml-8">{validation.priceError}</p>
                            )}
                        </div>

                        {/* Year */}
                        <div className="flex-1 p-2 md:border-r border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                Year
                            </label>
                            <input
                                type="number"
                                min={CONFIG.validation.minYear}
                                max={CONFIG.validation.maxYear}
                                placeholder="Any"
                                value={year}
                                onChange={handleYearChange}
                                onKeyPress={handleKeyPress}
                                className={`w-full pl-4 pr-4 py-1 font-medium bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-[#00A699] rounded ${
                                    validation.yearError ? 'text-red-600' : 'text-gray-900'
                                }`}
                                aria-label="Car year"
                            />
                            {validation.yearError && (
                                <p className="text-xs text-red-600 mt-1 ml-8">{validation.yearError}</p>
                            )}
                        </div>

                        {/* Car Type */}
                        <div className="flex-1 p-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                Type
                            </label>
                            <div className="flex items-center relative">
                                <Car className="h-5 w-5 text-gray-400 absolute left-3" />
                                <select
                                    value={carType}
                                    onChange={(e) => setCarType(e.target.value as CarType)}
                                    className="w-full pl-8 pr-8 py-1 text-gray-900 font-medium bg-transparent appearance-none cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-[#00A699] rounded"
                                    aria-label="Select car type"
                                >
                                    {CAR_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 pointer-events-none" />
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="p-2 flex items-end">
                            <button
                                onClick={handleSearch}
                                disabled={!!validation.priceError || !!validation.yearError}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition shadow-sm flex items-center ${
                                    validation.priceError || validation.yearError
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#00A699] hover:bg-[#007A6E] text-white'
                                }`}
                                aria-label="Search listings"
                            >
                                <Search className="h-5 w-5 mr-2" />
                                <span>Search</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick suggestions */}
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    {quickLocations.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => handleQuickLocation(value)}
                            className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition"
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        onClick={() => setCarType("SUV")}
                        className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition"
                    >
                        🚙 SUVs
                    </button>
                </div>
            </div>
        </div>
    );
};