export interface Car {
    name: string;
    id: number;
    ownerId: number;
    make: string;
    model: string;
    year: number;
    pricePerDay: string; // or number if you cast it
    classification: string;
    seats: number;
    fuelType: string;
    mpg: string;
    location: string;
    transmission: string;
    cruiseControl: boolean;
    cc: number;
    status: string;
    is_deleted: boolean;
    rented_to: number | null;
    createdAt: string;
    updatedAt: string;

    // Associations
    imagesList: {
        id: number;
        carId: number;
        url: string;
        altText: string;
        isPrimary: boolean;
        position: number;
        createdAt: string;
        updatedAt: string;
    }[];

    owner: {
        id: number;
        name: string;
        email: string;
    };

    renter: {
        id: number;
        name: string;
        email: string;
    } | null;
}
