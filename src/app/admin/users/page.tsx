'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    User,
    Shield,
    Stethoscope,
    UserCheck,
    MoreVertical,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    Mail,
    Phone,
    Calendar,
    Filter,
    ArrowUpDown,
    Check,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserOverview {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    emailConfirmed: boolean;
    createdAt: string;
    lastLoginAt?: string;
    phoneNumber?: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserOverview | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 1
    });

    // Form state for editing
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        isActive: true
    });

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, roleFilter, statusFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getUsers({
                page: pagination.page,
                pageSize: pagination.pageSize,
                searchTerm: searchTerm,
                role: roleFilter || undefined,
                isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
            });

            if (res.success) {
                setUsers(res.data.users);
                setPagination(prev => ({
                    ...prev,
                    totalCount: res.data.pagination.totalCount,
                    totalPages: res.data.pagination.totalPages
                }));
            }
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchUsers();
    };

    const handleToggleStatus = async (user: UserOverview) => {
        try {
            const res = await adminApi.updateUserStatus(user.id, !user.isActive);
            if (res.success) {
                toast.success(res.message);
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleOpenEdit = (user: UserOverview) => {
        setEditingUser(user);
        setForm({
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber || '',
            isActive: user.isActive
        });
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsSaving(true);
        try {
            const res = await adminApi.updateUser(editingUser.id, form);
            if (res.success) {
                toast.success('User updated');
                fetchUsers();
                setShowEditModal(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsSaving(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'Admin': return <Shield className="w-4 h-4 text-purple-500" />;
            case 'Doctor': return <Stethoscope className="w-4 h-4 text-blue-500" />;
            case 'Patient': return <User className="w-4 h-4 text-green-500" />;
            default: return <User className="w-4 h-4 text-gray-500" />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'Admin': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'Doctor': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Patient': return 'bg-green-50 text-green-700 border-green-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-light text-gray-900 tracking-tight">System Users</h1>
                    <p className="text-gray-500 mt-1 font-light">Manage accounts, roles, and access permissions</p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <form onSubmit={handleSearch} className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 hover:bg-white transition-all duration-300 text-gray-700"
                        />
                    </form>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            className="px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-600 text-sm font-light min-w-[140px]"
                        >
                            <option value="">All Roles</option>
                            <option value="Admin">Administrators</option>
                            <option value="Doctor">Doctors</option>
                            <option value="Patient">Patients</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            className="px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-600 text-sm font-light min-w-[140px]"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table/List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-gray-400 font-light italic">Fetching users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-24">
                        <UserCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-light">No users found matching your criteria</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((user) => (
                                    <tr key={user.id} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-light ${user.role === 'Admin' ? 'bg-purple-100 text-purple-600' :
                                                    user.role === 'Doctor' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                                    }`}>
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs text-gray-500 font-light">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                                                {getRoleIcon(user.role)}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${user.isActive
                                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    }`}
                                            >
                                                {user.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-light">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(user)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-light">
                        Showing {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} users
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            className="px-3 py-1.5 border border-gray-100 rounded-lg text-xs font-medium text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            className="px-3 py-1.5 border border-gray-100 rounded-lg text-xs font-medium text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-gray-50 bg-gradient-to-r from-blue-50/30 to-transparent">
                                <h2 className="text-2xl font-light text-gray-900 tracking-tight">Update User Profile</h2>
                                <p className="text-gray-500 mt-1 text-sm font-light">Manage account details for {editingUser?.email}</p>
                            </div>

                            <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.firstName}
                                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-light"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.lastName}
                                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-light"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={form.phoneNumber}
                                        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-light"
                                        placeholder="+977 1234567890"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">Account Active</span>
                                        <span className="text-xs text-gray-500 font-light italic">Allow user to log in</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${form.isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 font-medium flex items-center justify-center"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Update User'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
