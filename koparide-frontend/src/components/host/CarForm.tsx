import React, { useEffect, useState, useContext, useRef } from 'react';
import { X, Upload, XCircle, FileText } from 'lucide-react';
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

// Type for form data – includes logbook_url and insurance_url as strings or Files
type CarFormData = Omit<HostCar, 'id' | 'rating' | 'trips'> & {
    images: (File | string)[];          // uploaded files + existing image URLs
    logbook_url?: File | string | null;  // new file or existing URL
    insurance_url?: File | string | null; // new file or existing URL
};

// Initial empty state
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
    insurance_url: '',
    logbook_url: '',
    imagesList: [],
    owner: undefined,
    renter: undefined,
    is_deleted: false,
    createdAt: undefined,
    updatedAt: undefined,
    status: 'pending',
    cc: undefined,
    mpg: undefined,
    description: '',
    images: [],
});

// Constants
const CLASSIFICATIONS = ['SUV', 'Sedan', 'Saloon', 'Pickup', 'Truck', 'Hatchback', 'Van', 'Coupe', 'Convertible'];
const SEAT_OPTIONS = [2, 4, 5, 6, 7, 8];
const FUEL_TYPES = ['gas', 'diesel', 'hybrid', 'electric'];
const REQUIRED_FIELDS: string[] = [];

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
    logbook_url: 'Car Logbook',
    insurance_url: 'Car Insurance',
};

export function CarForm({ editingCar, onSave, onCancel }: CarFormProps) {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    if (!auth) throw new Error('AuthContext not found');
    const { token } = auth;

    const [formData, setFormData] = useState<CarFormData>(getInitialFormState);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [showErrorSummary, setShowErrorSummary] = useState(false);

    // Refs for file inputs
    const logbookInputRef = useRef<HTMLInputElement>(null);
    const insuranceInputRef = useRef<HTMLInputElement>(null);
    const errorBannerRef = useRef<HTMLDivElement>(null);

    // Populate form when editingCar changes
    useEffect(() => {
        if (editingCar) {
            const existingImages = editingCar.imagesList?.map((img) => img.url) ?? [];
            setFormData({
                ...editingCar,
                images: existingImages,
                logbook_url: editingCar.logbook_url || null,
                insurance_url: editingCar.insurance_url || null,
            });
            setImagePreviews(existingImages);
        } else {
            setFormData(getInitialFormState());
            setImagePreviews([]);
        }
        setShowErrorSummary(false);
        setErrors({});
        setTouched({});
    }, [editingCar]);

    // Auto-scroll to error summary
    useEffect(() => {
        if (showErrorSummary && Object.keys(errors).length > 0) {
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
                ? value === '' ? undefined : Number(value)
                : value,
        }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }));
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
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setImagePreviews((prev) => [...prev, ...newPreviews]);
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

    // Document upload handlers
    const handleLogbookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFormData((prev) => ({ ...prev, logbook_url: file }));
    };

    const handleInsuranceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFormData((prev) => ({ ...prev, insurance_url: file }));
    };

    const removeLogbook = () => {
        setFormData((prev) => ({ ...prev, logbook_url: null }));
        if (logbookInputRef.current) logbookInputRef.current.value = '';
    };

    const removeInsurance = () => {
        setFormData((prev) => ({ ...prev, insurance_url: null }));
        if (insuranceInputRef.current) insuranceInputRef.current.value = '';
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, boolean> = {};

        REQUIRED_FIELDS.forEach((field) => {
            const value = formData[field as keyof CarFormData];
            if (!value || value === 0) newErrors[field] = true;
        });

        if (formData.year < 1990 || formData.year > 2027) newErrors.year = true;
        if (formData.pricePerDay <= 0) newErrors.pricePerDay = true;
        if (formData.images.length === 0) newErrors.images = true;

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
        if (!validateForm()) {
            setShowErrorSummary(true);
            return;
        }

        try {
            // First, prepare car data without file fields
            const carPayload = new FormData();
            (Object.entries(formData) as [keyof CarFormData, any][]).forEach(([key, value]) => {
                if (key === 'images' || key === 'logbook_url' || key === 'insurance_url') return;
                if (value !== undefined && value !== null) {
                    carPayload.append(key, String(value));
                }
            });
            // Append existing image URLs
            formData.images.forEach((img) => {
                if (!(img instanceof File)) carPayload.append('existingImages', img);
            });

            let savedCar;
            if (editingCar) {
                const res = await api.put(`/api/cars/${editingCar.id}`, carPayload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                savedCar = res.data;
            } else {
                const res = await api.post('/api/cars', carPayload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                savedCar = res.data;
            }

            // Now handle document uploads
            const uploadPromises = [];
            // Upload logbook if it's a new file
            if (formData.logbook_url instanceof File) {
                const logbookForm = new FormData();
                logbookForm.append('logbook', formData.logbook_url);
                console.log(formData);
                uploadPromises.push(
                    api.post(`/api/cars/${savedCar.car.id}/registration`, logbookForm, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                );
            } else if (formData.logbook_url === null && editingCar?.logbook_url) {
                // If removed, send null via main update (optional)
                // This could be handled by a separate route or included in main update
                // For simplicity, we'll skip or you can add a call to clear it.
            }

            // Upload insurance if it's a new file
            if (formData.insurance_url instanceof File) {
                const insuranceForm = new FormData();
                insuranceForm.append('insurance', formData.insurance_url);
                uploadPromises.push(
                    api.post(`/api/cars/${savedCar.car.id}/insurance`, insuranceForm, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                );
            }

            await Promise.all(uploadPromises);

            // Optionally refetch updated car
            onSave(savedCar);
            navigate('/host', { state: { successMessage: 'Car successfully updated!' } });
            onCancel();
        } catch (err) {
            // error handling
        }
    };

    // Helper for input classes
    const inputClasses = (field: string): string =>
        `w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none transition bg-white ${
            errors[field] && touched[field] ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'
        }`;

    const selectClasses = (field: string): string => `${inputClasses(field)} appearance-none`;

    // Helper to render form fields
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
                                {opt}{name === 'seats' && ' seats'}
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

    // Helper to render a document upload section (no status)
    const renderDocumentUpload = (
        label: string,
        field: 'logbook_url' | 'insurance_url',
        file: File | string | null | undefined,
        onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
        onRemove: () => void,
        inputRef: React.RefObject<HTMLInputElement>
    ) => {
        const hasFile = file instanceof File;
        const hasUrl = !!file && typeof file === 'string';
        console.log('hasFile', hasFile);
        console.log('hasUrl', hasUrl);
        return (
            <div className="bg-gray-50/50 rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
                {hasFile || hasUrl ? (
                    <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-[#00A699]" />
                            <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                {hasFile ? (file as File).name : (hasUrl ? 'Document uploaded' : '')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasUrl && !hasFile && (
                                <a
                                    href={file as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#00A699] hover:underline"
                                >
                                    View
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={onRemove}
                                className="text-gray-400 hover:text-red-500"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => inputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#00A699] transition"
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/png, image/jpeg, application/pdf"
                            onChange={onUpload}
                            className="hidden"
                        />
                        <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload {label}</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (max 5MB)</p>
                    </div>
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
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    {showErrorSummary && Object.keys(errors).length > 0 && (
                        <div ref={errorBannerRef} className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
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
                                    value={formData.location}
                                    onSelect={(address) => setFormData((prev) => ({ ...prev, location: address }))}
                                    className={inputClasses('location')}
                                />
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

                        {/* Car Logbook */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Car Logbook</h3>
                            {renderDocumentUpload(
                                'Logbook Document',
                                'logbook_url',
                                formData.logbook_url,
                                handleLogbookUpload,
                                removeLogbook,
                                logbookInputRef
                            )}
                        </div>

                        {/* Car Insurance */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Car Insurance</h3>
                            {renderDocumentUpload(
                                'Insurance Document',
                                'insurance_url',
                                formData.insurance_url,
                                handleInsuranceUpload,
                                removeInsurance,
                                insuranceInputRef
                            )}
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
                        <button type="submit" className="flex-1 bg-[#00A699] hover:bg-[#008A7E] text-white px-6 py-3 rounded-lg font-medium transition">
                            {editingCar ? 'Update' : 'Create'} Listing
                        </button>
                        <button type="button" onClick={onCancel} className="flex-1 sm:flex-none px-6 py-3 border rounded-lg font-medium hover:bg-gray-50 transition">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}