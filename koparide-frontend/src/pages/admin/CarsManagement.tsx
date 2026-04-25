import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Navbar } from '../../layout/NavBar';
import { Footer } from '../../layout/Footer';
import { CheckCircle, XCircle, Trash2, RefreshCw, FileText } from 'lucide-react';

interface Car {
    id: number;
    make: string;
    model: string;
    year: number;
    pricePerDay: string;
    status: string;
    owner: { name: string; email: string };
    createdAt: string;
    logbook_url?: string | null;
    insurance_url?: string | null;
}

export const CarsManagement: React.FC = () => {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCars = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/admin/cars');
            setCars(res.data.cars);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load cars');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            await api.put(`/api/admin/cars/${id}/approve`);
            await fetchCars();
        } catch (err) {
            alert('Failed to approve car');
        }
    };

    const handleReject = async (id: number) => {
        try {
            await api.put(`/api/admin/cars/${id}/reject`);
            await fetchCars();
        } catch (err) {
            alert('Failed to reject car');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Permanently delete this car? This action cannot be undone.')) return;
        try {
            await api.delete(`/api/admin/cars/${id}`);
            await fetchCars();
        } catch (err) {
            alert('Failed to delete car');
        }
    };

    if (loading) return <div>Loading cars...</div>;
    if (error) return <div className="text-red-600">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <h1 className="text-2xl font-bold mb-6">Manage Car Listings</h1>
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Car</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/day</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logbook</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {cars.map(car => (
                            <tr key={car.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{car.make} {car.model} ({car.year})</td>
                                <td className="px-6 py-4 whitespace-nowrap">{car.owner.name}<br/><span className="text-xs text-gray-500">{car.owner.email}</span></td>
                                <td className="px-6 py-4">Ksh {Number(car.pricePerDay).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    {car.logbook_url ? (
                                        <a href={car.logbook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                            <FileText className="w-4 h-4" /> View
                                        </a>
                                    ) : <span className="text-gray-400 text-sm">Not uploaded</span>}
                                </td>
                                <td className="px-6 py-4">
                                    {car.insurance_url ? (
                                        <a href={car.insurance_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                            <FileText className="w-4 h-4" /> View
                                        </a>
                                    ) : <span className="text-gray-400 text-sm">Not uploaded</span>}
                                </td>
                                <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            car.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                car.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                        }`}>{car.status}</span>
                                </td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => handleApprove(car.id)} className="text-green-600 hover:text-green-800"><CheckCircle className="w-5 h-5" /></button>
                                    <button onClick={() => handleReject(car.id)} className="text-red-600 hover:text-red-800"><XCircle className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(car.id)} className="text-gray-600 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </main>
            <Footer />
        </div>
    );
};