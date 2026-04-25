// pages/admin/UsersManagement.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Navbar } from '../../layout/NavBar';
import { Footer } from '../../layout/Footer';
import { Trash2, User as UserIcon, Car, ExternalLink } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'renter' | 'host' | 'admin';
    createdAt: string;
    carCount: number;
    Profile?: {
        id: string | null;
        firstName?: string;
        lastName?: string;
        address?: string;
        nationalIdNumber: string | null;
        driversLicenseNumber: string | null;
        driversLicenseExpiry: string | null;
    } | null;
}

export const UsersManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingRole, setUpdatingRole] = useState<number | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/admin/users');
            setUsers(res.data.users);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            setUpdatingRole(userId);
            await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
            await fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update role');
        } finally {
            setUpdatingRole(null);
        }
    };

    const deleteUser = async (id: number) => {
        if (!confirm('Delete this user permanently? All associated cars and reservations will also be deleted.')) return;
        try {
            await api.delete(`/api/admin/users/${id}`);
            await fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete user');
        }
    };

    if (loading) return <div className="text-center py-12">Loading users...</div>;
    if (error) return <div className="text-red-600 text-center py-12">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <h1 className="text-2xl font-bold mb-6">Manage Users</h1>
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">National ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver's License</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cars</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <Link
                                                to={`/admin/users/${user.id}/profile`}
                                                className="font-medium text-gray-900 hover:text-[#00A699] hover:underline flex items-center gap-1"
                                            >
                                                {user.name}
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {user.Profile?.firstName || <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {user.Profile?.lastName || <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {user.Profile?.address || <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {user.Profile?.nationalIdNumber || <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-6 py-4">
                                    {user.Profile?.driversLicenseNumber ? (
                                        <div>
                                            <div className="text-sm text-gray-700">{user.Profile.driversLicenseNumber}</div>
                                            {user.Profile.driversLicenseExpiry && (
                                                <div className="text-xs text-gray-500">
                                                    Expires: {new Date(user.Profile.driversLicenseExpiry).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Car className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{user.carCount ?? 0}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        disabled={updatingRole === user.id}
                                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-[#00A699] focus:border-[#00A699] disabled:opacity-50"
                                    >
                                        <option value="renter">Renter</option>
                                        <option value="host">Host</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="text-gray-600 hover:text-red-600 transition"
                                        title="Delete user"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
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