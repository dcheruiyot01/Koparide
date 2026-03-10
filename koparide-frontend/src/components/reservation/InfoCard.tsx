import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const InfoCard: React.FC = () => {
    return (
        <div className="bg-white rounded-xl shadow-sm p-4 text-sm">
            <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                    <p className="font-medium text-gray-900">Protection & roadside assistance</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Add protection to reduce your liability and get 24/7 roadside assistance.
                        Enhanced plan includes towing and on-road help.
                    </p>
                </div>
            </div>
        </div>
    );
};