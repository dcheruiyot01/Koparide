import React, { useEffect, useMemo, useState } from "react";
import { Gauge, Fuel, Car, Calendar } from "lucide-react";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

/**
 * CarListingsPage
 *
 * - Adds a location filter and includes `location` on each mock car (random Kenyan cities).
 * - Filters are case-insensitive substring matches for make/model and location.
 * - Price input is treated as a maximum price (car.price <= maxPrice).
 * - Keeps the Apply button which updates the URL query string so HeroSection searches work.
 */

interface Car {
    id: number; // Changed from string to number since your API uses numbers
    name: string;
    year: number;
    type: string;
    seats: number;
    fuelType: string;
    fuelEfficiency: string;
    price: number;
    delivery: boolean;
    location: string;
    imageUrl: string;
    raw: any;
}

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

// Mock locations for cars (since your API doesn't have location)
const MOCK_LOCATIONS = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Machakos"];

export const CarsPage: React.FC = () => {
    const locationHook = useLocation();
    const navigate = useNavigate();

    // Cars state with proper typing
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Filters state with proper typing
    const [filters, setFilters] = useState<Filters>({
        location: "",
        type: "",
        make: "",
        year: "",
        seats: "",
        fuelType: "",
        price: "", // interpreted as max price
        delivery: false,
        from: "",
        to: "",
    });

    // Initialize filters from query params (so HeroSection searches populate the UI)
    useEffect(() => {
        const params = new URLSearchParams(locationHook.search);

        setFilters((prev) => ({
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
    }, [locationHook.search]);

    // Fetch cars from API
    useEffect(() => {
        let mounted = true;

        const fetchCars = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await api.get("/api/cars");
                console.log("API Response:", res.data); // Add this for debugging

                // Your API returns { data: [...], meta: {...} }
                // So we need to access res.data.data
                const carsData = res.data?.data || [];

                if (!Array.isArray(carsData)) {
                    console.error("Expected array but got:", carsData);
                    if (mounted) setCars([]);
                    return;
                }

                const normalized: Car[] = carsData.map((c: any) => {
                    // Generate a random location since your API doesn't have it
                    const randomLocation = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];

                    return {
                        id: c.id,
                        name: c.make && c.model ? `${c.make} ${c.model}`.trim() : "Unknown Vehicle",
                        year: c.year || new Date().getFullYear(),
                        type: c.classification || "Unknown",
                        seats: 5, // Default since your API doesn't have seats
                        fuelType: "Gasoline", // Default since your API doesn't have fuel type
                        fuelEfficiency: "", // Not in your API
                        price: parseFloat(c.pricePerDay) || 0, // Convert string to number
                        delivery: false, // Default since your API doesn't have delivery
                        location: randomLocation, // Add random location
                        imageUrl: "", // Not in your API
                        raw: c,
                    };
                });

                console.log("Normalized cars:", normalized); // Debug log
                if (mounted) setCars(normalized);
            } catch (err) {
                console.error("Failed to fetch cars", err);
                if (mounted) setFetchError("Failed to load cars. Please try again later.");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchCars();
        return () => {
            mounted = false;
        };
    }, []);

    // Update URL with current filters (Apply button)
    const applyFiltersToUrl = () => {
        const params = new URLSearchParams();

        if (filters.location) params.set("location", filters.location);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        if (filters.type) params.set("type", filters.type);
        if (filters.make) params.set("make", filters.make);
        if (filters.year) params.set("year", filters.year);
        if (filters.seats) params.set("seats", filters.seats);
        if (filters.fuelType) params.set("fuelType", filters.fuelType);
        if (filters.price) params.set("price", filters.price);
        if (filters.delivery) params.set("delivery", "true");

        navigate(`/listings?${params.toString()}`, { replace: true });
    };

    // Clear all filters
    const clearFilters = () => {
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
        // Optionally update URL to remove query params
        navigate('/listings', { replace: true });
    };

    // Filtering logic (client-side)
    const filteredCars = useMemo(() => {
        console.log("Filtering cars:", cars.length); // Debug log
        console.log("Current filters:", filters); // Debug log

        // Parse max price only if it's a valid number
        const maxPrice = filters.price && filters.price.trim() !== ""
            ? Number(filters.price)
            : null;
        const makeLower = filters.make ? filters.make.toLowerCase() : "";
        const locationLower = filters.location ? filters.location.toLowerCase() : "";

        const filtered = cars.filter((car) => {
            // location: case-insensitive substring match (with safe navigation)
            if (locationLower && !car.location?.toLowerCase().includes(locationLower)) return false;

            // type
            if (filters.type && car.type !== filters.type) return false;

            // make/model (case-insensitive substring)
            if (makeLower && !car.name?.toLowerCase().includes(makeLower)) return false;

            // year (convert both to strings for comparison)
            if (filters.year && car.year.toString() !== filters.year) return false;

            // seats
            if (filters.seats && car.seats.toString() !== filters.seats) return false;

            // fuelType
            if (filters.fuelType && car.fuelType !== filters.fuelType) return false;

            // price: show cars with price <= maxPrice
            if (maxPrice !== null && !(car.price <= maxPrice)) return false;

            // delivery
            if (filters.delivery && !car.delivery) return false;

            return true;
        });

        console.log("Filtered cars:", filtered.length); // Debug log
        return filtered;
    }, [filters, cars]); // ✅ Fixed: Added cars to dependencies

    // Format price with commas
    const formatPrice = (price: number) => {
        return `Ksh ${price.toLocaleString()}`;
    };

    if (loading) {
        return (
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
    }

    if (fetchError) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                    <div className="text-center text-red-600 p-4">
                        {fetchError}
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                {/* Filters row */}
                <div className="flex gap-4 mb-4 overflow-x-auto pb-2 items-center">
                    {/* Location filter */}
                    <input
                        type="text"
                        placeholder="Location (city)"
                        className="border p-2 rounded w-40 flex-shrink-0"
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />

                    <input
                        type="text"
                        placeholder="Make/Model"
                        className="border p-2 rounded w-32 flex-shrink-0"
                        value={filters.make}
                        onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                    />

                    <select
                        className="border p-2 rounded w-32 flex-shrink-0"
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="Sedan">Sedan</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="SUV">SUV</option>
                        <option value="Truck">Truck</option>
                        <option value="Sports">Sports</option>
                        <option value="Electric">Electric</option>
                    </select>

                    <input
                        type="number"
                        placeholder="Year"
                        className="border p-2 rounded w-28 flex-shrink-0"
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    />

                    <select
                        className="border p-2 rounded w-32 flex-shrink-0"
                        value={filters.fuelType}
                        onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
                    >
                        <option value="">Fuel Type</option>
                        <option value="Gasoline">Gasoline</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Electric">Electric</option>
                    </select>

                    <input
                        type="number"
                        placeholder="Seats"
                        className="border p-2 rounded w-24 flex-shrink-0"
                        value={filters.seats}
                        onChange={(e) => setFilters({ ...filters, seats: e.target.value })}
                    />

                    <input
                        type="number"
                        placeholder="Max Price"
                        className="border p-2 rounded w-28 flex-shrink-0"
                        value={filters.price}
                        onChange={(e) => setFilters({ ...filters, price: e.target.value })}
                    />

                    <label className="flex items-center space-x-2 flex-shrink-0">
                        <input
                            type="checkbox"
                            checked={filters.delivery}
                            onChange={(e) => setFilters({ ...filters, delivery: e.target.checked })}
                        />
                        <span>Delivery</span>
                    </label>

                    {/* Apply button updates URL so the HeroSection search and manual filter both behave consistently */}
                    <button
                        onClick={applyFiltersToUrl}
                        className="ml-2 bg-[#00A699] hover:bg-[#007A6E] text-white px-4 py-2 rounded-full text-sm font-medium transition"
                    >
                        Apply
                    </button>

                    {/* Clear filters */}
                    <button
                        onClick={clearFilters}
                        className="ml-2 text-sm text-gray-600 underline"
                    >
                        Clear
                    </button>
                </div>

                {/* Results count */}
                <div className="mb-4 text-gray-600">
                    Found {filteredCars.length} car{filteredCars.length !== 1 ? 's' : ''}
                </div>

                {/* Listings */}
                {filteredCars.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No cars match your filters. Try adjusting your search criteria.</p>
                        <p className="text-sm text-gray-400 mt-2">Total cars in database: {cars.length}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {filteredCars.map((car) => (
                            <div
                                key={car.id}
                                className="rounded-xl p-4 shadow transition-transform hover:scale-105 hover:shadow-lg hover:bg-gray-100"
                            >
                                <a href={`/cars/${car.id}`}>
                                    <img
                                        src={car.imageUrl || "https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80"}
                                        alt={car.name}
                                        className="w-full h-48 object-cover rounded-xl mb-3 hover:opacity-90 transition"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80";
                                        }}
                                    />
                                </a>

                                <h3 className="font-semibold text-lg">{car.name}</h3>

                                <div className="flex flex-wrap gap-6 text-xs text-gray-700 mt-2">
                                    <div className="flex items-center gap-2">
                                        <Car className="w-4 h-4 text-gray-500" />
                                        <span>{car.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span>{car.year}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Gauge className="w-4 h-4 text-gray-500" />
                                        <span>{car.fuelEfficiency || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{formatPrice(car.price)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Fuel className="w-4 h-4 text-gray-500" />
                                        <span>{car.fuelType}</span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 mt-2">📍 {car.location}</p>

                                {car.delivery && (
                                    <p className="text-green-600 mt-2 text-sm">🚚 Delivery available</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};