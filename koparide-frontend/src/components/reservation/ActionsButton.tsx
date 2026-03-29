import React from 'react';
import { ChevronLeft, XCircle } from 'lucide-react';

interface ActionButtonsProps {
    canProceed: boolean;
    processing: boolean;
    paymentError: string | null;
    onConfirm: () => void;
    onBack: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
                                                                canProceed,
                                                                processing,
                                                                paymentError,
                                                                onConfirm,
                                                                onBack,
                                                            }) => {
    return (
        <div className="space-y-3">
            <button
                onClick={onConfirm}
                disabled={processing}   // only disable while processing
                className={`w-full py-3 rounded-lg font-semibold transition ${
                    processing
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#00A699] hover:bg-[#007A6E] text-white'
                }`}
            >
                {processing ? 'Processing...' : 'Confirm and Pay'}
            </button>

            <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
                <ChevronLeft className="h-4 w-4" />
                Back to car details
            </button>

            {paymentError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    {paymentError}
                </div>
            )}
        </div>
    );
};