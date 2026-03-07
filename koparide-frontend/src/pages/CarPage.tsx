import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Users, Gauge, Fuel, Car, Settings, Droplet } from "lucide-react";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import { LocationSearch } from "../components/locations/LocationsSearch";
import api from "../api/axios"; // axios instance

interface CarImage {
    id: number;
    carId: number;
    url: string;
    altText: string;
    isPrimary: boolean;
    position: number;
    createdAt: string;
    updatedAt: string;
}

interface Owner {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    defaultProfile: "http://localhost:4000/uploads/licenses/profile.png";
}

interface Car {
    id: number;
    ownerId: number;
    make: string;
    model: string;
    year: number;
    pricePerDay: string;
    classification: string;
    seats: number;
    fuelType: string;
    mpg: string;
    transmission: string;
    cruiseControl: boolean;
    cc: number;
    status: string;
    is_deleted: boolean;
    rented_to: number | null;
    createdAt: string;
    updatedAt: string;
    imagesList: CarImage[];
    owner: Owner;
    renter: Owner | null;
}

const today = new Date();
const formattedToday = today.toISOString().slice(0, 16);

export const CarPage = () => {
    const { id } = useParams<{ id: string }>();
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [current, setCurrent] = useState(0);
    const [showModal, setShowModal] = useState(false);
    // booking state
    const [startDateTime, setStartDateTime] = useState<string>(formattedToday);
    const [endDateTime, setEndDateTime] = useState<string>(formattedToday);
    const [days, setDays] = useState<number>(1);
    const [location, setLocation] = useState<string>("");

    const prevSlide = () =>
        setCurrent((prev) =>
            prev === 0 ? (car?.imagesList.length ?? 1) - 1 : prev - 1
        );

    const nextSlide = () =>
        setCurrent((prev) =>
            prev === (car?.imagesList.length ?? 1) - 1 ? 0 : prev + 1
        );

    const navigate = useNavigate();

    useEffect(() => {
        if (startDateTime && endDateTime) {
            const start = new Date(startDateTime);
            const end = new Date(endDateTime);

            if (end > start) {
                const diffMs = end.getTime() - start.getTime();
                const diffDays = diffMs / (1000 * 60 * 60 * 24);
                setDays(Math.ceil(diffDays)); // always round up
            } else {
                setDays(1); // fallback if end <= start
            }
        }
    }, [startDateTime, endDateTime]);

    // Fetch car details
    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();

        const fetchCar = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await api.get(`/api/cars/${id}`, { signal: controller.signal });
                const raw = res.data?.data ?? res.data ?? null;

                if (!raw) {
                    setFetchError("Car not found");
                    setCar(null);
                    return;
                }

                // Normalize shape to Car interface
                const normalized: Car = {
                    id: raw.id,
                    ownerId: raw.ownerId,
                    make: raw.make,
                    model: raw.model,
                    year: raw.year,
                    pricePerDay: raw.pricePerDay,
                    classification: raw.classification,
                    seats: raw.seats,
                    fuelType: raw.fuelType,
                    mpg: raw.mpg,
                    transmission: raw.transmission,
                    cruiseControl: raw.cruiseControl,
                    cc: raw.cc,
                    status: raw.status,
                    is_deleted: raw.is_deleted,
                    rented_to: raw.rented_to,
                    createdAt: raw.createdAt,
                    updatedAt: raw.updatedAt,
                    imagesList: Array.isArray(raw.imagesList) ? raw.imagesList : [],
                    owner: raw.owner,
                    renter: raw.renter,
                };

                setCar(normalized);
            } catch (err: any) {
                if (err.name === "CanceledError" || err.name === "AbortError") return;
                setFetchError("Failed to load car details");
                console.error("fetchCar error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCar();
        return () => controller.abort();
    }, [id]);
    useEffect(() => {
        console.log("Current location state:", location);
    }, [location]);

    // Make sure handleLocationSelect is super stable
    const handleLocationSelect = useCallback((address: string) => {
        console.log("✅ Location selected in CarPage:", address);
        console.log("📝 Setting location state to:", address);
        setLocation(address);

        // Also log immediately to verify state update
        setTimeout(() => {
            console.log("⏱️ After timeout, location should be:", address);
        }, 100);
    }, []);

    const handleReserve = () => {
        if (!car) return;

        if (!location || location.trim() === "") {
            alert("Please select a pickup location before continuing.");
            return;
        }

        navigate(`/cars/${car.id}/reservations`, {
            state: {
                totalPrice: days * Number(car.pricePerDay),
                startDate: startDateTime,
                endDate: endDateTime,
                days,
                location,
            },
        });
    };
    if (loading) return <div>Loading...</div>;
    if (fetchError) return <div>{fetchError}</div>;
    if (!car) return <div>No car found</div>;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                    {/* Gallery Card */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="grid grid-cols-3 gap-2">
                            {/* Hero image */}
                            <div className="relative col-span-2 h-72 md:h-96">
                                <img
                                    src={car.imagesList[current].url}
                                    alt={`Car ${current + 1}`}
                                    className="w-full h-full object-cover bg-gray-100 transition-all duration-500"
                                />

                                {/* Overlay button */}
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="absolute bottom-3 right-3 bg-white/90 px-4 py-2 text-sm font-semibold rounded shadow hover:bg-white"
                                >
                                    View {car.imagesList.length} photos
                                </button>

                                {/* Navigation arrows */}
                                <button
                                    onClick={prevSlide}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Two stacked previews */}
                            <div className="flex flex-col gap-2 h-72 md:h-96">
                                <div
                                    onClick={nextSlide}
                                    className="cursor-pointer flex-1 rounded-lg overflow-hidden opacity-80 hover:opacity-100 transition"
                                >
                                    <img
                                        src={car.imagesList[(current + 1) % car.imagesList.length].url}
                                        alt="Next preview"
                                        className="w-full h-full object-cover bg-gray-100"
                                    />
                                </div>
                                <div
                                    onClick={prevSlide}
                                    className="cursor-pointer flex-1 rounded-lg overflow-hidden opacity-80 hover:opacity-100 transition"
                                >
                                    <img
                                        src={car.imagesList[(current + 2) % car.imagesList.length].url}
                                        alt="Next preview"
                                        className="w-full h-full object-cover bg-gray-100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dots indicator */}
                        <div className="flex justify-center gap-2 mt-4 pb-4">
                            {car.imagesList.map((_, index) => (
                                <span
                                    key={index}
                                    onClick={() => setCurrent(index)}
                                    className={`w-3 h-3 rounded-full cursor-pointer ${
                                        current === index ? "bg-[#00a699]" : "bg-gray-300"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Vehicle Details Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Vehicle Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Title + Rating */}
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold">{car.year} {car.make} {car.model}</h1>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="ext-sm font-bold text-green-600">
                                        Per Day:  Ksh {car.pricePerDay}
                                    </span>
                                </div>
                            </div>
                            {/* Vehicle Features */}
                            <div className="flex flex-wrap gap-6 text-xs text-gray-700">
                                {/* Seats */}
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span>{car.seats}</span>
                                </div>

                                {/* Engine CC */}
                                <div className="flex items-center gap-2">
                                    <Gauge className="w-4 h-4 text-gray-500" />
                                    <span>{car.cc} cc</span>
                                </div>

                                {/* Fuel type */}
                                <div className="flex items-center gap-2">
                                    <Fuel className="w-4 h-4 text-gray-500" />
                                    <span>{car.fuelType}</span>
                                </div>

                                {/* Cruise Control */}
                                <div className="flex items-center gap-2">
                                    <Car className="w-4 h-4 text-gray-500" />
                                    <span>{car.cruiseControl ? "Cruise Control" : "No Cruise Control"}</span>
                                </div>

                                {/* Transmission */}
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-gray-500" />
                                    <span>{car.transmission}</span>
                                </div>

                                {/* Fuel Consumption */}
                                <div className="flex items-center gap-2">
                                    <Droplet className="w-4 h-4 text-gray-500" />
                                    <span>{0} MPG</span>
                                </div>
                            </div>

                            {/* Host Info */}
                            <div className="flex items-center gap-4 text-sm text-gray-700">
                                {/* Profile image */}
                                <img
                                    src="http://localhost:4000/uploads/licenses/profile.png"
                                    alt={car.owner.name}
                                    className="w-12 h-12 rounded-full object-cover border"
                                />

                                {/* Host details */}
                                <div>
                                    <p className="font-semibold">Host: {car.owner.name}</p>
                                    <p>Joined {car.owner.createdAt}</p>
                                    <p>Host rating: {0} ⭐</p>
                                </div>
                            </div>


                            {/* Safety / Class */}
                            <div className="mt-4">
                                <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                                    {car.class}
                                </span>
                                <p className="text-xs text-gray-600 mt-2">{car.classNote}</p>
                            </div>

                            <div className="mt-8 border-t pt-6">
                                <h2 className="text-lg font-semibold mb-4">Rules of the Road</h2>
                                <ul className="space-y-3 text-sm">
                                    <li>
                                        <strong>No smoking allowed:</strong> Smoking in any vehicle will result in a $150 fine.
                                    </li>
                                    <li>
                                        <strong>Keep the vehicle tidy:</strong> Unreasonably dirty vehicles may result in a fine.
                                    </li>
                                    <li>
                                        <strong>Refuel the vehicle:</strong> Vehicle should have the same amount of fuel.
                                    </li>
                                    <li>
                                        <strong>No off‑roading:</strong> Vehicles are not permitted to be driven off‑road.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Right: Booking Card */}
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                            {/* Price */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-green-600">
                                  Total: Ksh {days * Number(car.pricePerDay)}
                                </span>
                                <span className="text-sm text-gray-500"> for </span>
                                <div className="text-sm font-bold text-green-600">
                                    {days} days
                                </div>

                            </div>

                            {/* Trip Dates */}
                            <div className="text-sm text-gray-700 space-y-3">
                                <div>
                                    {/* Trip Dates */}
                                    <div className="text-sm text-gray-700 space-y-3">
                                        <div className="flex flex-col">
                                            <label className="font-semibold mb-1">Trip start</label>
                                            <input
                                                type="datetime-local"
                                                value={startDateTime}
                                                onChange={(e) => setStartDateTime(e.target.value)}
                                                className="border rounded px-2 py-1 text-sm"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="font-semibold mb-1">Trip end</label>
                                            <input
                                                type="datetime-local"
                                                value={endDateTime}
                                                onChange={(e) => setEndDateTime(e.target.value)}
                                                className="border rounded px-2 py-1 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <div className="flex flex-col">
                                        <label className="font-semibold mb-1">Pickup & return location</label>
                                        <LocationSearch onSelect={handleLocationSelect} />
                                    </div>
                                </div>
                            </div>

                            {/* Continue Button */}
                            <a
                                onClick={handleReserve}
                                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 text-center block no-underline"                            >
                                Continue Now
                            </a>


                        </div>

                    </div>
                </div>
            </main>
            <Footer />

            {/* Modal Gallery */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
                    {/* Close button */}
                    <button
                        onClick={() => setShowModal(false)}
                        className="absolute top-4 right-4 text-white bg-black/60 p-2 rounded-full hover:bg-black"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Image + arrows */}
                    <div className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center">
                        <img
                            src={car.imagesList[current].url}
                            alt={`Car ${current + 1}`}
                            className="max-h-full max-w-full object-contain"
                        />

                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Dots inside modal */}
                    <div className="flex justify-center gap-2 mt-4">
                        {car.imagesList.map((_, index) => (
                            <span
                                key={index}
                                onClick={() => setCurrent(index)}
                                className={`w-3 h-3 rounded-full cursor-pointer ${
                                    current === index ? "bg-white" : "bg-gray-500"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
