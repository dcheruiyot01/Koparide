import React, { useEffect, useRef } from "react";

/**
 * LocationSearch Component
 *
 * Wraps Google Maps Place Autocomplete Web Component (`PlaceAutocompleteElement`)
 * and exposes a simple `onSelect(address)` callback when the user chooses a location.
 *
 * Notes:
 * - Uses refs to avoid re‑initializing the Google component on every render.
 * - Ensures cleanup on unmount to prevent memory leaks.
 * - Extracts selected text from multiple possible event shapes (Google’s API is inconsistent).
 */
export const LocationSearch = ({
                                   onSelect,
                               }: {
    onSelect?: (address: string) => void;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);
    const onSelectRef = useRef(onSelect);

    // Keep latest callback without reinitializing autocomplete
    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Prevent duplicate initialization (especially in React Strict Mode)
        if (initializedRef.current && container.children.length > 0) return;
        initializedRef.current = true;

        const initAutocomplete = async () => {
            try {
                const placesLib = (await google.maps.importLibrary("places")) as any;
                const { PlaceAutocompleteElement } = placesLib;

                // Only create autocomplete element once
                if (container.children.length === 0) {
                    const autocompleteEl = new PlaceAutocompleteElement();
                    autocompleteEl.setAttribute("placeholder", "Enter pickup location");
                    autocompleteEl.setAttribute("country", "KE");

                    autocompleteEl.addEventListener("gmp-select", (e: any) => {
                        const callback = onSelectRef.current;
                        if (!callback) return;

                        // Method 1: placePrediction (most reliable)
                        if (e.placePrediction) {
                            const main = e.placePrediction.mainText?.text;
                            const secondary = e.placePrediction.secondaryText?.text;

                            if (main && secondary) {
                                callback(`${main}, ${secondary}`);
                                return;
                            }
                            if (main) {
                                callback(main);
                                return;
                            }
                        }

                        // Method 2: text property
                        if (e.text) {
                            callback(e.text);
                            return;
                        }

                        // Method 3: fallback to Ql (typed text)
                        if (e.Ql) {
                            callback(e.Ql);
                        }
                    });

                    container.appendChild(autocompleteEl);
                }
            } catch (error) {
                // In production, you may want to report this to monitoring tools
                console.error("Failed to initialize autocomplete:", error);
            }
        };

        initAutocomplete();

        // Cleanup on unmount
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
            initializedRef.current = false;
        };
    }, []);

    return <div ref={containerRef} className="w-full" />;
};
