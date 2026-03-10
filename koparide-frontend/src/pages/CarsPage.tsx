import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Gauge, Fuel, Car, Calendar, MapPin, Star } from "lucide-react";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import { normalizeCar, type ApiCar } from '../utils/carNormalizer';
import api from "../api/axios";

// ==================== TYPES ====================
interface Filters {
    location: string;
    type: string;
    make: string;
    year: string;
    seats: string;
    fuelType: string;
    price: string;
    delivery: boolean;
    from: string;
    to: string;
}

interface DisplayCar {
    id: string | number;
    name: string;
    year: number;
    type: string;
    seats: number;
    fuelType: string;
    fuelEfficiency?: number;
    price: number;
    delivery: boolean;
    location: string;
    imagesList?: Array<{ url: string; isPrimary?: boolean }>;
    rating?: number;
    trips?: number;
}

// ==================== CONSTANTS ====================
const CAR_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Truck', 'Sports', 'Electric', 'Van', 'Coupe', 'Convertible'];
const FUEL_TYPES = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=764&q=80';

// ==================== HELPER FUNCTIONS ====================
const formatPrice = (price: number): string => {
    return `Ksh ${price.toLocaleString()}`;
};

const getPrimaryImage = (car: DisplayCar): string => {
    if (!car.imagesList?.length) return DEFAULT_IMAGE;

    const primary = car.imagesList.find(img => img.isPrimary);
    return primary?.url || car.imagesList[0]?.url || DEFAULT_IMAGE;
};

// ==================== MAIN COMPONENT ====================
export const CarsPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // ==================== STATE ====================
    const [cars, setCars] = useState<DisplayCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [filters, setFilters] = useState<Filters>({
        location: "",
        type: "",
        make: "",
        year: "",
        seats: "",
        fuelType: "",
        price: "",
        delivery: false,
        from: "",
        to: "",
    });

    // ==================== EFFECTS ====================

    // Initialize filters from query params
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        setFilters(prev => ({
            ...prev,
            location: params.get("location") || "",
            from: params.get("from") || "",
            to: params.get("to") || "",
            type: params.get("type") || "",
            make: params.get("make") || "",
            year: params.get("year") || "",
            seats: params.get("seats") || "",
            fuelType: params.get("fuelType") || "",
            price: params.get("price") || "",
            delivery: params.get("delivery") === "true",
        }));
    }, [location.search]);

    // Fetch cars from API
    useEffect(() => {
        let mounted = true;

        const fetchCars = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await api.get("/api/cars");

                // Handle different response structures
                const carsData = res.data?.data || res.data || [];

                if (!Array.isArray(carsData)) {
                    console.error("Expected array but got:", carsData);
                    if (mounted) setCars([]);
                    return;
                }

                // Filter approved cars and transform to display format
                const approvedCars = carsData
                    .filter((c: ApiCar) => String(c.status)?.toLowerCase() === "approved" && !c.is_deleted)
                    .map((c: ApiCar): DisplayCar => ({
                        id: c.id,
                        name: [c.make, c.model].filter(Boolean).join(' ') || "Unknown Vehicle",
                        year: c.year || new Date().getFullYear(),
                        type: c.classification || "Unknown",
                        seats: c.seats || 5,
                        fuelType: c.fuelType || "Gasoline",
                        fuelEfficiency: c.mpg,
                        price: typeof c.pricePerDay === 'string' ? parseFloat(c.pricePerDay) : (c.pricePerDay || 0),
                        delivery: false, // Default until API provides this
                        location: c.location || "Location not specified",
                        imagesList: c.imagesList || [],
                        rating: c.rating,
                        trips: c.trips,
                    }));

                if (mounted) setCars(approvedCars);
            } catch (err) {
                console.error("Failed to fetch cars:", err);
                if (mounted) {
                    setFetchError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load cars. Please try again later."
                    );
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchCars();

        return () => {
            mounted = false;
        };
    }, []);

    // ==================== HANDLERS ====================

    const applyFiltersToUrl = useCallback(() => {
        const params = new URLSearchParams();

        // Only add non-empty filters to URL
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== false) {
                params.set(key, String(value));
            }
        });

        navigate(`/cars${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
    }, [filters, navigate]);

    const clearFilters = useCallback(() => {
        setFilters({
            location: "",
            type: "",
            make: "",
            year: "",
            seats: "",
            fuelType: "",
            price: "",
            delivery: false,
            from: "",
            to: "",
        });
        navigate('/cars', { replace: true });
    }, [navigate]);

    const handleFilterChange = useCallback((
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFilters(prev => ({ ...prev, [name]: checked }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    }, []);

    // ==================== FILTERING ====================

    const filteredCars = useMemo(() => {
        const maxPrice = filters.price ? Number(filters.price) : null;
        const makeLower = filters.make.toLowerCase();
        const locationLower = filters.location.toLowerCase();

        return cars.filter(car => {
            // Text filters (case-insensitive)
            if (makeLower && !car.name.toLowerCase().includes(makeLower)) return false;
            if (locationLower && !car.location.toLowerCase().includes(locationLower)) return false;

            // Exact match filters
            if (filters.type && car.type !== filters.type) return false;
            if (filters.year && car.year.toString() !== filters.year) return false;
            if (filters.seats && car.seats.toString() !== filters.seats) return false;
            if (filters.fuelType && car.fuelType !== filters.fuelType) return false;

            // Numeric filters
            if (maxPrice !== null && car.price > maxPrice) return false;

            // Boolean filters
            if (filters.delivery && !car.delivery) return false;

            return true;
        });
    }, [cars, filters]);

    // ==================== RENDER HELPERS ====================

    const renderLoading = () => (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A699] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading cars...</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );

    const renderError = () => (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600">{fetchError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-2 rounded-full text-sm font-medium transition"
                    >
                        Try Again
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );

    const renderFilters = () => (
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-lg shadow-sm">
            <input
                type="text"
                name="location"
                placeholder="Location"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                value={filters.location}
                onChange={handleFilterChange}
            />

            <input
                type="text"
                name="make"
                placeholder="Make/Model"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                value={filters.make}
                onChange={handleFilterChange}
            />

            <select
                name="type"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                value={filters.type}
                onChange={handleFilterChange}
            >
                <option value="">Car Types</option>
                {CAR_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>

            <input
                type="number"
                name="year"
                placeholder="Year"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                value={filters.year}
                onChange={handleFilterChange}
            />

            <select
                name="fuelType"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                value={filters.fuelType}
                onChange={handleFilterChange}
            >
                <option value="">Fuel Type</option>
                {FUEL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>

            <input
                type="number"
                name="seats"
                placeholder="Seats"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-20 focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                value={filters.seats}
                onChange={handleFilterChange}
            />

            <input
                type="number"
                name="price"
                placeholder="Max Price"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28 focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none"
                value={filters.price}
                onChange={handleFilterChange}
            />

            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    name="delivery"
                    checked={filters.delivery}
                    onChange={handleFilterChange}
                    className="rounded text-[#00A699] focus:ring-[#00A699]"
                />
                <span>Delivery</span>
            </label>

            <button
                onClick={applyFiltersToUrl}
                className="bg-[#00A699] hover:bg-[#007A6E] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
                Apply
            </button>

            <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
                Clear
            </button>
        </div>
    );

    const renderCarCard = (car: DisplayCar) => {
        const primaryImage = getPrimaryImage(car);

        return (
            <div
                key={car.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
                <a href={`/cars/${car.id}`} className="block no-underline text-inherit hover:no-underline">
                    <div className="relative h-48 bg-gray-200">
                        <img
                            src={primaryImage}
                            alt={car.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                            }}
                        />
                        {car.rating && car.rating > 0 && (
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-semibold flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span>{car.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>

                    <div className="p-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                            {car.name}
                        </h3>

                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                                <Car className="h-4 w-4 text-gray-400" />
                                <span>{car.type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{car.year}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Gauge className="h-4 w-4 text-gray-400" />
                                <span>{car.fuelEfficiency ? `${car.fuelEfficiency} MPG` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Fuel className="h-4 w-4 text-gray-400" />
                                <span>{car.fuelType}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{car.location}</span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div>
                                <span className="text-lg font-bold text-[#00A699]">
                                    {formatPrice(car.price)}
                                </span>
                                <span className="text-gray-500 text-sm ml-1">/day</span>
                            </div>
                            {car.delivery && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    Delivery
                                </span>
                            )}
                        </div>
                    </div>
                </a>
            </div>
        );
    };

    // ==================== MAIN RENDER ====================

    if (loading) return renderLoading();
    if (fetchError) return renderError();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Available Cars</h1>
                    <p className="text-gray-500 mt-1">
                        Find the perfect car for your journey
                    </p>
                </div>

                {/* Filters */}
                {renderFilters()}

                {/* Results count */}
                <div className="mb-4 text-gray-600">
                    Found <span className="font-semibold">{filteredCars.length}</span> car{filteredCars.length !== 1 ? 's' : ''}
                    {cars.length > 0 && (
                        <span className="text-gray-400 text-sm ml-2">
                            (out of {cars.length} total)
                        </span>
                    )}
                </div>

                {/* Listings */}
                {filteredCars.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                        <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No cars match your filters
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Try adjusting your search criteria or clear filters to see all available cars.
                        </p>
                        <button
                            onClick={clearFilters}
                            className="bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-3 rounded-full font-medium transition"
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCars.map(renderCarCard)}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};