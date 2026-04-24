// components/reservation/TripDetails.tsx
import React from 'react';
import { Calendar, Clock, Info } from 'lucide-react';
import type { BookingState } from './types';

interface TripDetailsProps {
    bookingState: BookingState;
}

const formatDisplayDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
};

export const TripDetails: React.FC<TripDetailsProps> = ({ bookingState }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Trip Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                        <p className="text-xs text-gray-500">Pick up</p>
                        <p className="text-sm font-medium text-gray-900">
                            {formatDisplayDate(bookingState.startDate)}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                        <p className="text-xs text-gray-500">Return</p>
                        <p className="text-sm font-medium text-gray-900">
                            {formatDisplayDate(bookingState.endDate)}
                        </p>
                    </div>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Info className="w-4 h-4 text-gray-400" />
                <span>{bookingState.days} day{bookingState.days !== 1 ? 's' : ''}</span>
            </div>
        </div>
    );
};