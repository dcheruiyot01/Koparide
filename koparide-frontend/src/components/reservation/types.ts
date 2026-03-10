export type ProtectionType = "none" | "standard" | "enhanced";
export type RateType = "nonrefundable" | "refundable";

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

export interface Owner {
    id: number;
    name: string;
    email: string;
    createdAt?: string;
    defaultProfile?: string;
}

export interface Car {
    id: number;
    ownerId: number;
    make: string;
    model: string;
    year: number;
    pricePerDay: string;
    classification: string;
    fuelType: string;
    status: string;
    rented_to: number | null;
    imagesList: CarImage[];
    owner: Owner;
    renter: Owner | null;
    rating?: number;
    trips?: number;
}

export interface BookingState {
    totalPrice: number;
    startDate: string;
    endDate: string;
    days: number;
    location: string;
    car?: {
        id: number;
        make: string;
        model: string;
        year: number;
        pricePerDay: string;
    };
}

export interface PromoApplied {
    discount: number;
    code: string;
}

export interface PaymentMethod {
    brand: string;
    last4: string;
    expiry: string;
    default: boolean;
}

export const PROTECTION_PRICES: Record<ProtectionType, number> = {
    none: 0,
    standard: 500,
    enhanced: 1000,
};

export const PROTECTION_DESCRIPTIONS: Record<ProtectionType, string> = {
    none: "You are responsible for all damage",
    standard: "Reduces your liability with basic coverage",
    enhanced: "Full coverage with roadside assistance and towing",
};

export const TAX_RATE = 0;
export const DEFAULT_CAR_IMAGE = "https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=764&q=80";