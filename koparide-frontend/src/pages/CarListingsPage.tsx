import React, { useEffect, useMemo, useState } from "react";
import { Gauge, Fuel, Car, Calendar } from "lucide-react";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * CarListingsPage
 *
 * - Adds a location filter and includes `location` on each mock car (random Kenyan cities).
 * - Filters are case-insensitive substring matches for make/model and location.
 * - Price input is treated as a maximum price (car.price <= maxPrice).
 * - Keeps the Apply button which updates the URL query string so HeroSection searches work.
 */

/* Mock data with random Kenyan cities */
const cars = [
    {
        id: 1,
        name: "Mitsubishi Mirage G4",
        year: 2018,
        type: "Sedan",
        seats: 5,
        fuelType: "Gasoline",
        fuelEfficiency: "30 mpg",
        price: 5000,
        delivery: true,
        location: "Nairobi",
        imageUrl: "http://localhost:4000/uploads/licenses/1772651847333-527049013.png",
    },
    {
        id: 2,
        name: "Mitsubishi Mirage",
        year: 2020,
        type: "Hatchback",
        seats: 5,
        fuelType: "Gasoline",
        fuelEfficiency: "32 mpg",
        price: 4000,
        delivery: false,
        location: "Mombasa",
        imageUrl: "http://localhost:4000/uploads/licenses/alvano-putra-TdAatXFLWak-unsplash.jpg",
    },
    {
        id: 3,
        name: "Toyota Corolla",
        year: 2021,
        type: "Sedan",
        seats: 5,
        fuelType: "Hybrid",
        fuelEfficiency: "40 mpg",
        price: 4500,
        delivery: true,
        location: "Kisumu",
        imageUrl: "http://localhost:4000/uploads/licenses/ivan-kazlouskij-GjKmrL2QgSM-unsplash.jpg",
    },
    {
        id: 4,
        name: "Honda CR-V",
        year: 2019,
        type: "SUV",
        seats: 7,
        fuelType: "Gasoline",
        fuelEfficiency: "28 mpg",
        price: 10000,
        delivery: true,
        location: "Nakuru",
        imageUrl: "http://localhost:4000/uploads/licenses/nick-mollenbeck-wR30lR9ZdJQ-unsplash.jpg",
    },
    {
        id: 5,
        name: "Tesla Model 3",
        year: 2022,
        type: "Sedan",
        seats: 5,
        fuelType: "Electric",
        fuelEfficiency: "120 MPGe",
        price: 15000,
        delivery: false,
        location: "Eldoret",
        imageUrl: "http://localhost:4000/uploads/licenses/sven-d-a4S6KUuLeoM-unsplash.jpg",
    },
    {
        id: 6,
        name: "Isuzu D-Max",
        year: 2020,
        type: "Truck",
        seats: 5,
        fuelType: "Diesel",
        fuelEfficiency: "22 mpg",
        price: 8000,
        delivery: true,
        location: "Thika",
        imageUrl: "http://localhost:4000/uploads/licenses/isuzu.jpg",
    },
    {
        id: 7,
        name: "Mazda CX-5",
        year: 2021,
        type: "SUV",
        seats: 5,
        fuelType: "Gasoline",
        fuelEfficiency: "27 mpg",
        price: 9000,
        delivery: false,
        location: "Naivasha",
        imageUrl: "http://localhost:4000/uploads/licenses/mazda.jpg",
    },
    {
        id: 8,
        name: "Subaru Forester",
        year: 2019,
        type: "SUV",
        seats: 5,
        fuelType: "Gasoline",
        fuelEfficiency: "26 mpg",
        price: 7000,
        delivery: true,
        location: "Machakos",
        imageUrl: "http://localhost:4000/uploads/licenses/subaru.jpg",
    },
];

export const CarListingsPage: React.FC = () => {
    const locationHook = useLocation();
    const navigate = useNavigate();

    // Filters state (includes location)
    const [filters, setFilters] = useState({
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

    // Filtering logic (client-side)
    const filteredCars = useMemo(() => {
        const maxPrice = filters.price ? Number(filters.price) : null;
        const makeLower = filters.make ? filters.make.toLowerCase() : "";
        const locationLower = filters.location ? filters.location.toLowerCase() : "";

        return cars.filter((car) => {
            // location: case-insensitive substring match
            if (locationLower && !car.location.toLowerCase().includes(locationLower)) return false;

            // type
            if (filters.type && car.type !== filters.type) return false;

            // make/model (case-insensitive substring)
            if (makeLower && !car.name.toLowerCase().includes(makeLower)) return false;

            // year
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
    }, [filters]);

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
                        onClick={() =>
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
                            })
                        }
                        className="ml-2 text-sm text-gray-600 underline"
                    >
                        Clear
                    </button>
                </div>

                {/* Listings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredCars.map((car) => (
                        <div
                            key={car.id}
                            className="rounded-xl p-4 shadow transition-transform hover:scale-105 hover:shadow-lg hover:bg-gray-100"
                        >
                            <a href={`/cars/${car.id}`}>
                                <img
                                    src={car.imageUrl}
                                    alt={car.name}
                                    className="w-full h-48 object-cover rounded-xl mb-3 hover:opacity-90 transition"
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
                                    <span>{car.fuelEfficiency}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Ksh {car.price}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Fuel className="w-4 h-4 text-gray-500" />
                                    <span>{car.fuelType}</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 mt-2">Location: {car.location}</p>

                            {car.delivery && <p className="text-green-600 mt-2">Delivery available</p>}
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
};
