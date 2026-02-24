import React, { useState } from "react"
import { Search, MapPin, Calendar, Car, ChevronDown } from "lucide-react"

export const HeroSection = () => {
    const [location, setLocation] = useState<string>("")
    const [pickupDate, setPickupDate] = useState<string>("")
    const [returnDate, setReturnDate] = useState<string>("")
    const [carType, setCarType] = useState<string>("Any type")

    return (
        <div className="relative min-h-[600px] w-full flex items-center justify-center">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80"
                    alt="Road trip"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center pt-20">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-4 tracking-tight">
                    Find your perfect ride
                </h1>

                <p className="text-lg md:text-xl text-white/90 text-center mb-10 max-w-2xl">
                    Rent unique cars from local hosts. Wherever you want to go.
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-2 md:p-3">
                    <div className="flex flex-col md:flex-row md:items-center">

                        {/* Location */}
                        <div className="flex-1 p-2 md:border-r border-gray-100 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                Where
                            </label>
                            <div className="flex items-center">
                                <MapPin className="h-5 w-5 text-gray-400 absolute left-3" />
                                <input
                                    type="text"
                                    placeholder="City, airport, or address"
                                    className="w-full pl-8 pr-4 py-1 text-gray-900 font-medium placeholder-gray-400 focus:outline-none bg-transparent"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Pickup Date */}
                        <div className="flex-1 p-2 md:border-r border-gray-100 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                From
                            </label>
                            <div className="flex items-center">
                                <Calendar className="h-5 w-5 text-gray-400 absolute left-3" />
                                <input
                                    type="date"
                                    className="w-full pl-8 pr-4 py-1 text-gray-900 font-medium focus:outline-none bg-transparent"
                                    value={pickupDate}
                                    onChange={(e) => setPickupDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Return Date */}
                        <div className="flex-1 p-2 md:border-r border-gray-100 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                To
                            </label>
                            <div className="flex items-center">
                                <Calendar className="h-5 w-5 text-gray-400 absolute left-3" />
                                <input
                                    type="date"
                                    className="w-full pl-8 pr-4 py-1 text-gray-900 font-medium focus:outline-none bg-transparent"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Car Type */}
                        <div className="flex-1 p-2 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-8">
                                Type
                            </label>
                            <div className="flex items-center relative">
                                <Car className="h-5 w-5 text-gray-400 absolute left-3" />
                                <select
                                    className="w-full pl-8 pr-8 py-1 text-gray-900 font-medium focus:outline-none bg-transparent appearance-none cursor-pointer"
                                    value={carType}
                                    onChange={(e) => setCarType(e.target.value)}
                                >
                                    <option>Any type</option>
                                    <option>SUV</option>
                                    <option>Sedan</option>
                                    <option>Sports</option>
                                    <option>Electric</option>
                                    <option>Truck</option>
                                </select>
                                <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 pointer-events-none" />
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="p-2">
                            <button className="w-full md:w-auto bg-[#00A699] hover:bg-[#007A6E] text-white rounded-xl px-8 py-3 font-bold transition-colors flex items-center justify-center shadow-md">
                                <Search className="h-5 w-5 mr-2 md:hidden" />
                                <span>Search</span>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
