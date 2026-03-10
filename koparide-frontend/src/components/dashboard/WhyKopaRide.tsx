import React, { memo, useMemo, useRef, useCallback } from "react"
import { Shield, Star, MapPin, Clock, Users, Award, ThumbsUp, HelpCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

// ==================== TYPES ====================

interface Benefit {
    icon: LucideIcon
    title: string
    description: string
    /**
     * Optional metric to display (e.g., "10K+ hosts")
     */
    metric?: string
    /**
     * Optional color variant for the icon background
     */
    variant?: 'teal' | 'blue' | 'purple' | 'amber'
}

interface WhyKoparideProps {
    /**
     * Optional custom title
     * @default "Why choose Koparide?"
     */
    title?: string
    /**
     * Optional custom description
     */
    description?: string
    /**
     * Optional custom benefits array
     */
    benefits?: Benefit[]
    /**
     * Optional CTA button text
     * @default "Get started"
     */
    ctaText?: string
    /**
     * Optional CTA link
     * @default "/signup"
     */
    ctaLink?: string
    /**
     * Optional className for additional styling
     */
    className?: string
    /**
     * Optional background color
     * @default "bg-white"
     */
    bgColor?: string
    /**
     * Show stats section
     * @default false
     */
    showStats?: boolean
    /**
     * Enable animations
     * @default true
     */
    animate?: boolean
}

// ==================== CONSTANTS ====================

const DEFAULT_BENEFITS: Benefit[] = [
    {
        icon: Shield,
        title: "Protected trips",
        description: "Rest easy knowing that liability insurance is included on every trip.",
        metric: "100% coverage",
        variant: 'teal'
    },
    {
        icon: Star,
        title: "Top-rated hosts",
        description: "Connect with a community of verified hosts who are ready to help.",
        metric: "4.9★ avg rating",
        variant: 'amber'
    },
    {
        icon: MapPin,
        title: "Cars everywhere",
        description: "Find the perfect car in your neighborhood or at the airport.",
        metric: "500+ locations",
        variant: 'blue'
    },
    {
        icon: Clock,
        title: "24/7 Support",
        description: "Get help around the clock with our dedicated customer support team.",
        metric: "Instant response",
        variant: 'purple'
    },
]

const STATS = [
    { icon: Users, value: "50K+", label: "Happy renters" },
    { icon: Award, value: "4.8★", label: "Average rating" },
    { icon: ThumbsUp, value: "95%", label: "Satisfaction rate" },
    { icon: HelpCircle, value: "24/7", label: "Customer support" },
]

const DEFAULT_TITLE = "Why choose Koparide?"
const DEFAULT_DESCRIPTION = "Skip the rental counter and book the car you want, directly from a local host. Whether it's an electric car for a city break or a 4x4 for a countryside adventure, find the perfect vehicle for your next trip."

// ==================== UTILITIES ====================

/**
 * Intersection Observer hook for scroll animations
 */
const useIntersectionObserver = (ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, {
            threshold: 0.1,
            rootMargin: '50px',
            ...options
        });

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [ref, options]);

    return isVisible;
};

/**
 * Get variant-specific styles
 */
const getVariantStyles = (variant: Benefit['variant'] = 'teal') => {
    const variants = {
        teal: {
            bg: 'bg-teal-50',
            text: 'text-[#00A699]',
            hover: 'hover:bg-teal-100'
        },
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            hover: 'hover:bg-blue-100'
        },
        purple: {
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            hover: 'hover:bg-purple-100'
        },
        amber: {
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            hover: 'hover:bg-amber-100'
        }
    };
    return variants[variant];
};

// ==================== COMPONENTS ====================

/**
 * Individual benefit card component
 */
const BenefitCard = memo(({ benefit, index, animate, isVisible }: {
    benefit: Benefit;
    index: number;
    animate: boolean;
    isVisible: boolean;
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const variant = getVariantStyles(benefit.variant);

    const animationClass = animate && isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-10';

    return (
        <div
            ref={cardRef}
            className={`bg-gray-50 rounded-xl p-6 transition-all duration-500 ${variant.hover} ${
                animate ? animationClass : ''
            }`}
            style={{ transitionDelay: animate ? `${index * 100}ms` : '0ms' }}
            role="article"
            itemScope
            itemType="https://schema.org/Service"
        >
            <div className={`w-12 h-12 ${variant.bg} rounded-full flex items-center justify-center ${variant.text} shadow-sm mb-4 group-hover:scale-110 transition-transform`}>
                <benefit.icon className="h-6 w-6" aria-hidden="true" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2" itemProp="name">
                {benefit.title}
            </h3>

            <p className="text-gray-500 text-sm leading-relaxed mb-3" itemProp="description">
                {benefit.description}
            </p>

            {benefit.metric && (
                <div className="text-xs font-semibold text-[#00A699] bg-teal-50 inline-block px-2 py-1 rounded-full">
                    {benefit.metric}
                </div>
            )}
        </div>
    );
});

BenefitCard.displayName = 'BenefitCard';

/**
 * Stats card component
 */
const StatsCard = memo(({ stat, index }: { stat: typeof STATS[0]; index: number }) => {
    return (
        <div
            className="text-center p-4 rounded-lg bg-gray-50/50"
            role="statistic"
        >
            <stat.icon className="h-6 w-6 text-[#00A699] mx-auto mb-2" aria-hidden="true" />
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
        </div>
    );
});

StatsCard.displayName = 'StatsCard';

// ==================== MAIN COMPONENT ====================

export const WhyKoparide: React.FC<WhyKoparideProps> = memo(({
                                                                 title = DEFAULT_TITLE,
                                                                 description = DEFAULT_DESCRIPTION,
                                                                 benefits = DEFAULT_BENEFITS,
                                                                 ctaText = "Get started",
                                                                 ctaLink = "/host",
                                                                 className = '',
                                                                 bgColor = 'bg-white',
                                                                 showStats = false,
                                                                 animate = true,
                                                             }) => {
    const navigate = useNavigate();
    const sectionRef = useRef<HTMLElement>(null);
    const leftContentRef = useRef<HTMLDivElement>(null);
    const isVisible = useIntersectionObserver(sectionRef, { threshold: 0.2 });
    const leftVisible = useIntersectionObserver(leftContentRef, { threshold: 0.3 });

    // Memoize benefits to prevent unnecessary re-renders
    const memoizedBenefits = useMemo(() => benefits, [benefits]);

    // Schema.org structured data for SEO
    const structuredData = useMemo(() => ({
        "@context": "https://schema.org",
        "@type": "Service",
        "name": title,
        "description": description,
        "provider": {
            "@type": "Organization",
            "name": "Koparide",
            "url": "https://koparide.com"
        },
        "areaServed": {
            "@type": "Country",
            "name": "Kenya"
        },
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Car Rental Services",
            "itemListElement": benefits.map((benefit, index) => ({
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": benefit.title,
                    "description": benefit.description
                },
                "position": index + 1
            }))
        }
    }), [title, description, benefits]);

    const handleCTAClick = useCallback(() => {
        navigate(ctaLink);
    }, [navigate, ctaLink]);

    return (
        <>
            {/* Structured data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <section
                ref={sectionRef}
                className={`py-20 ${bgColor} ${className}`}
                aria-labelledby="why-koparide-title"
                itemScope
                itemType="https://schema.org/Service"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                        {/* Left Content */}
                        <div
                            ref={leftContentRef}
                            className={`lg:col-span-5 transition-all duration-700 ${
                                animate && leftVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                            }`}
                        >
                            <h2
                                id="why-koparide-title"
                                className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"
                                itemProp="name"
                            >
                                {title}
                            </h2>

                            <p
                                className="text-lg text-gray-500 mb-8 leading-relaxed"
                                itemProp="description"
                            >
                                {description}
                            </p>

                            {/* CTA Button */}
                            <button
                                onClick={handleCTAClick}
                                className="bg-[#00A699] hover:bg-[#007A6E] text-white px-8 py-3 rounded-full font-bold transition-colors shadow-md hover:shadow-lg transform hover:scale-105 duration-200 focus:outline-none focus:ring-2 focus:ring-[#00A699] focus:ring-offset-2"
                                aria-label={ctaText}
                            >
                                {ctaText}
                            </button>

                            {/* Trust badges */}
                            <div className="mt-8 flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-white"
                                            aria-hidden="true"
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-500">
                                    <span className="font-bold text-gray-900">10K+</span> trusted hosts
                                </p>
                            </div>
                        </div>

                        {/* Right Grid */}
                        <div className="lg:col-span-7">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {memoizedBenefits.map((benefit, index) => (
                                    <BenefitCard
                                        key={benefit.title}
                                        benefit={benefit}
                                        index={index}
                                        animate={animate}
                                        isVisible={isVisible}
                                    />
                                ))}
                            </div>

                            {/* Stats Section (Optional) */}
                            {showStats && (
                                <div
                                    className={`mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-700 delay-500 ${
                                        animate && isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                    }`}
                                >
                                    {STATS.map((stat, index) => (
                                        <StatsCard key={stat.label} stat={stat} index={index} />
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Security badges (optional) */}
                    <div className="mt-16 pt-8 border-t border-gray-100">
                        <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400">
                            <span className="text-sm flex items-center gap-2">
                                <Shield className="h-4 w-4" /> SSL Secured
                            </span>
                            <span className="text-sm flex items-center gap-2">
                                <Award className="h-4 w-4" /> Verified Hosts
                            </span>
                            <span className="text-sm flex items-center gap-2">
                                <ThumbsUp className="h-4 w-4" /> Money-back Guarantee
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
});

WhyKoparide.displayName = 'WhyKoparide';

// ==================== DEFAULT EXPORT ====================

export default WhyKoparide;