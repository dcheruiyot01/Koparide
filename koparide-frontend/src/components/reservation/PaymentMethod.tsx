import React, { useState } from 'react';
import { CreditCard, Smartphone, Lock } from 'lucide-react';

interface PaymentMethodProps {
    onPaymentMethodChange: (method: 'card' | 'mpesa', details?: any) => void;
    termsAgreed: boolean;
    onTermsChange: (checked: boolean) => void;
    error?: boolean;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
                                                                onPaymentMethodChange,
                                                                termsAgreed,
                                                                onTermsChange,
                                                                error,
                                                            }) => {
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'mpesa'>('card');
    const [phoneNumber, setPhoneNumber] = useState('');

    const handleMethodChange = (method: 'card' | 'mpesa') => {
        setSelectedMethod(method);
        if (method === 'card') {
            onPaymentMethodChange('card');
        } else {
            onPaymentMethodChange('mpesa', { phoneNumber });
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setPhoneNumber(value);
        if (selectedMethod === 'mpesa') {
            onPaymentMethodChange('mpesa', { phoneNumber: value });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            {/* Header with secure checkout badge */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    Select your payment method
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Lock className="w-4 h-4" />
                    <span>Secure Checkout</span>
                </div>
            </div>

            {/* Payment method options */}
            <div className="space-y-3">
                {/* Credit / Debit card option */}
                <label
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                        selectedMethod === 'card'
                            ? 'border-[#00A699] bg-[#00A699]/5'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
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
                                <span className="font-medium text-gray-900">
                                    Credit / Debit card
                                </span>
                            </div>
                            {/* Card brand icons */}
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-gray-500">Visa</span>
                                <span className="text-xs font-semibold text-gray-500">Mastercard</span>
                                <span className="text-xs font-semibold text-gray-500">Amex</span>
                                <span className="text-xs font-semibold text-gray-500">Discover</span>
                            </div>
                        </div>
                        {selectedMethod === 'card' && (
                            <div className="mt-4">
                                {/* Stripe Elements will be placed here */}
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <p className="text-sm text-gray-500">
                                        Card details will be collected securely via Stripe.
                                    </p>
                                    {/* In a real implementation, you would embed <CardElement /> */}
                                </div>
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
            <div id="terms-section" className={`mt-4 p-3 rounded ${
                error ? 'bg-red-50 border border-red-200' : ''
            }`}>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={termsAgreed}
                        onChange={(e) => onTermsChange(e.target.checked)}
                        className={`rounded text-[#00A699] focus:ring-[#00A699] ${
                            error ? 'border-red-500' : ''
                        }`}
                    />
                    <span className={`text-gray-600 ${error ? 'text-red-700' : ''}`}>
                        I agree to the <button className="text-[#00A699] hover:underline">terms of service</button> and{' '}
                        <button className="text-[#00A699] hover:underline">rental policy</button>
                    </span>
                </label>
                {error && !termsAgreed && (
                    <p className="text-xs text-red-600 mt-1">
                        You must agree to the terms and policy.
                    </p>
                )}
            </div>
        </div>
    );
};