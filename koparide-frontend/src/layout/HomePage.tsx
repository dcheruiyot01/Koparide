import React from 'react'
import { Navbar } from './NavBar'
import { HeroSection } from '../components/dashboard/HeroSection'
import { HowItWorks } from '../components/dashboard/HowItWorks'
import { FeaturedCars } from '../components/dashboard/FeaturedCars'
import { WhyKoparide } from '../components/dashboard/WhyKopaRide'
import { Footer } from './Footer'
export const HomePage = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                <HeroSection />
                <HowItWorks />
                <FeaturedCars />
                <WhyKoparide />
            </main>
            <Footer />
        </div>
    )
}
