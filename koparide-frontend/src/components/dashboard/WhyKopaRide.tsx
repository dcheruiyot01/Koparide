// src/components/WhyKoparide.tsx
import { Shield, Star, MapPin, Clock } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Benefit {
    icon: LucideIcon
    title: string
    description: string
}

export const WhyKoparide = () => {
    const benefits: Benefit[] = [
        {
            icon: Shield,
            title: "Protected trips",
            description:
                "Rest easy knowing that liability insurance is included on every trip.",
        },
        {
            icon: Star,
            title: "Top-rated hosts",
            description:
                "Connect with a community of verified hosts who are ready to help.",
        },
        {
            icon: MapPin,
            title: "Cars everywhere",
            description:
                "Find the perfect car in your neighborhood or at the airport.",
        },
        {
            icon: Clock,
            title: "24/7 Support",
            description:
                "Get help around the clock with our dedicated customer support team.",
        },
    ]

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                    {/* Left Content */}
                    <div className="lg:col-span-5">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                            Why choose Koparide?
                        </h2>
                        <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                            Skip the rental counter and book the car you want, directly from a
                            local host. Whether it's an electric car for a city break or a 4x4
                            for a countryside adventure, find the perfect vehicle for your
                            next trip.
                        </p>
                        <button className="bg-[#00A699] hover:bg-[#007A6E] text-white px-8 py-3 rounded-full font-bold transition-colors shadow-md">
                            Get started
                        </button>
                    </div>

                    {/* Right Grid */}
                    <div className="lg:col-span-7">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {benefits.map((benefit) => (
                                <div
                                    key={benefit.title}
                                    className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-300"
                                >
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#00A699] shadow-sm mb-4">
                                        <benefit.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
