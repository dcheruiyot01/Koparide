import React from "react"
import { Search, Key, Car } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Step {
    icon: LucideIcon
    title: string
    description: string
}

export const HowItWorks = () => {
    const steps: Step[] = [
        {
            icon: Search,
            title: "Find the perfect car",
            description:
                "Enter a location and date and browse thousands of cars shared by local hosts.",
        },
        {
            icon: Key,
            title: "Book your trip",
            description:
                "Book on the app or online, choose protection plans, and say hello to your host.",
        },
        {
            icon: Car,
            title: "Hit the road",
            description:
                "Have the car delivered or pick it up from your host. Check in with the app, grab the keys, and head out.",
        },
    ]

    return (
        <section id="how-it-works" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        How it works
                    </h2>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Drive the perfect car for your next adventure in three easy steps.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {steps.map((step, index) => (
                        <div
                            key={step.title}
                            className="flex flex-col items-center text-center group"
                        >
                            <div className="relative mb-6">
                                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-[#00A699] group-hover:scale-110 transition-transform duration-300">
                                    <step.icon className="h-10 w-10" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#00A699] text-white rounded-full flex items-center justify-center font-bold border-2 border-white">
                                    {index + 1}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {step.title}
                            </h3>
                            <p className="text-gray-500 leading-relaxed max-w-xs">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
