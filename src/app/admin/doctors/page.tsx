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
            {/* Unified Toolbar */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <Input
                        placeholder="Search by practitioner name, license, or specialization..."
                        className="pl-12 h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 h-12 text-xs font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/10 min-w-[160px] cursor-pointer"
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
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 h-12 text-xs font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/10 min-w-[140px] cursor-pointer"
                    >
                        <option value="">Status: All</option>
                        <option value="true">Active Only</option>
                        <option value="false">Inactive Only</option>
                    </select>

                    <Link href="/admin/doctors/invite">
                        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-all active:scale-95 group">
                            <UserPlus className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span>Invite Staff</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Clean Professional Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Name & Email</th>
                                <th className="px-6 py-4">Credentials</th>
                                <th className="px-6 py-4">Key State</th>
                                <th className="px-6 py-4">Added</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-5">
                                            <div className="h-6 bg-slate-50 dark:bg-slate-800 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : doctors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300 dark:text-slate-600">
                                            <SearchX size={40} strokeWidth={1.5} />
                                            <p className="font-black uppercase tracking-widest text-[10px]">No Practitioners Found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : doctors.map((doc: any) => (
                                <tr key={doc.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-5 text-center">
                                        {doc.isActive ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 dark:text-white text-base tracking-tight uppercase italic">Dr. {doc.firstName} {doc.lastName}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{doc.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <BadgeCheck size={14} className="text-primary" strokeWidth={3} />
                                                {doc.nmcLicense}
                                            </span>
                                            <span className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mt-1">{doc.department}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {doc.hasKeys ? (
                                            <span className="inline-flex items-center gap-2 text-slate-400 text-[10px] font-black tracking-widest uppercase">
                                                <ShieldCheck size={16} className="text-emerald-500" />
                                                RSA-2048
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 text-amber-500 text-[10px] font-black tracking-widest uppercase">
                                                <AlertCircle size={16} />
                                                NO KEY
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="text-[11px] font-black text-slate-400 uppercase">
                                            {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 w-10 p-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 transition-all active:scale-95"
                                                title="Regenerate Keys"
                                                onClick={() => handleRotateKeysClick(doc.userId, `${doc.firstName} ${doc.lastName}`)}
                                            >
                                                <RefreshCw size={18} />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 w-10 p-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 transition-all active:scale-95"
                                                title="Edit Details"
                                                onClick={() => handleEditClick(doc)}
                                            >
                                                <Edit size={18} />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-10 w-10 p-0 rounded-xl border transition-all flex items-center justify-center active:scale-95
                                                    ${doc.isActive
                                                        ? 'bg-white dark:bg-slate-900 text-rose-500 border-rose-100 dark:border-rose-900/30 hover:bg-rose-500 hover:text-white'
                                                        : 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-500 hover:bg-slate-800'
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
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-48 bg-slate-50 dark:bg-slate-800 rounded-3xl animate-pulse" />
                        ))
                    ) : doctors.length === 0 ? (
                        <div className="py-20 text-center">
                            <SearchX className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No Results</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {doctors.map((doc: any) => (
                                <motion.div
                                    key={doc.userId}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-5"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-900 dark:text-white text-base border border-slate-100 dark:border-slate-700">
                                                {doc.firstName?.[0]}{doc.lastName?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">Dr. {doc.firstName} {doc.lastName}</h4>
                                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{doc.department}</p>
                                            </div>
                                        </div>
                                        {doc.isActive ? (
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">License No.</p>
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white">{doc.nmcLicense}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Key State</p>
                                            <p className={`text-[11px] font-black uppercase ${doc.hasKeys ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {doc.hasKeys ? 'Active RSA' : 'No Key'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRotateKeysClick(doc.userId, `${doc.firstName} ${doc.lastName}`)}
                                            className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black text-[9px] uppercase tracking-widest"
                                        >
                                            Rotate Keys
                                        </button>
                                        <button
                                            onClick={() => handleEditClick(doc)}
                                            className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(doc)}
                                            disabled={togglingId === doc.userId}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all
                                                ${doc.isActive 
                                                    ? 'bg-white dark:bg-slate-900 text-rose-500 border-rose-100 dark:border-rose-800' 
                                                    : 'bg-emerald-600 text-white border-emerald-500'}`}
                                        >
                                            {togglingId === doc.userId ? <RefreshCw size={16} className="animate-spin" /> : doc.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

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
