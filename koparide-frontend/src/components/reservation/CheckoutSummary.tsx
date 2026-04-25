// components/reservation/CheckoutSummary.tsx
import React, { useState } from 'react';
import { Smartphone, Lock, CheckCircle } from 'lucide-react';
import type { PromoApplied, RateType } from './types';
import { TAX_RATE } from './types';

interface CheckoutSummaryProps {
    // Price summary props
    basePrice: number;            // total car + driver cost for the trip (before protection, discount, tax)
    driverFeeTotal?: number;      // total driver fee for the trip (0 if self‑drive)
    protectionCost: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    days: number;
    selectedRate: RateType;
    promoApplied: PromoApplied | null;
    onApplyPromo: (code: string) => Promise<void>;

    // Payment method props
    onPaymentMethodChange: (method: 'card' | 'mpesa', details?: any) => void;
    termsAgreed: boolean;
    onTermsChange: (checked: boolean) => void;
    termsError?: boolean;

    // Props lifted from parent (only M‑Pesa now)
    mpesaPhoneNumber?: string;
    onMpesaPhoneChange?: (phone: string) => void;
}

const formatCurrency = (amount: number): string => `Ksh ${amount.toFixed(2)}`;

export const CheckoutSummary = React.forwardRef<{ getCardPaymentMethod: () => Promise<string | null> }, CheckoutSummaryProps>(
    ({
         basePrice,
         driverFeeTotal = 0,
         protectionCost,
         discountAmount,
         taxAmount,
         totalAmount,
         days,
         selectedRate,
         promoApplied,
         onApplyPromo,
         onPaymentMethodChange,
         termsAgreed,
         onTermsChange,
         termsError,
         mpesaPhoneNumber: controlledMpesaPhoneNumber,
         onMpesaPhoneChange,
     }, ref) => {

        // Internal state for phone number (if not controlled)
        const [internalPhoneNumber, setInternalPhoneNumber] = useState('');
        const phoneNumber = controlledMpesaPhoneNumber !== undefined ? controlledMpesaPhoneNumber : internalPhoneNumber;

        // Promo code state
        const [promoCode, setPromoCode] = useState('');
        const [promoError, setPromoError] = useState<string | null>(null);
        const [applying, setApplying] = useState(false);

        const carOnlyTotal = Math.max(0, basePrice - driverFeeTotal);

        // Card payment method is disabled – this ref method is never called.
        // We provide a dummy implementation to avoid breaking the parent component.
        React.useImperativeHandle(ref, () => ({
            getCardPaymentMethod: async () => {
                // Card payments are not supported; always return null.
                return null;
            },
        }));

        // Always use M‑Pesa – notify parent immediately on mount and when phone number changes
        React.useEffect(() => {
            onPaymentMethodChange('mpesa', { phoneNumber });
        }, [phoneNumber, onPaymentMethodChange]);

        const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value.replace(/\D/g, '');
            if (onMpesaPhoneChange) {
                onMpesaPhoneChange(value);
            } else {
                setInternalPhoneNumber(value);
            }
            // Parent will be notified via the useEffect dependency
        };

        const handleApplyPromo = async () => {
            if (!promoCode.trim()) {
                setPromoError('Please enter a promo code');
                return;
            }
            setApplying(true);
            setPromoError(null);
            try {
                await onApplyPromo(promoCode);
                setPromoCode('');
            } catch (error: any) {
                setPromoError(error.message);
            } finally {
                setApplying(false);
            }
        };

        return (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Checkout</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Lock className="w-4 h-4" />
                        <span>Secure Checkout</span>
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Base price (car only, {days} days)</span>
                        <span className="text-gray-900">{formatCurrency(carOnlyTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Driver fee ({days} days)</span>
                        <span className="text-gray-900">{formatCurrency(driverFeeTotal)}</span>
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
                                {!promoApplied && selectedRate === 'nonrefundable' && (
                                    <span className="text-xs ml-1">(Non-refundable rate)</span>
                                )}
                            </span>
                            <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-600">Tax ({(TAX_RATE * 100).toFixed(2)}%)</span>
                        <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="pt-3 mt-3">
                        <div className="flex justify-between pt-2 border-t">
                            <span className="font-medium text-gray-900">Total (includes taxes & fees)</span>
                            <span className="font-bold text-[#00A699]">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Promo code section */}
                {!promoApplied ? (
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Promo code</label>
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
                        {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
                    </div>
                ) : (
                    <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-700 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Promo code {promoApplied.code} applied: -{formatCurrency(promoApplied.discount)}
                        </p>
                    </div>
                )}

                {/* M‑Pesa payment method (only option) */}
                <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-gray-900">Payment method</h4>
                    <div className="flex items-start p-4 border rounded-lg border-[#00A699] bg-[#00A699]/5">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-900">M‑Pesa</span>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    M‑Pesa phone number
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={handlePhoneChange}
                                    placeholder="254712345678"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A699] focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    You will receive an STK push prompt on this number.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms agreement */}
                <div id="terms-section" className={`p-3 rounded ${termsError ? 'bg-red-50 border border-red-200' : ''}`}>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={termsAgreed}
                            onChange={(e) => onTermsChange(e.target.checked)}
                            className={`rounded text-[#00A699] focus:ring-[#00A699] ${termsError ? 'border-red-500' : ''}`}
                        />
                        <span className={`text-gray-600 ${termsError ? 'text-red-700' : ''}`}>
                            I agree to the{' '}
                            <button className="text-[#00A699] hover:underline">terms of service</button> and{' '}
                            <button className="text-[#00A699] hover:underline">rental policy</button>
                        </span>
                    </label>
                    {termsError && !termsAgreed && <p className="text-xs text-red-600 mt-1">You must agree to the terms and policy.</p>}
                </div>
            </div>
        );
    }
);

CheckoutSummary.displayName = 'CheckoutSummary';