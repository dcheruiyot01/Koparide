// utils/carNormalizer.ts
import type { HostCar } from '../types/car.ts';

// Define the expected shape from the API (adjust fields as needed)
export interface ApiCar {
    id: string | number;
    ownerId: string | number;
    make: string;
    model: string;
    year?: number;
    classification?: string;
    seats?: number;
    fuelType?: string;
    cc?: number;
    mpg?: number;
    pricePerDay: string | number;
    driverFeePerDay?: string | number;   // new field
    rentalType?: 'self_drive' | 'with_driver'; // new field
    otherRules?: string;                  // new field
    termsAccepted?: boolean;              // new field
    location?: string;
    status?: string;
    insurance_url: string | null;
    logbook_url: string | null;
    imagesList?: string[];
    owner?: any;
    renter?: any;
    is_deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    rating?: number;
    trips?: number;
}

export function normalizeCar(apiCar: ApiCar): HostCar {
    return {
        id: apiCar.id,
        ownerId: apiCar.ownerId,
        make: apiCar.make,
        model: apiCar.model,
        year: apiCar.year ?? new Date().getFullYear(),
        classification: apiCar.classification ?? 'Unknown',
        seats: apiCar.seats,
        fuelType: apiCar.fuelType,
        cc: apiCar.cc,
        mpg: apiCar.mpg,
        pricePerDay: typeof apiCar.pricePerDay === 'string'
            ? parseFloat(apiCar.pricePerDay)
            : apiCar.pricePerDay ?? 0,
        driverFeePerDay: apiCar.driverFeePerDay !== undefined
            ? (typeof apiCar.driverFeePerDay === 'string'
                ? parseFloat(apiCar.driverFeePerDay)
                : apiCar.driverFeePerDay)
            : 0,
        rentalType: apiCar.rentalType || 'self_drive',
        otherRules: apiCar.otherRules || '',
        termsAccepted: apiCar.termsAccepted || false,
        location: apiCar.location,
        status: apiCar.status,
        logbook_url: apiCar.logbook_url,
        insurance_url: apiCar.insurance_url,
        imagesList: apiCar.imagesList ?? [],
        owner: apiCar.owner,
        renter: apiCar.renter,
        is_deleted: apiCar.is_deleted,
        createdAt: apiCar.createdAt,
        updatedAt: apiCar.updatedAt,
        rating: apiCar.rating ?? 0,
        trips: apiCar.trips ?? 0,
    };
}