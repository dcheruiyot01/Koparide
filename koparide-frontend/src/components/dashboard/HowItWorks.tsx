import React, { memo, useMemo } from "react"
import { Search, Key, Car } from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ==================== TYPES ====================

interface Step {
    icon: LucideIcon
    title: string
    description: string
}

interface HowItWorksProps {
    /**
     * Optional custom title for the section
     * @default "How it works"
     */
    title?: string
    /**
     * Optional custom subtitle
     * @default "Drive the perfect car for your next adventure in three easy steps."
     */
    subtitle?: string
    /**
     * Optional custom steps array
     */
    steps?: Step[]
    /**
     * Optional className for additional styling
     */
    className?: string
    /**
     * Optional background color class
     * @default "bg-white"
     */
    bgColor?: string
    /**
     * Enable animations
     * @default true
     */
    animate?: boolean
}

// ==================== CONSTANTS ====================

const DEFAULT_STEPS: Step[] = [
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

const DEFAULT_TITLE = "How it works"
const DEFAULT_SUBTITLE = "Drive the perfect car for your next adventure in three easy steps."

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

// ==================== COMPONENTS ====================

/**
 * Individual step card component
 */
const StepCard = memo(({ step, index, animate }: { step: Step; index: number; animate: boolean }) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const isVisible = useIntersectionObserver(cardRef);

    const animationClass = animate && isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-10';

    return (
        <div
            ref={cardRef}
            className={`flex flex-col items-center text-center group transition-all duration-700 ${
                animate ? animationClass : ''
            }`}
            style={{ transitionDelay: animate ? `${index * 150}ms` : '0ms' }}
            role="listitem"
        >
            <div className="relative mb-6">
                {/* Icon circle */}
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-[#00A699] group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg">
                    <step.icon className="h-10 w-10" aria-hidden="true" />
                </div>

                {/* Step number badge */}
                <div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-[#00A699] text-white rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md"
                    aria-label={`Step ${index + 1}`}
                >
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
    );
});

StepCard.displayName = 'StepCard';

// ==================== MAIN COMPONENT ====================

export const HowItWorks: React.FC<HowItWorksProps> = memo(({
                                                               title = DEFAULT_TITLE,
                                                               subtitle = DEFAULT_SUBTITLE,
                                                               steps = DEFAULT_STEPS,
                                                               className = '',
                                                               bgColor = 'bg-white',
                                                               animate = true,
                                                           }) => {
    const sectionRef = React.useRef<HTMLElement>(null);
    const isVisible = useIntersectionObserver(sectionRef, { threshold: 0.2 });

    // Memoize steps to prevent unnecessary re-renders
    const memoizedSteps = useMemo(() => steps, [steps]);

    // Schema.org structured data for SEO
    const structuredData = useMemo(() => ({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": title,
        "description": subtitle,
        "step": steps.map((step, index) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "name": step.title,
            "text": step.description
        }))
    }), [title, subtitle, steps]);

    return (
        <>
            {/* Structured data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <section
                id="how-it-works"
                ref={sectionRef}
                className={`py-20 ${bgColor} ${className}`}
                aria-labelledby="how-it-works-title"
                itemScope
                itemType="https://schema.org/HowTo"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div
                        className={`text-center mb-16 transition-all duration-700 ${
                            animate && isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}
                    >
                        <h2
                            id="how-it-works-title"
                            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                            itemProp="name"
                        >
                            {title}
                        </h2>
                        <p
                            className="text-xl text-gray-500 max-w-2xl mx-auto"
                            itemProp="description"
                        >
                            {subtitle}
                        </p>
                    </div>

                    {/* Steps Grid */}
                    <div
                        className="grid grid-cols-1 md:grid-cols-3 gap-12"
                        role="list"
                        aria-label="How it works steps"
                    >
                        {memoizedSteps.map((step, index) => (
                            <StepCard
                                key={step.title}
                                step={step}
                                index={index}
                                animate={animate}
                            />
                        ))}
                    </div>

                    {/* Quick stats for trust signals (optional) */}
                    <div className="mt-16 pt-8 border-t border-gray-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div>
                                <div className="text-2xl font-bold text-[#00A699]">10K+</div>
                                <div className="text-sm text-gray-500">Active Listings</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-[#00A699]">50K+</div>
                                <div className="text-sm text-gray-500">Happy Renters</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-[#00A699]">4.8★</div>
                                <div className="text-sm text-gray-500">Average Rating</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-[#00A699]">24/7</div>
                                <div className="text-sm text-gray-500">Support</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
});

HowItWorks.displayName = 'HowItWorks';

// ==================== DEFAULT EXPORT ====================

export default HowItWorks;