import React from "react"
import { Car, Twitter, Instagram, Facebook } from "lucide-react"

export const Footer = () => {
    return (
        <footer className="bg-[#1A1A1A] text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Top Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* Brand */}
                    <div className="space-y-6">
                        <div className="flex items-center">
                            <Car className="h-8 w-8 text-[#00A699]" />
                            <span className="ml-2 text-xl font-bold text-white">Wheelaway</span>
                        </div>

                        <p className="text-gray-400 text-sm">
                            Find the perfect car for your next adventure. Rent from local hosts in your area.
                        </p>

                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Explore */}
                    <div>
                        <h3 className="text-lg font-bold mb-6">Explore</h3>
                        <ul className="space-y-4">
                            {["Search cars", "How it works", "Become a host", "Trust & Safety"].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-lg font-bold mb-6">Company</h3>
                        <ul className="space-y-4">
                            {["About us", "Careers", "Press", "Blog"].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-bold mb-6">Support</h3>
                        <ul className="space-y-4">
                            {["Help center", "Terms of service", "Privacy policy", "Cookie policy"].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-500 text-sm mb-4 md:mb-0">
                        © {new Date().getFullYear()} Koparide. All rights reserved.
                    </p>

                    <div className="flex space-x-6">
                        {["Privacy", "Terms", "Sitemap"].map((item) => (
                            <a
                                key={item}
                                href="#"
                                className="text-gray-500 hover:text-white text-sm transition-colors"
                            >
                                {item}
                            </a>
                        ))}
                    </div>
                </div>

            </div>
        </footer>
    )
}
