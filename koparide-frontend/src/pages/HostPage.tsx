// pages/HostPage.tsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
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

    const auth = useContext(AuthContext);
    // Success banner logic
    const location = useLocation();

    if (!auth) return <div>Authentication system unavailable</div>;
    const { user } = auth;
    if (!user) return <div>Please log in to view your listings</div>;
    const loggedInUserId = user.id;

    // Stats summary
    const stats = useMemo(() => {
        const total = cars.length;
        const approved = cars.filter(
            (c) => String(c.status ?? '').trim().toLowerCase() === 'approved'
        ).length;
        const pending = cars.filter(
            (c) => String(c.status ?? '').trim().toLowerCase() === 'pending'
        ).length;
        const deleted = cars.filter((c) => Boolean(c.is_deleted)).length;
        return { total, approved, pending, deleted };
    }, [cars]);

    const handleAddNew = () => {
        setEditingCar(null);
        setShowForm(true);
    };

    const handleEdit = (car: Car) => {
        setEditingCar(car);
        setShowForm(true);
    };

    const handleDelete = (carId: string | number) => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            setCars((prev) => prev.filter((car) => car.id !== carId));
        }
    };

    const handleSave = (
        carData: Omit<Car, 'id' | 'rating' | 'trips'> & { id?: string | number }
    ) => {
        if (carData.id) {
            // Update existing car in local state
            setCars((prev) =>
                prev.map((car) =>
                    car.id === carData.id ? { ...car, ...carData } : car
                )
            )
        } else {
            // Add new car
            const newCar: Car = {
                ...carData,
                id: Date.now().toString(),
                rating: 0,
                trips: 0,
            }
            setCars((prev) => [newCar, ...prev])
        }

        // Don't refetch - trust our local state
        setShowForm(false)
        setEditingCar(null)
    }

    const handleCancel = () => {
        setShowForm(false);
        setEditingCar(null);
    };

    // Fetch cars
    useEffect(() => {
        let mounted = true;
        const fetchCars = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await api.get('/api/cars');
                const carsData = res.data?.data;

                if (!Array.isArray(carsData)) {
                    console.error('Expected array but got:', carsData);
                    if (mounted) setCars([]);
                    return;
                }

                const filtered = carsData.filter(
                    (c: ApiCar) => String(c.ownerId) === String(loggedInUserId)
                );
            } catch (err) {
                console.error('Failed to fetch cars', err);
                if (mounted) {
                    setFetchError('Failed to load cars. Please try again later.');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchCars();
        return () => {
            mounted = false;
        };
    }, [loggedInUserId, location.key]);


    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState<string | null>(
        location.state?.successMessage || null
    );

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                navigate(location.pathname, { replace: true }); // clear router state
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, navigate, location.pathname]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

                    {/* Stats Summary */}
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