// pages/HostPage.tsx
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Navbar } from '../layout/NavBar';
import { Footer } from '../layout/Footer';
import { MyListings } from '../components/host/MyListings';
import type { Car } from '../types/car.ts';
import { CarForm } from '../components/host/CarForm';
import api from '../api/axios';
import { AuthContext } from '../auth/AuthContext';
import { normalizeCar, type ApiCar } from '../utils/carNormalizer';
import { useLocation, useNavigate } from 'react-router-dom';

export const HostPage = () => {
    const [cars, setCars] = useState<Car[]>([]);
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const auth = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Auth guard
    if (!auth) {
        return <div className="min-h-screen flex items-center justify-center">Authentication system unavailable</div>;
    }
    const { user } = auth;
    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Please log in to view your listings</div>;
    }
    const loggedInUserId = user.id;

    // Stats summary
    const stats = useMemo(() => {
        const total = cars.length;
        const approved = cars.filter((c) => String(c.status ?? '').trim().toLowerCase() === 'approved').length;
        const pending = cars.filter((c) => String(c.status ?? '').trim().toLowerCase() === 'pending').length;
        const deleted = cars.filter((c) => Boolean(c.is_deleted)).length;
        return { total, approved, pending, deleted };
    }, [cars]);

    // Fetch cars
    const fetchCars = useCallback(async () => {
        try {
            setLoading(true);
            setFetchError(null);
            const res = await api.get('/api/cars');
            const carsData = res.data?.data;
            if (!Array.isArray(carsData)) {
                setCars([]);
                return;
            }
            const filtered = carsData.filter((c: ApiCar) => String(c.ownerId) === String(loggedInUserId));
            const normalized = filtered.map((c: ApiCar) => normalizeCar(c));
            setCars(normalized);
        } catch (err) {
            console.error('Failed to fetch cars:', err);
            setFetchError('Failed to load cars. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [loggedInUserId]);

    useEffect(() => {
        fetchCars();
    }, [fetchCars, location.key]);

    // Detect success message from navigation state (works when coming back from CarForm)
    useEffect(() => {
        const msg = location.state?.successMessage;
        if (msg) {
            setSuccessMessage(msg);
            // Clear the location state so it doesn't reappear
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    // Auto-dismiss success message after 5 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Handlers
    const handleAddNew = () => {
        setEditingCar(null);
        setShowForm(true);
    };

    const handleEdit = (car: Car) => {
        setEditingCar(car);
        setShowForm(true);
    };

    const handleDelete = async (carId: string | number) => {
        if (!window.confirm('Are you sure you want to delete this listing? It can be restored later if needed.')) {
            return;
        }
        const carToDelete = cars.find(car => car.id === carId);
        try {
            setCars((prev) => prev.filter((car) => car.id !== carId));
            await api.delete(`/api/cars/${carId}`);
            // Optionally show a temporary success message
            setSuccessMessage('Car listing deleted successfully');
        } catch (error) {
            console.error('Failed to delete car:', error);
            if (carToDelete) {
                setCars((prev) => [carToDelete, ...prev]);
            }
            alert('Failed to delete the car listing. Please try again.');
        }
    };

    const handleSave = (
        carData: Omit<Car, 'id' | 'rating' | 'trips'> & { id?: string | number }
    ) => {
        if (carData.id) {
            setCars((prev) =>
                prev.map((car) => (car.id === carData.id ? { ...car, ...carData } : car))
            );
        } else {
            const newCar: Car = {
                ...carData,
                id: Date.now().toString(),
                rating: 0,
                trips: 0,
            };
            setCars((prev) => [newCar, ...prev]);
        }
        setShowForm(false);
        setEditingCar(null);
        // The success message will come from the navigation state (set inside CarForm)
        // but we also show a fallback message here
        setSuccessMessage(carData.id ? 'Car updated successfully!' : 'Car created successfully!');
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCar(null);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A699] mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading your listings...</p>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Error state
    if (fetchError && cars.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md mx-auto">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                            <p className="text-red-600 mb-6">{fetchError}</p>
                            <button
                                onClick={fetchCars}
                                className="bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-2 rounded-lg font-medium transition"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Success Banner */}
                    {successMessage && (
                        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded mb-4 transition-opacity duration-500">
                            {successMessage}
                        </div>
                    )}

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
                            <p className="text-gray-500 mt-1">
                                Manage your vehicles and track their performance
                            </p>
                        </div>
                        {!showForm && (
                            <button
                                onClick={handleAddNew}
                                className="inline-flex items-center gap-2 bg-[#00A699] hover:bg-[#007A6E] text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-sm"
                            >
                                <Plus className="h-5 w-5" />
                                Add New Car
                            </button>
                        )}
                    </div>

                    {/* Stats Summary (only show if there are cars and not in form) */}
                    {cars.length > 0 && !showForm && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Total Listings</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Approved</p>
                                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Deleted</p>
                                <p className="text-2xl font-bold text-red-600">{stats.deleted}</p>
                            </div>
                        </div>
                    )}

                    {/* Form or Listings */}
                    {showForm ? (
                        <CarForm editingCar={editingCar} onSave={handleSave} onCancel={handleCancel} />
                    ) : (
                        <MyListings
                            cars={cars}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAddNew={handleAddNew}
                        />
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};