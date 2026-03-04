'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Doctor } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Search,
    UserPlus,
    ShieldCheck,
    RefreshCw,
    Edit,
    Calendar,
    BadgeCheck,
    AlertCircle,
    UserX,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    SearchX
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useConfirm } from '@/context/ConfirmContext';

import { RegenerateKeysModal } from '@/components/admin/RegenerateKeysModal';
import { EditDoctorModal } from '@/components/admin/EditDoctorModal';
import { UpdateDoctorRequest } from '@/types/admin';

export default function DoctorListPage() {
    const { confirm } = useConfirm();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [department, setDepartment] = useState('');
    const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<{ id: string, name: string } | null>(null);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const response = await adminApi.getAllDoctors({
                page,
                pageSize,
                searchTerm,
                department: department || undefined,
                isActive
            });
            setDoctors(response.data.doctors);
            setTotalPages(response.data.pagination.totalPages);
            setTotalCount(response.data.pagination.totalCount);
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
            toast.error('Failed to load clinical staff directory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDoctors();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [page, searchTerm, department, isActive]);

    const handleToggleStatus = async (doc: any) => {
        const action = doc.isActive ? 'deactivate' : 'reactivate';
        const confirmed = await confirm({
            title: `${doc.isActive ? 'Deactivate' : 'Reactivate'} Staff`,
            message: `Are you sure you want to ${action} Dr. ${doc.firstName} ${doc.lastName}?`,
            confirmText: doc.isActive ? 'Deactivate' : 'Reactivate',
            type: doc.isActive ? 'danger' : 'primary'
        });
        if (!confirmed) return;

        setTogglingId(doc.userId);
        try {
            await adminApi.updateDoctor(doc.userId, {
                firstName: doc.firstName,
                lastName: doc.lastName,
                nmcLicense: doc.nmcLicense,
                department: doc.department,
                specialization: doc.specialization,
                qualificationDetails: doc.qualificationDetails,
                isActive: !doc.isActive,
                phoneNumber: doc.phoneNumber
            });
            toast.success(`Account ${doc.isActive ? 'deactivated' : 'reactivated'} successfully`);
            fetchDoctors();
        } catch (error) {
            console.error('Failed to toggle doctor status:', error);
            toast.error(`Failed to ${action} account`);
        } finally {
            setTogglingId(null);
        }
    };

    const handleRotateKeysClick = (id: string, name: string) => {
        setSelectedDoctor({ id, name });
        setIsRotateModalOpen(true);
    };

    const handleEditClick = (doc: Doctor) => {
        setEditingDoctor(doc);
        setIsEditModalOpen(true);
    };

    const handleSaveDoctor = async (id: string, data: UpdateDoctorRequest) => {
        await adminApi.updateDoctor(id, data);
        fetchDoctors();
    };

    const handleConfirmRotation = async () => {
        if (!selectedDoctor) return;

        try {
            await adminApi.regenerateKeys(selectedDoctor.id);
            toast.success('Keys regenerated successfully');
            fetchDoctors();
        } catch (error) {
            console.error('Failed to rotate keys:', error);
            toast.error('Key regeneration failed');
            throw error;
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-10 text-slate-900">
            {/* Minimalist Header */}
            <div className="flex justify-between items-end mb-10 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Clinical Staff Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Registry of accredited practitioners and key states.</p>
                </div>
                <Link href="/admin/doctors/invite">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-md px-5 h-10 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <UserPlus size={16} />
                        Invite Practitioner
                    </Button>
                </Link>
            </div>

            {/* Streamlined Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-center mb-8">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                        placeholder="Search by name, email, or license..."
                        className="pl-9 h-11 bg-white border-slate-200 focus:border-slate-900 focus:ring-0 rounded-md transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="bg-white border border-slate-200 rounded-md px-3 h-11 text-sm font-medium text-slate-600 outline-none focus:border-slate-900"
                    >
                        <option value="">All Departments</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="General Medicine">General Medicine</option>
                    </select>

                    <select
                        value={isActive === undefined ? '' : isActive.toString()}
                        onChange={(e) => {
                            const val = e.target.value;
                            setIsActive(val === '' ? undefined : val === 'true');
                        }}
                        className="bg-white border border-slate-200 rounded-md px-3 h-11 text-sm font-medium text-slate-600 outline-none focus:border-slate-900"
                    >
                        <option value="">Status: All</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>

                    <div className="flex items-center px-4 bg-slate-50 rounded-md text-[10px] font-bold text-slate-400 border border-slate-100">
                        {totalCount} TOTAL
                    </div>
                </div>
            </div>

            {/* Clean Professional Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Name & Email</th>
                            <th className="px-6 py-4">Credentials</th>
                            <th className="px-6 py-4">Key State</th>
                            <th className="px-6 py-4">Added</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-6 py-5">
                                        <div className="h-6 bg-slate-50 rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : doctors.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-slate-300">
                                        <SearchX size={40} strokeWidth={1.5} />
                                        <p className="text-slate-400 font-medium text-sm">No results found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : doctors.map((doc: any) => (
                            <tr key={doc.userId} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-5">
                                    {doc.isActive ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-rose-50 text-rose-600 border border-rose-100">
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-900">Dr. {doc.firstName} {doc.lastName}</span>
                                        <span className="text-xs text-slate-400 font-medium">{doc.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                            <BadgeCheck size={12} className="text-blue-500" strokeWidth={3} />
                                            {doc.nmcLicense}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">{doc.department}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    {doc.hasKeys ? (
                                        <span className="inline-flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                            <ShieldCheck size={14} className="text-indigo-500" />
                                            RSA-2048
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-amber-500 text-[10px] font-bold">
                                            <AlertCircle size={14} />
                                            NO KEY
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 w-10 p-0 rounded-md bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all shadow-sm"
                                            title="Regenerate Keys"
                                            onClick={() => handleRotateKeysClick(doc.userId, `${doc.firstName} ${doc.lastName}`)}
                                        >
                                            <RefreshCw size={18} />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 w-10 p-0 rounded-md bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all shadow-sm"
                                            title="Edit Details"
                                            onClick={() => handleEditClick(doc)}
                                        >
                                            <Edit size={18} />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-10 w-10 p-0 rounded-md border transition-all shadow-sm flex items-center justify-center
                                                ${doc.isActive
                                                    ? 'bg-white text-slate-400 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                                    : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                                                }`}
                                            title={doc.isActive ? 'Deactivate' : 'Activate'}
                                            onClick={() => handleToggleStatus(doc)}
                                            disabled={togglingId === doc.userId}
                                        >
                                            {togglingId === doc.userId ? (
                                                <RefreshCw size={16} className="animate-spin" />
                                            ) : doc.isActive ? (
                                                <UserX size={18} strokeWidth={2.5} />
                                            ) : (
                                                <UserCheck size={18} strokeWidth={2.5} />
                                            )}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer / Pagination */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0 rounded border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft size={16} />
                            </Button>

                            <div className="flex gap-1 text-[11px] font-bold text-slate-400 px-2">
                                {page} / {totalPages}
                            </div>

                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0 rounded border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <RegenerateKeysModal
                isOpen={isRotateModalOpen}
                onClose={() => setIsRotateModalOpen(false)}
                onConfirm={handleConfirmRotation}
                doctorName={selectedDoctor?.name || 'Doctor'}
            />

            <EditDoctorModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                doctor={editingDoctor}
                onSave={handleSaveDoctor}
            />
        </div>
    );
}
