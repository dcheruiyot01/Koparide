import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Car, ChevronDown } from "lucide-react";

/**
 * HeroSection
 *
 * - Attempts to auto-fill the "location" input using the browser Geolocation API.
 * - Reverse-geocodes coordinates via OpenStreetMap Nominatim (no API key required).
 * - Provides a retry button and graceful fallback if permission is denied or lookup fails.
 * - Builds a query string and navigates to /listings on Search.
 *
 * Notes:
 * - Nominatim has usage policies; for production use a server-side proxy or a paid geocoding service.
 * - You can replace the reverseGeocode function with your own endpoint if needed.
 */

export const HeroSection: React.FC = () => {
    const navigate = useNavigate();

    const [location, setLocation] = useState<string>("");
    const [maxPrice, setMaxPrice] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [carType, setCarType] = useState<string>("Any type");

    // Geolocation state
    const [isLocating, setIsLocating] = useState<boolean>(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Reverse geocode coordinates to a human-friendly place (city / town)
    const reverseGeocode = async (lat: number, lon: number, signal?: AbortSignal) => {
        try {
            // Nominatim endpoint for reverse geocoding
            const url = new URL("https://nominatim.openstreetmap.org/reverse");
            url.searchParams.set("format", "json");
            url.searchParams.set("lat", String(lat));
            url.searchParams.set("lon", String(lon));
            url.searchParams.set("zoom", "10"); // city / town level
            url.searchParams.set("addressdetails", "1");

            const res = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "Accept-Language": "en",
                    "User-Agent": "YourAppName/1.0 (your@email.example)", // Nominatim requires a valid UA in production
                },
                signal,
            });

            if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);

            const data = await res.json();

            // Prefer city, town, village, county, or state in that order
            const addr = data?.address || {};
            const place =
                addr.city || addr.town || addr.village || addr.county || addr.state || addr.region || "";

            return place;
        } catch (err) {
            // Rethrow so caller can handle
            throw err;
        }
    };

    // Try to get user's current position and reverse-geocode it
    const detectLocation = async () => {
        setLocationError(null);

        if (!("geolocation" in navigator)) {
            setLocationError("Geolocation not supported by your browser.");
            return;
        }

        setIsLocating(true);

        // Use a timeout for geolocation and fetch
        const geoOptions: PositionOptions = { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 };

        const abortController = new AbortController();
        let geoWatchId: number | null = null;

        try {
            // Wrap getCurrentPosition in a Promise
            const pos: GeolocationPosition = await new Promise((resolve, reject) => {
                const success = (p: GeolocationPosition) => resolve(p);
                const failure = (err: GeolocationPositionError) => reject(err);

                navigator.geolocation.getCurrentPosition(success, failure, geoOptions);
            });

            const { latitude, longitude } = pos.coords;

            // Reverse geocode (with fetch abort support)
            const place = await reverseGeocode(latitude, longitude, abortController.signal);

            if (place) {
                setLocation(place);
            } else {
                setLocationError("Could not determine a nearby city.");
            }
        } catch (err: any) {
            // Handle common geolocation errors
            if (err && err.code === 1) {
                setLocationError("Location permission denied.");
            } else if (err && err.name === "AbortError") {
                setLocationError("Location lookup timed out.");
            } else {
                setLocationError("Unable to determine location.");
            }
        } finally {
            setIsLocating(false);
            // cleanup
            abortController.abort();
            if (geoWatchId !== null) navigator.geolocation.clearWatch(geoWatchId);
        }
    };

    // Attempt to auto-detect on first mount
    useEffect(() => {
        // Only attempt if location input is empty
        if (!location) {
            detectLocation().catch(() => {
                /* errors handled inside detectLocation */
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Build query params and navigate to /listings
    const onSearch = () => {
        const params = new URLSearchParams();

        if (location.trim()) params.set("location", location.trim());
        if (maxPrice.trim()) params.set("price", maxPrice.trim());
        if (year.trim()) params.set("year", year.trim());
        if (carType && carType !== "Any type") params.set("type", carType);

        navigate(`/listings?${params.toString()}`);
    };

    return (
        <div className="relative min-h-[600px] w-full flex items-center justify-center">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80"
                    alt="Road trip"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center pt-20">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-4 tracking-tight">
                    Find your perfect ride
                </h1>

                <p className="text-lg md:text-xl text-white/90 text-center mb-10 max-w-2xl">
                    Rent unique cars from local hosts. Wherever you want to go.
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-2 md:p-3">
                    <div className="flex flex-col md:flex-row md:items-center">

                        {/* Location */}
                        <div className="flex-1 p-2 md:border-r border-gray-100 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                Where
                            </label>
                            <div className="flex items-center">
                                <MapPin className="h-5 w-5 text-gray-400 absolute left-3" />
                                <input
                                    type="text"
                                    placeholder="City, airport, or address"
                                    className="w-full pl-8 pr-4 py-1 text-gray-900 font-medium placeholder-gray-400 focus:outline-none bg-transparent border-0"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>

                            {/* small helper row */}
                            <div className="mt-2 flex items-center gap-3">
                                {isLocating ? (
                                    <span className="text-xs text-gray-500">Detecting location…</span>
                                ) : locationError ? (
                                    <>
                                        <span className="text-xs text-red-600">{locationError}</span>
                                        <button
                                            onClick={() => detectLocation()}
                                            className="text-xs text-[#00A699] ml-2 underline"
                                            type="button"
                                        >
                                            Try again
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => detectLocation()}
                                        className="text-xs text-[#00A699] underline"
                                        type="button"
                                    >
                                        Use my location
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Max Price */}
                        <div className="flex-1 p-2 md:border-r border-gray-100 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                Max Price
                            </label>
                            <div className="flex items-center">
                                <span className="absolute left-3 text-gray-400">Ksh</span>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="e.g. 5000"
                                    className="w-full pl-10 pr-4 py-1 text-gray-900 font-medium focus:outline-none bg-transparent border-0"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Year */}
                        <div className="flex-1 p-2 md:border-r border-gray-100 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                Year
                            </label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    min={1900}
                                    max={2100}
                                    placeholder="Any"
                                    className="w-full pl-4 pr-4 py-1 text-gray-900 font-medium focus:outline-none bg-transparent border-0"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Car Type */}
                        <div className="flex-1 p-2 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                Type
                            </label>
                            <div className="flex items-center relative">
                                <Car className="h-5 w-5 text-gray-400 absolute left-3" />
                                <select
                                    className="w-full pl-8 pr-8 py-1 text-gray-900 font-medium focus:outline-none bg-transparent appearance-none cursor-pointer border-0"
                                    value={carType}
                                    onChange={(e) => setCarType(e.target.value)}
                                >
                                    <option>Any type</option>
                                    <option>SUV</option>
                                    <option>Sedan</option>
                                    <option>Sports</option>
                                    <option>Electric</option>
                                    <option>Truck</option>
                                </select>
                                <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 pointer-events-none" />
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="p-2">
                            <button
                                onClick={onSearch}
                                className="bg-[#00A699] hover:bg-[#007A6E] text-white px-5 py-2 rounded-full text-sm font-medium transition shadow-sm flex items-center"
                                aria-label="Search listings"
                            >
                                <Search className="h-5 w-5 mr-2" />
                                <span>Search</span>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
