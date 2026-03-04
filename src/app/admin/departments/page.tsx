'use client';

import React, { useState, useEffect } from 'react';
import { departmentApi, Department } from '@/lib/api/department';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Building2,
    MoreVertical,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/context/ConfirmContext';

export default function AdminDepartmentsPage() {
    const { confirm } = useConfirm();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        description: '',
        isActive: true
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await departmentApi.getAll();
            if (res.success) {
                setDepartments(res.data);
            }
        } catch (error) {
            toast.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setForm({
                name: dept.name,
                description: dept.description || '',
                isActive: dept.isActive
            });
        } else {
            setEditingDept(null);
            setForm({
                name: '',
                description: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingDept) {
                const res = await departmentApi.update(editingDept.id, form);
                if (res.success) {
                    toast.success('Department updated');
                    fetchDepartments();
                    setShowModal(false);
                }
            } else {
                const res = await departmentApi.create(form);
                if (res.success) {
                    toast.success('Department created');
                    fetchDepartments();
                    setShowModal(false);
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Department',
            message: 'Are you sure you want to delete this department?',
            confirmText: 'Delete',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            const res = await departmentApi.delete(id);
            if (res.success) {
                toast.success('Department deleted');
                fetchDepartments();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-light text-gray-900 tracking-tight">Hospital Departments</h1>
                    <p className="text-gray-500 mt-1 font-light">Manage organizational structure and clinical units</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 group font-medium"
                >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    Add Department
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search departments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 hover:bg-white transition-all duration-300 text-gray-700 placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-gray-400 font-light italic">Gathering units...</p>
                </div>
            ) : filteredDepartments.length === 0 ? (
                <div className="text-center py-24 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-light">No departments found</p>
                    {searchTerm && <button onClick={() => setSearchTerm('')} className="text-blue-600 font-medium mt-2 hover:underline">Clear search</button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDepartments.map((dept) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={dept.id}
                            className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2.5 rounded-xl ${dept.isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Building2 className="w-6 h-6 text-current" />
                                </div>
                                <div className="flex items-center gap-1 opacity-100 transform translate-y-0 transition-all">
                                    <button
                                        onClick={() => handleOpenModal(dept)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dept.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-medium text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{dept.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] font-light italic">
                                {dept.description || 'No description provided'}
                            </p>

                            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between text-xs">
                                <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${dept.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {dept.isActive ? (
                                        <CheckCircle2 className="w-3 h-3 text-current" />
                                    ) : (
                                        <XCircle className="w-3 h-3 text-current" />
                                    )}
                                    {dept.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="flex items-center gap-1 text-gray-400 font-medium">
                                    <Users className="w-3 h-3" />
                                    {dept.doctorCount || 0} Doctors
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-gray-50 bg-gradient-to-r from-blue-50/30 to-transparent">
                                <h2 className="text-2xl font-light text-gray-900 tracking-tight">
                                    {editingDept ? 'Edit Unit' : 'Create New Unit'}
                                </h2>
                                <p className="text-gray-500 mt-1 text-sm font-light">Enter department information</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 ml-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-light"
                                        placeholder="e.g. Cardiology"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 ml-1">Description</label>
                                    <textarea
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-light resize-none"
                                        placeholder="Briefly describe the unit's clinical focus..."
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">Visibility Status</span>
                                        <span className="text-xs text-gray-500 font-light">Allow this unit to appear in dropdowns</span>
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
                                        onClick={() => setShowModal(false)}
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
                                            editingDept ? 'Update Unit' : 'Create Unit'
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
