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
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState<string | null>(
        location.state?.successMessage || null
    );

    // Handle auth first - before any logs that use user
    if (!auth) {
        console.error('❌ [HostPage] AuthContext not found');
        return <div>Authentication system unavailable</div>;
    }

    const { user } = auth;

    if (!user) {
        console.warn('⚠️ [HostPage] No user in AuthContext');
        return <div>Please log in to view your listings</div>;
    }

    const loggedInUserId = user.id;

    // Now we can safely log with user
    console.log('🔍 [HostPage] Rendering with state:', {
        carsCount: cars.length,
        loading,
        fetchError,
        showForm,
        hasUser: !!user,
        userId: user?.id
    });

    console.log('👤 [HostPage] Logged in user ID:', loggedInUserId);

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

        console.log('📊 [HostPage] Stats calculated:', { total, approved, pending, deleted });
        return { total, approved, pending, deleted };
    }, [cars]);

    const handleAddNew = () => {
        console.log('➕ [HostPage] Add new car clicked');
        setEditingCar(null);
        setShowForm(true);
    };

    const handleEdit = (car: Car) => {
        console.log('✏️ [HostPage] Edit car clicked:', car.id, car.make, car.model);
        setEditingCar(car);
        setShowForm(true);
    };

    const handleDelete = async (carId: string | number) => {
        console.log('🗑️ [HostPage] Delete car clicked:', carId);

        if (!window.confirm('Are you sure you want to delete this listing? It can be restored later if needed.')) {
            console.log('❌ [HostPage] Delete cancelled for car:', carId);
            return;
        }

        // Store the car being deleted for potential rollback
        const carToDelete = cars.find(car => car.id === carId);

        try {
            console.log('📡 [HostPage] Sending soft delete request for car:', carId);

            // Optimistic update - remove from UI immediately (or update status)
            setCars((prev) => {
                const filtered = prev.filter((car) => car.id !== carId);
                console.log('📦 [HostPage] Cars after optimistic delete:', filtered.length);
                return filtered;
            });

            // Make API call to soft delete the car
            await api.delete(`/api/cars/${carId}`);

            console.log('✅ [HostPage] Car successfully soft deleted from database:', carId);

            // You could show a success message with an "Undo" option
            // setSuccessMessage('Car listing deleted. <button>Undo</button>');

        } catch (error) {
            console.error('❌ [HostPage] Failed to delete car:', error);

            // Rollback the optimistic update if the API call fails
            if (carToDelete) {
                setCars((prev) => [carToDelete, ...prev]);
                console.log('🔄 [HostPage] Rolled back delete for car:', carId);
            }

            // Show error message to user
            alert('Failed to delete the car listing. Please try again.');
        }
    };

    const handleSave = (
        carData: Omit<Car, 'id' | 'rating' | 'trips'> & { id?: string | number }
    ) => {
        console.log('💾 [HostPage] Save car called:', carData.id ? 'Update' : 'Create', carData);

        if (carData.id) {
            // Update existing car in local state
            setCars((prev) => {
                const updated = prev.map((car) =>
                    car.id === carData.id ? { ...car, ...carData } : car
                );
                console.log('📦 [HostPage] Cars after update:', updated.length);
                return updated;
            });
        } else {
            // Add new car
            const newCar: Car = {
                ...carData,
                id: Date.now().toString(),
                rating: 0,
                trips: 0,
            };
            console.log('🆕 [HostPage] New car created:', newCar);
            setCars((prev) => {
                const updated = [newCar, ...prev];
                console.log('📦 [HostPage] Cars after add:', updated.length);
                return updated;
            });
        }

        // Don't refetch - trust our local state
        setShowForm(false);
        setEditingCar(null);
    };

    const handleCancel = () => {
        console.log('❌ [HostPage] Form cancelled');
        setShowForm(false);
        setEditingCar(null);
    };

    // Fetch cars
    useEffect(() => {
        let mounted = true;

        const fetchCars = async () => {
            console.log('🔄 [HostPage] Fetching cars for user:', loggedInUserId);

            try {
                setLoading(true);
                setFetchError(null);

                console.log('📡 [HostPage] Making API call to /api/cars');
                const res = await api.get('/api/cars');

                console.log('📥 [HostPage] API response received:', {
                    status: res.status,
                    hasData: !!res.data,
                    dataType: typeof res.data,
                    isArray: Array.isArray(res.data?.data)
                });

                const carsData = res.data?.data;

                console.log('🔍 [HostPage] Raw carsData:', carsData);

                if (!Array.isArray(carsData)) {
                    console.error('❌ [HostPage] Expected array but got:', carsData);
                    if (mounted) {
                        setCars([]);
                        console.log('📦 [HostPage] Cars set to empty array due to invalid data');
                    }
                    return;
                }

                console.log('📊 [HostPage] Total cars from API:', carsData.length);

                const filtered = carsData.filter((c: ApiCar) => {
                    const matches = String(c.ownerId) === String(loggedInUserId);
                    if (matches) {
                        console.log('✅ [HostPage] Car matches user:', c.id, c.make, c.model);
                    }
                    return matches;
                });

                console.log('🎯 [HostPage] Filtered cars for user:', filtered.length);

                // Normalize the filtered cars
                const normalized = filtered.map((c: ApiCar) => {
                    const normalizedCar = normalizeCar(c);
                    console.log('🔄 [HostPage] Normalized car:', normalizedCar.id, normalizedCar.make, normalizedCar.model);
                    return normalizedCar;
                });

                if (mounted) {
                    setCars(normalized);
                    console.log('📦 [HostPage] Cars state updated with', normalized.length, 'cars');
                }
            } catch (err) {
                console.error('❌ [HostPage] Failed to fetch cars:', err);
                if (mounted) {
                    setFetchError('Failed to load cars. Please try again later.');
                    console.log('⚠️ [HostPage] Fetch error state set');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                    console.log('🏁 [HostPage] Loading complete');
                }
            }
        };

        console.log('🚀 [HostPage] Fetch effect triggered for user:', loggedInUserId);
        fetchCars();

        return () => {
            console.log('🧹 [HostPage] Cleanup: component unmounting');
            mounted = false;
        };
    }, [loggedInUserId, location.key]);

    useEffect(() => {
        if (successMessage) {
            console.log('✨ [HostPage] Success message displayed:', successMessage);
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                navigate(location.pathname, { replace: true }); // clear router state
                console.log('🧹 [HostPage] Success message cleared');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, navigate, location.pathname]);

    // Log when cars are passed to MyListings
    useEffect(() => {
        console.log('📤 [HostPage] Passing cars to MyListings:', cars.length);
        if (cars.length === 0 && !loading && !fetchError) {
            console.warn('⚠️ [HostPage] MyListings will show empty state - no cars available');
        }
    }, [cars, loading, fetchError]);

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
                        <>
                            {console.log('🎨 [HostPage] Rendering MyListings with cars:', cars.length)}
                            <MyListings
                                cars={cars}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onAddNew={handleAddNew}
                            />
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};