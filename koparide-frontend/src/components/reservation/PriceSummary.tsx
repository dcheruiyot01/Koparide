import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import type { PromoApplied, RateType } from './types';
import { TAX_RATE } from './types';

interface PriceSummaryProps {
    basePrice: number;
    protectionCost: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    days: number;
    selectedRate: RateType;
    promoApplied: PromoApplied | null;
    onApplyPromo: (code: string) => Promise<void>;
}

const formatCurrency = (amount: number): string => {
    return `Ksh ${amount.toFixed(2)}`;
};

export const PriceSummary: React.FC<PriceSummaryProps> = ({
                                                              basePrice,
                                                              protectionCost,
                                                              discountAmount,
                                                              taxAmount,
                                                              totalAmount,
                                                              days,
                                                              selectedRate,
                                                              promoApplied,
                                                              onApplyPromo,
                                                          }) => {
    const [promoCode, setPromoCode] = useState("");
    const [promoError, setPromoError] = useState<string | null>(null);
    const [applying, setApplying] = useState(false);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            setPromoError("Please enter a promo code");
            return;
        }

        setApplying(true);
        setPromoError(null);

        try {
            await onApplyPromo(promoCode);
            setPromoCode(""); // Clear input on success
        } catch (error: any) {
            setPromoError(error.message);
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Summary</h3>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">
                        Base price ({days} days)
                    </span>
                    <span className="text-gray-900">{formatCurrency(basePrice)}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">Protection plan</span>
                    <span className="text-gray-900">{formatCurrency(protectionCost)}</span>
                </div>

                {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>
                            Discount
                            {promoApplied && (
                                <span className="text-xs ml-1">(Promo: {promoApplied.code})</span>
                            )}
                            {!promoApplied && selectedRate === "nonrefundable" && (
                                <span className="text-xs ml-1">(Non-refundable rate)</span>
                            )}
                        </span>
                        <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                )}

                <div className="flex justify-between">
                    <span className="text-gray-600">Sales tax ({(TAX_RATE * 100).toFixed(2)}%)</span>
                    <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
                </div>

                <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-900">Total</p>
                            <p className="text-xs text-gray-500">Includes taxes & fees</p>
                        </div>
                        <div className="text-2xl font-bold text-[#00A699]">
                            {formatCurrency(totalAmount)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Promo code */}
            {!promoApplied && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Promo code
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => {
                                setPromoCode(e.target.value);
                                setPromoError(null);
                            }}
                            placeholder="Enter code"
                            disabled={applying}
                            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A699] focus:border-transparent outline-none ${
                                promoError ? 'border-red-300' : 'border-gray-200'
                            } ${applying ? 'bg-gray-100' : ''}`}
                        />
                        <button
                            onClick={handleApplyPromo}
                            disabled={applying || !promoCode.trim()}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                applying || !promoCode.trim()
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#00A699] hover:bg-[#007A6E] text-white'
                            }`}
                        >
                            {applying ? 'Applying...' : 'Apply'}
                        </button>
                    </div>
                    {promoError && (
                        <p className="text-xs text-red-600 mt-1">{promoError}</p>
                    )}
                </div>
            )}

            {promoApplied && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Promo code {promoApplied.code} applied: -{formatCurrency(promoApplied.discount)}
                    </p>
                </div>
            )}
        </div>
    );
};