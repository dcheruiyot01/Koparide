import type { HostCar } from '../../types/car.ts';
import { Star, MapPin, Pencil, Trash2, Car } from 'lucide-react';

interface MyListingsProps {
    cars: HostCar[];
    onEdit: (car: HostCar) => void;
    onDelete: (carId: string | number) => void; // Accept both string and number
    onAddNew: () => void;
}

export const MyListings = ({
                               cars,
                               onEdit,
                               onDelete,
                               onAddNew,
                           }: MyListingsProps) => {


    // Empty state
    console.log('cars', cars);
    if (cars.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    You haven't listed any cars yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Start earning by sharing your car with travelers in your area.
                </p>
                <button
                    onClick={onAddNew}
                    className="bg-[#00A699] hover:bg-[#007A6E] text-white px-6 py-3 rounded-full font-medium transition-colors"
                >
                    List Your First Car
                </button>
            </div>
        );
    }
    // Listings grid
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => {
                // Safely determine the primary image
                const images = car.imagesList ?? [];
                const primaryImage =
                    images.find((img) => img?.isPrimary)?.url ??
                    images[0]?.url ??
                    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=8';

                // Construct display name from make and model
                const displayName = [car.make, car.model].filter(Boolean).join(' ') || 'Unknown Car';

                // Status text and styling
                const statusText = car.status === 'approved' ? 'Approved' : 'Pending';
                const statusClasses = car.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600';

                return (
                    <div
                        key={car.id}
                        className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100"
                    >
                        {/* Image */}
                        <div className="relative h-48 bg-gray-200">
                            <img
                                src={primaryImage}
                                alt={displayName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            {/* Status Badge */}
                            <div
                                className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses}`}
                            >
                                {statusText}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900 truncate pr-2">
                                    {displayName}
                                </h3>
                                <div className="flex items-baseline whitespace-nowrap">
                                    <span className="font-bold text-gray-900">
                                        Ksh {car.pricePerDay}
                                    </span>
                                    <span className="text-gray-500 text-sm ml-1">/day</span>
                                </div>
                            </div>

                            <div className="flex items-center text-gray-500 text-sm mb-3">
                                <MapPin className="h-3.5 w-3.5 text-[#00A699] mr-1 flex-shrink-0" />
                                <span className="truncate">{car.location ?? 'Location not specified'}</span>
                            </div>

                            <div className="flex items-center mb-4">
                                <Star className="h-4 w-4 text-[#00A699] fill-current" />
                                <span className="font-semibold text-gray-900 ml-1">
                                    {car.rating?.toFixed(1) ?? '0.0'}
                                </span>
                                <span className="text-gray-500 text-sm ml-1">
                                    ({car.cc ?? '?'} cc)
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => onEdit(car)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-[#00A699] text-[#00A699] rounded-lg text-sm font-medium hover:bg-[#00A699]/5 transition-colors"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(car.id)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-500 rounded-lg text-sm font-medium hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};