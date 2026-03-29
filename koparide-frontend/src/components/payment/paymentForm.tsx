import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentFormProps {
    paymentMethod: 'card' | 'mpesa';
    phoneNumber: string;
    amount: number;
    onSubmit: (paymentDetails: any) => Promise<void>;
    processing: boolean;
    error: string | null;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
                                                     paymentMethod,
                                                     phoneNumber,
                                                     amount,
                                                     onSubmit,
                                                     processing,
                                                     error,
                                                 }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [localError, setLocalError] = useState<string | null>(null);

    const handleCardPayment = async () => {
        if (!stripe || !elements) {
            throw new Error('Stripe not initialized');
        }
        const cardElement = elements.getElement(CardElement);
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement!,
        });
        if (error) throw new Error(error.message);
        return { paymentMethodId: paymentMethod.id };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        try {
            let paymentDetails;
            if (paymentMethod === 'card') {
                paymentDetails = await handleCardPayment();
            } else {
                // Validate phone number
                if (!/^254[0-9]{9}$/.test(phoneNumber)) {
                    throw new Error('Please enter a valid M‑Pesa number (254XXXXXXXXX)');
                }
                paymentDetails = { phoneNumber };
            }
            await onSubmit(paymentDetails);
        } catch (err: any) {
            setLocalError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {paymentMethod === 'card' && (
                <div className="p-4 border rounded-lg bg-white">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': { color: '#aab7c4' },
                                },
                            },
                        }}
                    />
                </div>
            )}

            {(error || localError) && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error || localError}
                </div>
            )}

            <button
                type="submit"
                disabled={processing || (paymentMethod === 'card' && !stripe)}
                className="w-full bg-[#00A699] text-white py-3 rounded-lg font-semibold hover:bg-[#007A6E] disabled:opacity-50 transition"
            >
                {processing ? 'Processing...' : `Pay Ksh ${amount.toLocaleString()}`}
            </button>
        </form>
    );
};

export default PaymentForm;