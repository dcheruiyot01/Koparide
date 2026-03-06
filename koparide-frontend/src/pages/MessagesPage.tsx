import React, { useState } from "react";
import { Navbar } from "../layout/NavBar";
import { Footer } from "../layout/Footer";
import { Bell, Mail, ChevronDown, ChevronUp, Check } from "lucide-react";

export const MessagesNotificationsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"messages" | "notifications">("messages");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Mock data — replace with API data in production
    const messages = [
        { id: 1, sender: "John Doe", subject: "Booking Inquiry", body: "Hi, I’d like to rent the Corolla for next week. Can you confirm availability?" },
        { id: 2, sender: "Jane Smith", subject: "Payment Confirmation", body: "Your payment for the Tesla Model 3 has been received. Thank you!" },
    ];

    const notifications = [
        { id: 1, title: "Booking Approved", detail: "Your booking for Tesla Model 3 was approved." },
        { id: 2, title: "New Message", detail: "You have a new message from Jane Smith." },
    ];

    const currentList = activeTab === "messages" ? messages : notifications;

    const toggleExpand = (id: number) => setExpandedId(expandedId === id ? null : id);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Centered narrow column to match screenshot style */}
            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                {/* Tabs: compact, centered, bold active state, only bottom border */}
                <div className="flex justify-center items-center gap-6 mb-6">
                    <button
                        onClick={() => { setActiveTab("messages"); setExpandedId(null); }}
                        aria-pressed={activeTab === "messages"}
                        className={`flex items-center gap-2 px-5 py-2 text-base rounded-md focus:outline-none ${
                            activeTab === "messages"
                                ? "font-bold text-[#00a699] border-b-4 border-[#00a699]"
                                : "font-medium text-gray-500"
                        }`}
                    >
                        <Mail className="w-5 h-5" />
                        Messages
                        {activeTab === "messages" && <Check className="w-4 h-4 text-[#00a699]" />}
                    </button>

                    <button
                        onClick={() => { setActiveTab("notifications"); setExpandedId(null); }}
                        aria-pressed={activeTab === "notifications"}
                        className={`flex items-center gap-2 px-5 py-2 text-base rounded-md focus:outline-none ${
                            activeTab === "notifications"
                                ? "font-bold text-[#00a699] border-b-4 border-[#00a699]"
                                : "font-medium text-gray-500"
                        }`}
                    >
                        <Bell className="w-5 h-5" />
                        Notifications
                        {activeTab === "notifications" && <Check className="w-4 h-4 text-[#00a699]" />}
                    </button>
                </div>

                {/* Optional page heading that mirrors the active tab */}
                <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                    {activeTab === "messages" ? "Messages" : "Notifications"}
                </h1>

                {/* Content: no list dots, no dotted borders */}
                {currentList.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[#00a699]/10 flex items-center justify-center">
                            {activeTab === "messages" ? <Mail className="w-8 h-8 text-[#00a699]" /> : <Bell className="w-8 h-8 text-[#00a699]" />}
                        </div>
                        <h2 className="text-lg font-semibold">No {activeTab === "messages" ? "messages" : "notifications"}</h2>
                        <p className="text-gray-500 text-sm">This is where you can see your {activeTab}.</p>
                    </div>
                ) : (
                    <ul className="space-y-3 list-none p-0 m-0">
                        {currentList.map((item) => (
                            <li
                                key={item.id}
                                // Clean card: no dotted lines, no list markers
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
                                onClick={() => toggleExpand(item.id)}
                                role="button"
                                aria-expanded={expandedId === item.id}
                            >
                                {/* Row content */}
                                <div className="px-4 py-3 flex items-start justify-between">
                                    <div className="min-w-0">
                                        {activeTab === "messages" ? (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900 truncate">{item.sender}</span>
                                                </div>
                                                <p className={`text-sm mt-1 truncate ${expandedId === item.id ? "text-[#00a699]" : "text-gray-700"}`}>
                                                    {item.subject}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-sm font-medium text-gray-900">{item.title}</span>
                                                <p className="text-sm text-gray-600 mt-1">{item.detail}</p>
                                            </>
                                        )}
                                    </div>

                                    {/* Chevron */}
                                    <div className="ml-4 flex-shrink-0 flex items-center">
                                        {expandedId === item.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded content: subtle solid divider (not dotted) */}
                                {activeTab === "messages" && expandedId === item.id && (
                                    <div className="px-4 pb-4 pt-0 border-t border-gray-100 text-sm text-gray-700">
                                        {item.body}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </main>

            <Footer />
        </div>
    );
};
