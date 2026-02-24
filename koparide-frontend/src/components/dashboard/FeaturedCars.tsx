// src/components/FeaturedCars.tsx
import React from "react"
import { Star, MapPin, Heart } from "lucide-react"

export interface CarProps {
    id: number
    name: string
    price: number
    rating: number
    trips: number
    location: string
    image: string
    hostInitials: string
}

interface FeaturedCarsProps {
    cars?: CarProps[]   // optional so you can pass API data later
    title?: string
}

const defaultCars: CarProps[] = [
    {
        id: 1,
        name: "Tesla Model 3 2022",
        price: 89,
        rating: 4.9,
        trips: 142,
        location: "San Francisco, CA",
        image:
            "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80",
        hostInitials: "JD",
    },
    {
        id: 2,
        name: "BMW 3 Series 2021",
        price: 95,
        rating: 4.8,
        trips: 89,
        location: "Los Angeles, CA",
        image:
            "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80",
        hostInitials: "AS",
    },
    {
        id: 3,
        name: "Toyota RAV4 2020",
        price: 65,
        rating: 4.7,
        trips: 215,
        location: "Seattle, WA",
        image:
            "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80",
        hostInitials: "MK",
    },
    {
        id: 4,
        name: "Ford Mustang 2021",
        price: 110,
        rating: 4.9,
        trips: 76,
        location: "Miami, FL",
        image:
            "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=400&q=80",
        hostInitials: "RJ",
    },
]
export const FeaturedCars = ({cars = defaultCars, title = "Featured cars near you",}: FeaturedCarsProps): JSX.Element => {
return (
        <section className="py-20 bg-[#F7F7F7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex justify-between items-end mb-10">
                    <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
                    <a
                        href="#"
                        className="text-[#00A699] font-semibold hover:text-[#007A6E] transition-colors"
                    >
                        View all
                    </a>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cars.map((car) => (
                        <div
                            key={car.id}
                            className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer group"
                        >
                            {/* Image */}
                            <div className="relative h-48 bg-gray-200">
                                <img
                                    src={car.image}
                                    alt={car.name}
                                    className="w-full h-full object-cover"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                {/* Favorite */}
                                <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors z-10">
                                    <Heart className="h-4 w-4 text-gray-600" />
                                </button>

                                {/* Badge */}
                                <div className="absolute bottom-3 left-3 bg-[#00A699] text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                                    INSTANT BOOK
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900 truncate pr-2">
                                        {car.name}
                                    </h3>
                                    <div className="flex items-baseline whitespace-nowrap">
                                        <span className="font-bold text-gray-900">${car.price}</span>
                                        <span className="text-gray-500 text-sm ml-1">/day</span>
                                    </div>
                                </div>

                                <div className="flex items-center text-gray-500 text-sm mb-4">
                                    <MapPin className="h-3 w-3 text-[#00A699] mr-1" />
                                    <span className="truncate">{car.location}</span>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <div className="flex items-center">
                                        <Star className="h-4 w-4 text-[#00A699] fill-current" />
                                        <span className="font-bold text-gray-900 ml-1">
                      {car.rating}
                    </span>
                                        <span className="text-gray-500 text-sm ml-1">
                      ({car.trips} trips)
                    </span>
                                    </div>

                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        {car.hostInitials}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}