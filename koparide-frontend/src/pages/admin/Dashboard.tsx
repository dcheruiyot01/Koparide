// pages/admin/Dashboard.tsx
import { Link } from 'react-router-dom';
import { Car, Users } from 'lucide-react';
import { Navbar } from '../../layout/NavBar';
import { Footer } from '../../layout/Footer';

export const AdminDashboard = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/admin/cars" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
                        <Car className="h-12 w-12 text-[#00A699] mb-4" />
                        <h2 className="text-xl font-semibold">Manage Cars</h2>
                        <p className="text-gray-500">Approve, reject or delete car listings</p>
                    </Link>
                    <Link to="/admin/users" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
                        <Users className="h-12 w-12 text-[#00A699] mb-4" />
                        <h2 className="text-xl font-semibold">Manage Users</h2>
                        <p className="text-gray-500">Change user roles, delete accounts</p>
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
};