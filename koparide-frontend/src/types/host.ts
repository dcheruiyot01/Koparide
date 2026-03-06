export interface HostCar {
    id: string
    name: string
    year: number
    make: string
    model: string
    price: number
    location: string
    image: string
    rating: number
    trips: number
    status: 'active' | 'inactive'
    description?: string
    transmission?: string
    seats?: number
    fuelType?: string
}