import React, { useEffect, useRef } from "react";

export const LocationSearch = ({ onSelect }: { onSelect?: (place: any) => void }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            // Clear any previous children
            ref.current.innerHTML = "";
            const autocompleteEl = document.createElement("gmp-place-autocomplete");
            autocompleteEl.setAttribute("placeholder", "Enter pickup location");
            autocompleteEl.setAttribute("country", "KE"); // restrict to Kenya

            // Listen for place selection
            autocompleteEl.addEventListener("gmp-place-autocomplete-select", (e: any) => {
                const place = e.detail;
                console.log("Selected place:", place);
                if (onSelect) onSelect(place);
            });

            ref.current.appendChild(autocompleteEl);
        }
    }, [onSelect]);

    return <div ref={ref} className="w-full" />;
};

