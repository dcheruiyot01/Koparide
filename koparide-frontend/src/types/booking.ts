// src/types/booking.types.ts

// ==================== CAR TYPES ====================

export interface CarImage {
    id: number;
    carId: number;
    url: string;
    altText: string;
    isPrimary: boolean;
    position: number;
    createdAt: string;
    updatedAt: string;
}

export interface CarOwner {
    id: number;
    name: string;
    email: string;
}

export interface Car {
    id: number;
    ownerId: number;
    make: string;
    model: string;
    year: number;
    pricePerDay: string | number;
    classification: string;
    seats: number;
    fuelType: string;
    mpg?: string | number;
    transmission?: string;
    cruiseControl?: boolean;
    cc?: number;
    location?: string;
    status: string;
    is_deleted?: boolean;
    imagesList: CarImage[];
    owner: CarOwner;
    renter?: CarOwner | null;
    rating?: number;
    trips?: number;
    // Document URLs
    insurance_url?: string | null;
    logbook_url?: string | null;
}

// ==================== BOOKING STATE (from navigation) ====================

export interface BookingState {
    totalPrice: number;
    startDate: string;      // ISO date string
    endDate: string;        // ISO date string
    days: number;
    location: string;       // pickup location
    car?: {
        id: number;
        make: string;
        model: string;
        year: number;
        pricePerDay: string;
    };
}

// ==================== PROTECTION PLAN ====================

export type ProtectionType = 'none' | 'standard' | 'enhanced';

export const PROTECTION_PRICES: Record<ProtectionType, number> = {
    none: 0,
    standard: 15.0,
    enhanced: 25.0,
};

export const PROTECTION_DESCRIPTIONS: Record<ProtectionType, string> = {
    none: 'No protection – you are responsible for all damage',
    standard: 'Standard protection – reduces your liability',
    enhanced: 'Enhanced protection – includes roadside assistance',
};

// ==================== PROMO CODE ====================

export interface PromoApplied {
    discount: number;
    code: string;
}

// ==================== PAYMENT ====================

export type PaymentMethodType = 'card' | 'mpesa';

export interface PaymentMethod {
    brand: string;
    last4: string;
    expiry: string;
    default?: boolean;
}

// ==================== RESERVATION (API response) ====================

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'failed';

export interface Reservation {
    id: number;
    carId: number;
    userId: number;
    startAt: string;          // ISO date
    endAt: string;            // ISO date
    pickupLocation?: string;
    protectionPlan?: ProtectionType;
    promoCode?: string;

    // Pricing
    subtotal: number;
    protectionCost: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    currency: string;

    // Payment
    paymentIntentId?: string;
    mpesaCheckoutId?: string;
    mpesaReceipt?: string;
    paymentError?: string;
    paymentMethod?: PaymentMethodType;
    status: ReservationStatus;

    // Timestamps
    createdAt: string;
    updatedAt: string;

    // Associations (if populated)
    car?: Car;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

// ==================== API RESPONSES ====================

export interface CreateReservationResponse {
    reservation: Reservation;
}

export interface ProcessPaymentResponse {
    success: boolean;
    payment: {
        transactionId?: string;
        checkoutRequestId?: string;
        status: string;
        amount: number;
    };
    reservationId: number;
}

// ==================== PAYMENT FORM PROPS ====================

export interface PaymentFormProps {
    paymentMethod: PaymentMethodType;
    phoneNumber: string;
    amount: number;
    onSubmit: (paymentDetails: any) => Promise<void>;
    processing: boolean;
    error: string | null;
}