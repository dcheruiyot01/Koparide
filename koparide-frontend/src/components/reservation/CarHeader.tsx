import React from 'react';
import { MapPin } from 'lucide-react';
import type { Car, BookingState } from './types';
import { DEFAULT_CAR_IMAGE } from './types';

interface CarHeaderProps {
    car: Car;
    bookingState: BookingState | null;
}

export const CarHeader: React.FC<CarHeaderProps> = ({ car, bookingState }) => {
    const carImage = car.imagesList.find(img => img.isPrimary)?.url ||
        car.imagesList[0]?.url ||
        DEFAULT_CAR_IMAGE;

    const formatCurrency = (amount: number): string => {
        return `Ksh ${amount.toFixed(2)}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-start gap-4">
            <img
                src={carImage}
                alt={`${car.make} ${car.model}`}
                className="w-28 h-20 object-cover rounded-lg flex-shrink-0"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE;
                }}
            />
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {car.year} {car.make} {car.model}
                    </h2>
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="font-medium text-[#00A699]">
                        {formatCurrency(Number(car.pricePerDay))} / day
                    </span>
                </div>

                {bookingState?.location && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {bookingState.location}
                    </p>
                )}
            </div>
        </div>
    );
};