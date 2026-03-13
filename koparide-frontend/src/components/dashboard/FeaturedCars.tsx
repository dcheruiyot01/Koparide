import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Star, MapPin, Heart, Loader2, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import type { ApiCar } from '../../utils/carNormalizer';

// ==================== TYPES ====================

export interface FeaturedCar {
    id: string | number;
    name: string;
    price: number;
    rating: number;
    trips: number;
    location: string;
    image: string;
    hostInitials: string;
    hostName?: string;
}

interface FeaturedCarsProps {
    title?: string;
    maxCars?: number;
    showViewAll?: boolean;
    onViewAll?: () => void;
}

// ==================== CONSTANTS ====================

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=764&q=80';
const DEFAULT_MAX_CARS = 4;
const CACHE_KEY = 'featured_cars_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ==================== UTILITIES ====================

/**
 * Get host initials from name
 */
const getHostInitials = (name: string = "Host"): string => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Format price in Ksh
 */
const formatPrice = (price: number): string => {
    return `Ksh ${price.toLocaleString()}`;
};

/**
 * Get primary image from car
 */
const getPrimaryImage = (car: ApiCar): string => {
    if (!car.imagesList?.length) return DEFAULT_IMAGE;
    const primary = car.imagesList.find(img => img.isPrimary);
    return primary?.url || car.imagesList[0]?.url || DEFAULT_IMAGE;
};

/**
 * Shuffle array and take first n items
 */
const getRandomItems = <T,>(array: T[], count: number): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
};

// ==================== MAIN COMPONENT ====================

export const FeaturedCars: React.FC<FeaturedCarsProps> = ({
                                                              title = "Featured cars near you",
                                                              maxCars = DEFAULT_MAX_CARS,
                                                              showViewAll = true,
                                                              onViewAll
                                                          }) => {
    // ==================== STATE ====================

    const [cars, setCars] = useState<FeaturedCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<Set<string | number>>(new Set());

    // ==================== FETCH CARS ====================

    const fetchFeaturedCars = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    setCars(data);
                    setLoading(false);
                    return;
                }
            }

            const res = await api.get("/api/cars", {
                params: {
                    limit: 200, // Fetch more for better randomization
                    status: 'approved',
                    is_deleted: false
                },
                timeout: 10000 // 10 second timeout
            });

            const carsData = res.data?.data || res.data || [];

            if (!Array.isArray(carsData)) {
                throw new Error("Invalid response format");
            }

            // Filter approved cars
            const approvedCars = carsData.filter(
                (c: ApiCar) => String(c.status)?.toLowerCase() === "approved" && !c.is_deleted
            );

            if (approvedCars.length === 0) {
                setCars([]);
                return;
            }

            // Transform to featured car format
            const featuredCars: FeaturedCar[] = approvedCars.map((c: ApiCar) => ({
                id: c.id,
                name: [c.make, c.model, c.year].filter(Boolean).join(' ') || "Unknown Vehicle",
                price: typeof c.pricePerDay === 'string' ? parseFloat(c.pricePerDay) : (c.pricePerDay || 0),
                rating: c.rating || 4.5, // Default rating if not available
                trips: c.trips || 0,
                location: c.location || "Location not specified",
                image: getPrimaryImage(c),
                hostInitials: getHostInitials(c.owner?.name),
                hostName: c.owner?.name,
            }));

            // Select random cars
            const randomCars = getRandomItems(featuredCars, maxCars);

            // Update state and cache
            setCars(randomCars);
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: randomCars,
                timestamp: Date.now()
            }));

        } catch (err: any) {
            console.error("Failed to fetch featured cars:", err);

            if (err.code === "ECONNABORTED") {
                setError("Request timeout. Please check your connection.");
            } else if (err.response?.status === 404) {
                setError("No cars available at the moment.");
            } else {
                setError("Failed to load featured cars. Please try again later.");
            }

            // Try to load from cache if available
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data } = JSON.parse(cached);
                setCars(data);
                setError(null); // Clear error if we have cached data
            }
        } finally {
            setLoading(false);
        }
    }, [maxCars]);

    // Initial fetch
    useEffect(() => {
        fetchFeaturedCars();
    }, [fetchFeaturedCars]);

    // ==================== HANDLERS ====================

    const handleFavorite = useCallback((carId: string | number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(carId)) {
                newFavorites.delete(carId);
            } else {
                newFavorites.add(carId);
            }
            return newFavorites;
        });

        // TODO: Sync with backend when API is ready
    }, []);

    const handleViewAll = useCallback(() => {
        if (onViewAll) {
            onViewAll();
        } else {
            window.location.href = '/cars';
        }
    }, [onViewAll]);

    const handleRetry = useCallback(() => {
        fetchFeaturedCars();
    }, [fetchFeaturedCars]);

    // ==================== RENDER HELPERS ====================

    const renderLoading = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(maxCars)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="flex justify-between pt-3">
                            <div className="h-4 bg-gray-200 rounded w-20" />
                            <div className="h-8 w-8 bg-gray-200 rounded-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderError = () => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load featured cars</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
                onClick={handleRetry}
                className="bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-2 rounded-lg font-medium transition"
            >
                Try Again
            </button>
        </div>
    );

    const renderEmpty = () => (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No featured cars available</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Check back later for new listings from our hosts.
            </p>
        </div>
    );

    const renderCarCard = (car: FeaturedCar) => {
        const isFavorite = favorites.has(car.id);

        return (
            <a
                key={car.id}
                href={`/cars/${car.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group block no-underline text-inherit"
            >
                {/* Image */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                        }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Favorite Button */}
                    <button
                        onClick={(e) => handleFavorite(car.id, e)}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-[#00A699]"
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Heart
                            className={`h-4 w-4 transition-colors ${
                                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                            }`}
                        />
                    </button>

                    {/* Instant Book Badge */}
                    <div className="absolute bottom-3 left-3 bg-[#00A699] text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                        INSTANT BOOK
                    </div>
                </div>

                {/* Body */}
                <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900 truncate pr-2 text-base">
                            {car.name}
                        </h3>
                        <div className="flex items-baseline whitespace-nowrap">
                            <span className="font-bold text-gray-900">{formatPrice(car.price)}</span>
                            <span className="text-gray-500 text-sm ml-1">/day</span>
                        </div>
                    </div>

                    <div className="flex items-center text-gray-500 text-sm mb-4">
                        <MapPin className="h-3 w-3 text-[#00A699] mr-1 flex-shrink-0" />
                        <span className="truncate">{car.location}</span>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="flex items-center">
                            <Star className="h-4 w-4 text-[#00A699] fill-current" />
                            <span className="font-bold text-gray-900 ml-1">
                                {car.rating.toFixed(1)}
                            </span>
                            <span className="text-gray-500 text-sm ml-1">
                                ({car.trips} {car.trips === 1 ? 'trip' : 'trips'})
                            </span>
                        </div>

                        {/* Host Avatar */}
                        <div
                            className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                            title={car.hostName || 'Host'}
                        >
                            {car.hostInitials}
                        </div>
                    </div>
                </div>
            </a>
        );
    };

    // ==================== MAIN RENDER ====================

    return (
        <section className="py-20 bg-[#F7F7F7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
                        <p className="text-gray-500 mt-2">
                            Hand-picked vehicles from our top hosts
                        </p>
                    </div>

                    {showViewAll && cars.length > 0 && (
                        <button
                            onClick={handleViewAll}
                            className="text-[#00A699] font-semibold hover:text-[#007A6E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A699] rounded-lg px-3 py-1"
                        >
                            View all cars →
                        </button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    renderLoading()
                ) : error ? (
                    renderError()
                ) : cars.length === 0 ? (
                    renderEmpty()
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {cars.map(renderCarCard)}
                    </div>
                )}

                {/* Attribution for demo purposes */}
                {process.env.NODE_ENV !== 'production' && cars.length > 0 && (
                    <p className="text-xs text-gray-400 text-center mt-8">
                        Showing {cars.length} random featured cars • Refreshes every 5 minutes
                    </p>
                )}
            </div>
        </section>
    );
};

// Re-export the Car icon for convenience
export { Car } from "lucide-react";