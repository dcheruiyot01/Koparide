import React, { useEffect, useState, useContext, useRef } from 'react';
import { X, Upload, XCircle } from 'lucide-react';
import type { HostCar } from '../../types/car.ts';
import { LocationSearch } from '../locations/LocationsSearch';
import { AuthContext } from '../../auth/AuthContext';
import api from "../../api/axios"
import { useNavigate } from 'react-router-dom';

interface CarFormProps {
    editingCar: HostCar | null;
    onSave: (car: Omit<HostCar, 'id' | 'rating' | 'trips'> & { id?: string | number }) => void;
    onCancel: () => void;
}

// Type for form data (matches HostCar minus id, rating, trips, plus an images array for files/URLs)
type CarFormData = Omit<HostCar, 'id' | 'rating' | 'trips'> & {
    images: (File | string)[]; // uploaded files + existing image URLs
};

// Initial empty state (status defaults to 'pending')
const getInitialFormState = (): CarFormData => ({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    classification: 'SUV',
    seats: 5,
    fuelType: 'gas',
    transmission: 'automatic',
    cruiseControl: false,
    pricePerDay: 0,
    location: '',
    imagesList: [], // will be synced with images array; kept for compatibility
    owner: undefined,
    renter: undefined,
    is_deleted: false,
    createdAt: undefined,
    updatedAt: undefined,
    status: 'pending',
    cc: undefined,
    mpg: undefined,
    description: '',
    images: [], // our working array for files and URLs
});

// Constants (preserved from original)
const CLASSIFICATIONS = ['SUV', 'Sedan', 'Saloon', 'Pickup', 'Truck', 'Hatchback', 'Van', 'Coupe', 'Convertible'];
const SEAT_OPTIONS = [2, 4, 5, 6, 7, 8];
const FUEL_TYPES = ['gas', 'diesel', 'hybrid', 'electric'];
// REQUIRED_FIELDS is intentionally empty (original behavior)
const REQUIRED_FIELDS: string[] = [];

// User-friendly labels for error display
const fieldLabels: Record<string, string> = {
    make: 'Make',
    model: 'Model',
    year: 'Year',
    classification: 'Classification',
    pricePerDay: 'Price per day',
    location: 'Location',
    images: 'Images',
    transmission: 'Transmission',
    seats: 'Seats',
    fuelType: 'Fuel type',
    mpg: 'Fuel efficiency (MPG)',
    cc: 'Engine size (CC)',
    description: 'Description',
    cruiseControl: 'Cruise control',
    status: 'Status',
};

export function CarForm({ editingCar, onSave, onCancel }: CarFormProps) {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    if (!auth) throw new Error('AuthContext not found');
    const { token, user } = auth;

    const [formData, setFormData] = useState<CarFormData>(getInitialFormState);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [showErrorSummary, setShowErrorSummary] = useState(false);

    // Ref for the error banner to scroll into view
    const errorBannerRef = useRef<HTMLDivElement>(null);

    // Populate form when editingCar changes
    useEffect(() => {
        if (editingCar) {
            // Convert existing image URLs to strings in the images array
            const existingImages = editingCar.imagesList?.map((img) => img.url) ?? [];
            setFormData({
                ...editingCar,
                images: existingImages, // store URLs as strings
            });
            // Set previews for existing images
            setImagePreviews(existingImages);
        } else {
            // Reset for new car
            setFormData(getInitialFormState());
            setImagePreviews([]);
        }
        // Reset error summary when switching cars or opening new form
        setShowErrorSummary(false);
        setErrors({});
        setTouched({});
    }, [editingCar]);

    // Auto-scroll to error summary when it appears
    useEffect(() => {
        if (showErrorSummary && Object.keys(errors).length > 0) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                errorBannerRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }, 100);
        }
    }, [showErrorSummary, errors]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
            return;
        }
        const numericFields = ['year', 'pricePerDay', 'seats', 'mpg', 'cc'];
        setFormData((prev) => ({
            ...prev,
            [name]: numericFields.includes(name)
                ? value === ''
                    ? undefined
                    : Number(value)
                : value,
        }));
        // Clear error for this field if it exists
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: false }));
        }
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const value = formData[field as keyof CarFormData];
        let hasError = false;
        if (REQUIRED_FIELDS.includes(field)) {
            if (value === undefined || value === '' || value === 0) hasError = true;
            if (field === 'year' && (value as number) < 1990) hasError = true;
            if (field === 'pricePerDay' && (value as number) <= 0) hasError = true;
        }
        setErrors((prev) => ({ ...prev, [field]: hasError }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        // Create preview URLs
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setImagePreviews((prev) => [...prev, ...newPreviews]);
        // Store File objects in images array
        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...files],
        }));
    };

    const removeImage = (index: number) => {
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, boolean> = {};

        // Required fields (REQUIRED_FIELDS is empty, so only custom checks apply)
        REQUIRED_FIELDS.forEach((field) => {
            const value = formData[field as keyof CarFormData];
            if (!value || value === 0) newErrors[field] = true;
        });

        // Year range
        if (formData.year < 1990 || formData.year > 2027) newErrors.year = true;

        // Price must be positive
        if (formData.pricePerDay <= 0) newErrors.pricePerDay = true;

        // At least one image
        if (formData.images.length === 0) newErrors.images = true;

        // Mark all fields as touched for error display
        const allTouched = [...REQUIRED_FIELDS, 'year', 'pricePerDay', 'images'].reduce(
            (acc, field) => ({ ...acc, [field]: true }),
            {}
        );
        setTouched(allTouched);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validate form before submission
        const isValid = validateForm();
        if (!isValid) {
            setShowErrorSummary(true);
            return;
        }

        try {
            const body = new FormData();

            // Append all non‑image fields
            (Object.entries(formData) as [keyof CarFormData, any][]).forEach(([key, value]) => {
                if (key === 'images') return; // handled separately
                if (value !== undefined && value !== null) {
                    body.append(key, String(value));
                }
            });

            // Append images: File objects go as "images", existing URLs as "existingImages"
            formData.images.forEach((img) => {
                if (img instanceof File) {
                    body.append('images', img);
                } else {
                    body.append('existingImages', img);
                }
            });

            // Append images: File objects go as "images", existing URLs as "existingImages"

            let res;

            if (editingCar) {
                // Update existing car
                res = await api.put(`/api/cars/${editingCar.id}`, body, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } else {
                // Create new car
                res = await api.post('/api/cars', body, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            // Axios automatically throws for non‑2xx responses, so if we’re here, status is OK.
            // Still, we can double‑check:
            if (res.status < 200 || res.status >= 300) {
                console.error('❌ Failed to save car:', res.statusText);
                alert('Something went wrong while saving. Please try again.');
                return;
            }

            // Axios response data contains the saved car object
            const savedCar = res.data;
            // Notify parent components
            onSave(savedCar);
            navigate('/host', { state: { successMessage: 'Car successfully updated!' } });
            onCancel();
        } catch (err: any) {
            // Axios errors have a response object with details
            if (err.response) {
                console.error('❌ Error submitting form:', err.response.status, err.response.data);
                alert(`Error ${err.response.status}: ${err.response.data?.message || 'Failed to save car'}`);
            } else {
                console.error('❌ Unexpected error submitting form:', err.message);
                alert('Unexpected error occurred. Please try again later.');
            }
        }
    };

    // Helper for input classes (preserves original styling)
    const inputClasses = (field: string): string =>
        `w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none transition bg-white ${
            errors[field] && touched[field] ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'
        }`;

    const selectClasses = (field: string): string => `${inputClasses(field)} appearance-none`;

    // Helper to render form fields (preserves original behavior)
    const renderField = (
        name: keyof CarFormData,
        label: string,
        type: string = 'text',
        options?: any[]
    ) => {
        const isRequired = REQUIRED_FIELDS.includes(name);
        const error = errors[name] && touched[name];
        const value = formData[name] as string | number | undefined;

        return (
            <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label} {isRequired && <span className="text-red-500">*</span>}
                </label>
                {type === 'select' ? (
                    <select
                        name={name}
                        value={value ?? ''}
                        onChange={handleChange}
                        onBlur={() => handleBlur(name)}
                        aria-invalid={error}
                        aria-describedby={error ? `${name}-error` : undefined}
                        className={selectClasses(name)}
                    >
                        {options?.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                                {name === 'seats' && ' seats'}
                            </option>
                        ))}
                    </select>
                ) : type === 'textarea' ? (
                    <textarea
                        name={name}
                        value={value ?? ''}
                        onChange={handleChange}
                        rows={4}
                        placeholder={label}
                        aria-invalid={error}
                        aria-describedby={error ? `${name}-error` : undefined}
                        className={`${inputClasses(name)} resize-none`}
                    />
                ) : (
                    <input
                        type={type}
                        name={name}
                        value={value ?? ''}
                        onChange={handleChange}
                        onBlur={() => handleBlur(name)}
                        placeholder={label}
                        min={type === 'number' ? 1 : undefined}
                        aria-invalid={error}
                        aria-describedby={error ? `${name}-error` : undefined}
                        className={inputClasses(name)}
                    />
                )}
                {error && (
                    <p id={`${name}-error`} className="text-red-500 text-xs mt-1">
                        {label} is required
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    {/* Error Summary Banner */}
                    {showErrorSummary && Object.keys(errors).length > 0 && (
                        <div
                            ref={errorBannerRef}
                            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                            <h4 className="text-sm font-medium text-red-800 mb-2">
                                Please fix the following errors:
                            </h4>
                            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                {Object.keys(errors).map((field) => (
                                    <li key={field}>{fieldLabels[field] || field} is required or invalid.</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                            <div className="bg-gray-50/50 rounded-xl p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderField('make', 'Make')}
                                    {renderField('model', 'Model')}
                                    {renderField('year', 'Year', 'number')}
                                    {renderField('classification', 'Classification', 'select', CLASSIFICATIONS)}
                                    {renderField('pricePerDay', 'Price/Day (Ksh)', 'number')}
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Location</h3>
                            <div className="bg-gray-50/50 rounded-xl p-6">
                                <LocationSearch
                                    // preload the car’s current location
                                    value={formData.location}

                                    onSelect={(address: string) =>
                                        setFormData((prev) => ({ ...prev, location: address }))
                                    }
                                    className={inputClasses('location')}
                                />
                            </div>
                        </div>

                        {/* Images */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Images <span className="text-red-500">*</span>
                            </h3>
                            <div className="bg-gray-50/50 rounded-xl p-6">
                                {errors.images && touched.images && (
                                    <p className="text-sm text-red-500 mb-4">At least one image required</p>
                                )}
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                        {imagePreviews.map((preview, i) => (
                                            <div key={i} className="relative group aspect-[4/3] rounded-lg overflow-hidden border">
                                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i)}
                                                    className="absolute top-2 right-2 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg hover:border-[#00A699] transition">
                                    <Upload className="h-4 w-4" />
                                    <span className="text-sm">Upload Images</span>
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Specifications */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                            <div className="bg-gray-50/50 rounded-xl p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {renderField('transmission', 'Transmission', 'select', ['automatic', 'manual'])}
                                    {renderField('seats', 'Seats', 'select', SEAT_OPTIONS)}
                                    {renderField('fuelType', 'Fuel Type', 'select', FUEL_TYPES)}
                                    {renderField('mpg', 'Fuel Efficiency (MPG)', 'number')}
                                    {renderField('cc', 'Engine Size (CC)', 'number')}
                                    <div className="flex items-center">
                                        <label className="flex items-center gap-3 cursor-pointer mt-6">
                                            <input
                                                type="checkbox"
                                                name="cruiseControl"
                                                checked={formData.cruiseControl ?? false}
                                                onChange={handleChange}
                                                className="w-4 h-4 rounded text-[#00A699]"
                                            />
                                            <span className="text-sm font-medium">Cruise Control</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Description</h3>
                            <div className="bg-gray-50/50 rounded-xl p-6">
                                {renderField('description', 'Description', 'textarea')}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Status</h3>
                            <div className="bg-gray-50/50 rounded-xl p-6">
                                <div
                                    className={`px-4 py-2.5 rounded-lg font-medium inline-block ${
                                        formData.status === 'approved'
                                            ? 'bg-green-100 text-green-700'
                                            : formData.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                    }`}
                                >
                                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Status managed by administrators</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-100 sticky bottom-0 bg-white">
                        <button
                            type="submit"
                            className="flex-1 bg-[#00A699] hover:bg-[#008A7E] text-white px-6 py-3 rounded-lg font-medium transition"
                        >
                            {editingCar ? 'Update' : 'Create'} Listing
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 sm:flex-none px-6 py-3 border rounded-lg font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}