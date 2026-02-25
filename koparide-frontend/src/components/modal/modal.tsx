// src/components/Modal.tsx
import React from "react"

export const Modal = ({ open, onClose, children }) => {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal content */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
                {children}
            </div>
        </div>
    )
}
