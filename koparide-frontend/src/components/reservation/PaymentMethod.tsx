import React from 'react';
import { CreditCard } from 'lucide-react';
import type { PaymentMethod as PaymentMethodType } from './types';

interface PaymentMethodProps {
    paymentMethod: PaymentMethodType;
    termsAgreed: boolean;
    onTermsChange: (checked: boolean) => void;
    onUpdatePayment: () => void;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
                                                                paymentMethod,
                                                                termsAgreed,
                                                                onTermsChange,
                                                                onUpdatePayment,
                                                            }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Payment Method</h3>
                <button
                    onClick={onUpdatePayment}
                    className="text-sm text-[#00A699] font-medium hover:underline"
                >
                    Update
                </button>
            </div>

            <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-gray-400" />
                <div>
                    <p className="text-sm font-medium">
                        {paymentMethod.brand} •••• {paymentMethod.last4}
                    </p>
                    <p className="text-xs text-gray-500">
                        Expires {paymentMethod.expiry}
                    </p>
                </div>
            </div>

            {/* Terms agreement */}
            <label className="flex items-center gap-2 mt-4 text-sm">
                <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => onTermsChange(e.target.checked)}
                    className="rounded text-[#00A699] focus:ring-[#00A699]"
                />
                <span className="text-gray-600">
                    I agree to the <button className="text-[#00A699] hover:underline">terms of service</button> and{' '}
                    <button className="text-[#00A699] hover:underline">rental policy</button>
                </span>
            </label>
        </div>
    );
};