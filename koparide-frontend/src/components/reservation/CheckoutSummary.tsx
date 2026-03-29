import React, { useState } from 'react';
import { CreditCard, Smartphone, Lock, CheckCircle } from 'lucide-react';
import type { PromoApplied, RateType } from './types';
import { TAX_RATE } from './types';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface CheckoutSummaryProps {
    // Price summary props
    basePrice: number;
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
    termsError?: boolean; // validation error for terms

    // Props lifted from parent
    selectedMethod?: 'card' | 'mpesa';
    mpesaPhoneNumber?: string;
    onMpesaPhoneChange?: (phone: string) => void;
}

const formatCurrency = (amount: number): string => `Ksh ${amount.toFixed(2)}`;

export const CheckoutSummary = React.forwardRef<{ getCardPaymentMethod: () => Promise<string | null> }, CheckoutSummaryProps>(
    ({
         basePrice,
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
         selectedMethod: controlledSelectedMethod,
         mpesaPhoneNumber: controlledMpesaPhoneNumber,
         onMpesaPhoneChange,
     }, ref) => {

        const stripe = useStripe();
        const elements = useElements();

        // State for card errors
        const [cardError, setCardError] = useState<string | null>(null);
        const [cardComplete, setCardComplete] = useState(false);

        // Payment method internal state (use controlled props if provided, otherwise internal state)
        const [internalSelectedMethod, setInternalSelectedMethod] = useState<'card' | 'mpesa'>('card');
        const [internalPhoneNumber, setInternalPhoneNumber] = useState('');

        // Use controlled props if provided, otherwise use internal state
        const selectedMethod = controlledSelectedMethod !== undefined ? controlledSelectedMethod : internalSelectedMethod;
        const phoneNumber = controlledMpesaPhoneNumber !== undefined ? controlledMpesaPhoneNumber : internalPhoneNumber;

        // Promo code internal state
        const [promoCode, setPromoCode] = useState('');
        const [promoError, setPromoError] = useState<string | null>(null);
        const [applying, setApplying] = useState(false);

        // Handle card element changes
        const handleCardChange = (event: any) => {
            setCardError(event.error ? event.error.message : null);
            setCardComplete(event.complete);
        };

        // Create payment method for Stripe
        const createPaymentMethod = async (): Promise<string | null> => {
            if (!stripe || !elements) {
                setCardError('Stripe not initialized');
                return null;
            }
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) return null;

            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                setCardError(error.message);
                return null;
            }
            return paymentMethod.id;
        };

        // Expose method to parent via ref
        React.useImperativeHandle(ref, () => ({
            getCardPaymentMethod: createPaymentMethod,
        }));

        const handleMethodChange = (method: 'card' | 'mpesa') => {
            if (controlledSelectedMethod === undefined) {
                setInternalSelectedMethod(method);
            }

            if (method === 'card') {
                onPaymentMethodChange('card');
            } else {
                onPaymentMethodChange('mpesa', { phoneNumber });
            }
        };

        const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value.replace(/\D/g, '');

            if (onMpesaPhoneChange) {
                onMpesaPhoneChange(value);
            } else {
                setInternalPhoneNumber(value);
            }

            if (selectedMethod === 'mpesa') {
                onPaymentMethodChange('mpesa', { phoneNumber: value });
            }
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
                {/* Header with secure badge */}
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
                        <span className="text-gray-600">Base price ({days} days)</span>
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
                                {!promoApplied && selectedRate === 'nonrefundable' && (
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

                {/* Promo Code */}
                {!promoApplied ? (
                    <div className="pt-2">
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

                {/* Payment Method Selection */}
                <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-gray-900">Payment method</h4>

                    {/* Credit / Debit card option */}
                    <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                        selectedMethod === 'card' ? 'border-[#00A699] bg-[#00A699]/5' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={selectedMethod === 'card'}
                            onChange={() => handleMethodChange('card')}
                            className="mt-1 mr-3 text-[#00A699] focus:ring-[#00A699]"
                        />
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-gray-600" />
                                    <span className="font-medium text-gray-900">Credit / Debit card</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-semibold text-gray-500">Visa</span>
                                    <span className="text-xs font-semibold text-gray-500">Mastercard</span>
                                    <span className="text-xs font-semibold text-gray-500">Amex</span>
                                    <span className="text-xs font-semibold text-gray-500">Discover</span>
                                </div>
                            </div>
                            {selectedMethod === 'card' && (
                                <div className="mt-4">
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                        <CardElement
                                            options={{
                                                style: {
                                                    base: {
                                                        fontSize: '16px',
                                                        color: '#424770',
                                                        '::placeholder': { color: '#aab7c4' },
                                                    },
                                                    invalid: { color: '#9e2146' },
                                                },
                                            }}
                                            onChange={handleCardChange}
                                        />
                                    </div>
                                    {cardError && (
                                        <p className="text-xs text-red-600 mt-1">{cardError}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </label>

                    {/* M-Pesa option */}
                    <label
                        className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                            selectedMethod === 'mpesa'
                                ? 'border-[#00A699] bg-[#00A699]/5'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="mpesa"
                            checked={selectedMethod === 'mpesa'}
                            onChange={() => handleMethodChange('mpesa')}
                            className="mt-1 mr-3 text-[#00A699] focus:ring-[#00A699]"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-900">M‑Pesa</span>
                            </div>
                            {selectedMethod === 'mpesa' && (
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
                            )}
                        </div>
                    </label>
                </div>

                {/* Terms agreement */}
                <div
                    id="terms-section"
                    className={`p-3 rounded ${termsError ? 'bg-red-50 border border-red-200' : ''}`}
                >
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={termsAgreed}
                            onChange={(e) => onTermsChange(e.target.checked)}
                            className={`rounded text-[#00A699] focus:ring-[#00A699] ${
                                termsError ? 'border-red-500' : ''
                            }`}
                        />
                        <span className={`text-gray-600 ${termsError ? 'text-red-700' : ''}`}>
                            I agree to the{' '}
                            <button className="text-[#00A699] hover:underline">terms of service</button> and{' '}
                            <button className="text-[#00A699] hover:underline">rental policy</button>
                        </span>
                    </label>
                    {termsError && !termsAgreed && (
                        <p className="text-xs text-red-600 mt-1">You must agree to the terms and policy.</p>
                    )}
                </div>
            </div>
        );
    }
);

CheckoutSummary.displayName = 'CheckoutSummary';