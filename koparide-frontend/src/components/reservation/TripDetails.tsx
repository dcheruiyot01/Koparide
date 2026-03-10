import React from 'react';
import { Calendar, Clock, AlertCircle, Info } from 'lucide-react';
import type { BookingState } from './types';

interface TripDetailsProps {
    bookingState: BookingState;
    licenseExpired: boolean;
    licenseAcknowledged: boolean;
    onLicenseAcknowledge: (checked: boolean) => void;
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

export const TripDetails: React.FC<TripDetailsProps> = ({
                                                            bookingState,
                                                            licenseExpired,
                                                            licenseAcknowledged,
                                                            onLicenseAcknowledge,
                                                        }) => {
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

            {/* License warning */}
            {licenseExpired && (
                <div className="mt-4 flex items-start gap-3 bg-yellow-50 border-l-4 border-yellow-300 p-3 rounded">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-800">
                            Your driver's license has expired
                        </p>
                        <p className="text-sm text-yellow-700">
                            Update your license before your trip starts to avoid cancellation.
                        </p>
                        <label className="flex items-center gap-2 mt-2 text-sm">
                            <input
                                type="checkbox"
                                checked={licenseAcknowledged}
                                onChange={(e) => onLicenseAcknowledge(e.target.checked)}
                                className="rounded text-[#00A699] focus:ring-[#00A699]"
                            />
                            <span className="text-yellow-700">
                                I understand and will update my license
                            </span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};