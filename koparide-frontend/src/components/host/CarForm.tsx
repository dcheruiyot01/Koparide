import React, { useEffect, useState } from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import type { HostCar } from '../../types/host'
interface CarFormProps {
    editingCar: HostCar | null
    onSave: (
        car: Omit<HostCar, 'id' | 'rating' | 'trips'> & {
            id?: string
        },
    ) => void
        onCancel: () => void
}
export function CarForm({ editingCar, onSave, onCancel }: CarFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        year: new Date().getFullYear(),
        make: '',
        model: '',
        price: 0,
        location: '',
        image: '',
        description: '',
        transmission: 'automatic',
        seats: 5,
        fuelType: 'gas',
        status: 'active' as 'active' | 'inactive',
    })
    const [errors, setErrors] = useState<Record<string, boolean>>({})
    useEffect(() => {
        if (editingCar) {
            setFormData({
                name: editingCar.name,
                year: editingCar.year,
                make: editingCar.make,
                model: editingCar.model,
                price: editingCar.price,
                location: editingCar.location,
                image: editingCar.image,
                description: editingCar.description || '',
                transmission: editingCar.transmission || 'automatic',
                seats: editingCar.seats || 5,
                fuelType: editingCar.fuelType || 'gas',
                status: editingCar.status,
            })
        }
    }, [editingCar])
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >,
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]:
                name === 'year' || name === 'price' || name === 'seats'
                    ? Number(value)
                    : value,
        }))
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: false,
            }))
        }
    }
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const requiredFields = ['name', 'make', 'model', 'location', 'image']
        const newErrors: Record<string, boolean> = {}
        requiredFields.forEach((field) => {
            if (!formData[field as keyof typeof formData]) {
                newErrors[field] = true
            }
        })
        if (formData.price <= 0) {
            newErrors.price = true
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        onSave({
            ...formData,
            id: editingCar?.id,
        })
    }
    const inputClasses = (fieldName: string) =>
        `w-full border ${errors[fieldName] ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'} rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none transition`
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                    {editingCar ? 'Edit Listing' : 'Add New Listing'}
                </h2>
                <button
                    onClick={onCancel}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Vehicle Details */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                        Vehicle Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Car Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Tesla Model 3 2022"
                                className={inputClasses('name')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Year *
                            </label>
                            <input
                                type="number"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                min={1990}
                                max={new Date().getFullYear() + 1}
                                className={inputClasses('year')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Make *
                            </label>
                            <input
                                type="text"
                                name="make"
                                value={formData.make}
                                onChange={handleChange}
                                placeholder="e.g., Tesla"
                                className={inputClasses('make')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Model *
                            </label>
                            <input
                                type="text"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="e.g., Model 3"
                                className={inputClasses('model')}
                            />
                        </div>
                    </div>
                </div>

                {/* Listing Details */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                        Listing Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Price per Day ($) *
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min={1}
                                placeholder="89"
                                className={inputClasses('price')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Location *
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g., San Francisco, CA"
                                className={inputClasses('location')}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Image URL *
                            </label>
                            <div className="flex gap-4">
                                <input
                                    type="url"
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    placeholder="https://example.com/car-image.jpg"
                                    className={`flex-1 ${inputClasses('image')}`}
                                />
                                {formData.image && (
                                    <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                ;(e.target as HTMLImageElement).style.display = 'none'
                                            }}
                                        />
                                    </div>
                                )}
                                {!formData.image && (
                                    <div className="w-20 h-12 rounded-lg bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center">
                                        <ImageIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Describe your car, its features, and what makes it special..."
                                className={inputClasses('description')}
                            />
                        </div>
                    </div>
                </div>

                {/* Specifications */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                        Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Transmission
                            </label>
                            <select
                                name="transmission"
                                value={formData.transmission}
                                onChange={handleChange}
                                className={inputClasses('transmission')}
                            >
                                <option value="automatic">Automatic</option>
                                <option value="manual">Manual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Seats
                            </label>
                            <select
                                name="seats"
                                value={formData.seats}
                                onChange={handleChange}
                                className={inputClasses('seats')}
                            >
                                <option value={2}>2 seats</option>
                                <option value={4}>4 seats</option>
                                <option value={5}>5 seats</option>
                                <option value={6}>6 seats</option>
                                <option value={7}>7 seats</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Fuel Type
                            </label>
                            <select
                                name="fuelType"
                                value={formData.fuelType}
                                onChange={handleChange}
                                className={inputClasses('fuelType')}
                            >
                                <option value="gas">Gas</option>
                                <option value="electric">Electric</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Listing Status
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={inputClasses('status')}
                    >
                        <option value="active">Active - Visible to renters</option>
                        <option value="inactive">Inactive - Hidden from search</option>
                    </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        className="flex-1 bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-3 rounded-full font-medium transition-colors"
                    >
                        {editingCar ? 'Update Listing' : 'Create Listing'}
                    </button>
                    {editingCar && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}
