import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Navbar } from '../layout/NavBar'
import { Footer } from '../layout/Footer'
import { MyListings } from '../components/host/MyListings'
import type {HostCar} from '../types/host'

import { CarForm } from '../components/host/CarForm'
const initialCars: HostCar[] = [
    {
        id: '1',
        name: 'Tesla Model 3 2022',
        year: 2022,
        make: 'Tesla',
        model: 'Model 3',
        price: 89,
        location: 'San Francisco, CA',
        image:
            'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80',
        rating: 4.9,
        trips: 142,
        status: 'active',
        description: 'Premium electric sedan with autopilot features.',
        transmission: 'automatic',
        seats: 5,
        fuelType: 'electric',
    },
    {
        id: '2',
        name: 'BMW 3 Series 2021',
        year: 2021,
        make: 'BMW',
        model: '3 Series',
        price: 95,
        location: 'Los Angeles, CA',
        image:
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
        rating: 4.8,
        trips: 89,
        status: 'active',
        description: 'Luxury sports sedan with premium interior.',
        transmission: 'automatic',
        seats: 5,
        fuelType: 'gas',
    },
    {
        id: '3',
        name: 'Toyota RAV4 2020',
        year: 2020,
        make: 'Toyota',
        model: 'RAV4',
        price: 65,
        location: 'Seattle, WA',
        image:
            'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80',
        rating: 4.7,
        trips: 215,
        status: 'inactive',
        description: 'Reliable SUV perfect for family trips.',
        transmission: 'automatic',
        seats: 5,
        fuelType: 'hybrid',
    },
]
export const HostPage = () => {
    const [cars, setCars] = useState<HostCar[]>(initialCars)
    const [editingCar, setEditingCar] = useState<HostCar | null>(null)
    const [showForm, setShowForm] = useState(false)
    const handleAddNew = () => {
        setEditingCar(null)
        setShowForm(true)
    }
    const handleEdit = (car: HostCar) => {
        setEditingCar(car)
        setShowForm(true)
    }
    const handleDelete = (carId: string) => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            setCars((prev) => prev.filter((car) => car.id !== carId))
        }
    }
    const handleSave = (
        carData: Omit<HostCar, 'id' | 'rating' | 'trips'> & {
            id?: string
        },
    ) => {
        if (carData.id) {
            // Update existing car
            setCars((prev) =>
                prev.map((car) =>
                    car.id === carData.id
                        ? {
                            ...car,
                            ...carData,
                        }
                        : car,
                ),
            )
        } else {
            // Add new car
            const newCar: HostCar = {
                ...carData,
                id: Date.now().toString(),
                rating: 0,
                trips: 0,
            }
            setCars((prev) => [newCar, ...prev])
        }
        setShowForm(false)
        setEditingCar(null)
    }
    const handleCancel = () => {
        setShowForm(false)
        setEditingCar(null)
    }
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                                <p className="text-2xl font-bold text-gray-900">
                                    {cars.length}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {cars.filter((c) => c.status === 'active').length}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Total Trips</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {cars.reduce((sum, c) => sum + c.trips, 0)}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Avg. Rating</p>
                                <p className="text-2xl font-bold text-[#00A699]">
                                    {(
                                        cars.reduce((sum, c) => sum + c.rating, 0) / cars.length
                                    ).toFixed(1)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Form or Listings */}
                    {showForm ? (
                        <CarForm
                            editingCar={editingCar}
                            onSave={handleSave}
                            onCancel={handleCancel}
                        />
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
    )
}
