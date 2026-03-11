'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { doctorPatientsApi, PatientListResponseDTO } from '@/lib/api/doctorPatients';
import { useQuery } from '@tanstack/react-query';
import {
    Loader2, User, Phone, AlertTriangle, Calendar,
    Droplet, FileText, Search, ShieldAlert,
    Eye, ChevronRight, X, Mail, UserCircle, Clock,
    Filter, ArrowUpDown, CheckCircle2, AlertCircle,
    FilePlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';


// --- Sub-component: Stat Card ---
const StatCard = ({ icon: Icon, label, value, trend, colorClass }: {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    value: string | number;
    trend?: string;
    colorClass: string; // e.g., 'primary', 'indigo', 'emerald', 'orange'
}) => {
    // Mapping for glow and icon colors based on the design system
    const colorStyles: Record<string, string> = {
        primary: 'text-primary bg-primary/10 border-primary/20 shadow-primary/10 group-hover:bg-primary group-hover:text-white',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20 shadow-orange-500/10 group-hover:bg-orange-500 group-hover:text-white',
    };

    const style = colorStyles[colorClass] || colorStyles.primary;

    return (
        <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-primary/30 transition-all duration-300 group cursor-pointer shadow-premium dark:shadow-none hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${style}`}>
                    <Icon size={22} className="transition-transform group-hover:scale-110" />
                </div>
                {trend && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-100 dark:border-emerald-400/20 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                        {trend}
                    </div>
                )}
            </div>
            <div className="mt-6 space-y-1">
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    {value}
                </p>
                <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{label}</p>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/20 transition-colors" />
                </div>
            </div>
        </div>
    );
};

function PatientsContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // URL State Sync
    const initialQuery = searchParams.get('q') || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Data Fetching with Cache
    const { data: patients = [], isLoading } = useQuery({
        queryKey: ['doctor', 'patients'],
        queryFn: async () => {
            try {
                return await doctorPatientsApi.getDoctorPatients();
            } catch (error) {
                toast.error('Failed to load patient directory');
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const updateSearch = (value: string) => {
        setSearchQuery(value);
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set('q', value);
        else params.delete('q');
        router.replace(`${pathname}?${params.toString()}`);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const getSortIndicator = (key: string) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
        return sortConfig.direction === 'asc'
            ? <ChevronRight className="w-3.5 h-3.5 rotate-90 text-primary" />
            : <ChevronRight className="w-3.5 h-3.5 -rotate-90 text-primary" />;
    };

    const filteredPatients = useMemo(() => {
        let result = patients.filter(p =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (sortConfig) {
            result = [...result].sort((a, b) => {
                let aVal: any, bVal: any;
                switch (sortConfig.key) {
                    case 'name':
                        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
                        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
                        break;
                    case 'records':
                        aVal = a.sharedRecordsCount;
                        bVal = b.sharedRecordsCount;
                        break;
                    case 'date':
                        aVal = new Date(a.latestSharedRecordDate || 0).getTime();
                        bVal = new Date(b.latestSharedRecordDate || 0).getTime();
                        break;
                    default:
                        return 0;
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [patients, searchQuery, sortConfig]);

    // Stats calculations
    const totalRecords = patients.reduce((sum, p) => sum + (p.sharedRecordsCount || 0), 0);
    const recentPatients = patients.filter(p => {
        if (!p.latestSharedRecordDate) return false;
        const daysDiff = (Date.now() - new Date(p.latestSharedRecordDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
    }).length;

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/30 dark:bg-slate-900/10">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-2xl border-4 border-primary/10 dark:border-indigo-900/30" />
                    <div className="absolute inset-0 rounded-2xl border-4 border-t-primary animate-spin" />
                </div>
                <h3 className="mt-8 text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Sajilo स्वास्थ्य</h3>
                <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Directory...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-2 pb-12 space-y-8 animate-in fade-in duration-500 flex-1 w-full">
            {/* Unified Toolbar */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by patient name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => updateSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white h-12 shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.15em] border border-slate-200/60 dark:border-slate-700 flex items-center gap-2">
                        <UserCircle className="w-4 h-4" />
                        <span>{filteredPatients.length} Active Patients</span>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={User}
                    label="Total Patients"
                    value={patients.length}
                    colorClass="primary"
                />
                <StatCard
                    icon={FileText}
                    label="Shared Records"
                    value={totalRecords}
                    trend="+12%"
                    colorClass="indigo"
                />
                <StatCard
                    icon={Calendar}
                    label="Active This Week"
                    value={recentPatients}
                    colorClass="emerald"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Pending Review"
                    value={patients.filter(p => (p.sharedRecordsCount || 0) > 5).length}
                    colorClass="orange"
                />
            </div>

            {/* Table Container */}
            <div className="bg-[var(--surface)] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th
                                    className="px-6 py-4 text-left cursor-pointer group"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient</span>
                                        {getSortIndicator('name')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left cursor-pointer group"
                                    onClick={() => handleSort('records')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Records</span>
                                        {getSortIndicator('records')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left cursor-pointer group"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Activity</span>
                                        {getSortIndicator('date')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                <Search className="w-7 h-7 text-slate-400 opacity-60" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-slate-900 dark:text-white font-semibold">No patients found</p>
                                                <p className="text-sm text-slate-400">Try adjusting your search terms</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredPatients.map((patient, index) => (
                                        <motion.tr
                                            key={patient.id || `patient-${index}`}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.15, delay: index * 0.02 }}
                                            className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                                        >
                                            {/* Patient Info */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm border border-slate-200/60 dark:border-slate-700 group-hover:border-primary/30 transition-colors">
                                                        {patient.firstName?.[0]?.toUpperCase()}{patient.lastName?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {patient.firstName} {patient.lastName}
                                                        </span>
                                                        <span className="text-xs text-slate-400 truncate">
                                                            {patient.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Records Count */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex -space-x-1.5">
                                                        {[...Array(Math.min(patient.sharedRecordsCount || 0, 3))].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="w-6 h-6 rounded-lg bg-primary/10 border-2 border-white dark:border-slate-900 flex items-center justify-center"
                                                            >
                                                                <FileText className="w-3 h-3 text-primary" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {patient.sharedRecordsCount}
                                                    </span>
                                                    <span className="text-xs text-slate-400">docs</span>
                                                </div>
                                            </td>

                                            {/* Last Activity */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                                            {formatDate(patient.latestSharedRecordDate)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">Last upload</span>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/doctor/records/new?patientId=${patient.id}&source=directory`)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-indigo-700 transition-all font-bold text-xs shadow-lg shadow-primary/10 active:scale-[0.98] cursor-pointer"
                                                    >
                                                        <FilePlus className="w-3.5 h-3.5" />
                                                        Create Record
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white hover:border-indigo-500 hover:text-primary transition-all font-bold text-xs shadow-sm active:scale-[0.98] cursor-pointer"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Profile
                                                    </button>
                                                </div>
                                            </td>

                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                    {filteredPatients.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                            <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">No Patients Found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredPatients.map((patient, index) => (
                                <motion.div
                                    key={patient.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-900 dark:text-white text-base">
                                            {patient.firstName?.[0]}{patient.lastName?.[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-slate-900 dark:text-white truncate tracking-tight">{patient.firstName} {patient.lastName}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{patient.email}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Shared Records</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">{patient.sharedRecordsCount} Files</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Activity</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">{formatDate(patient.latestSharedRecordDate)}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/doctor/records/new?patientId=${patient.id}&source=directory`)}
                                            className="flex-1 h-12 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                                        >
                                            Create Record
                                        </button>
                                        <button
                                            onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                                            className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Table Footer */}
                {filteredPatients.length > 0 && (
                    <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]/50">
                        <p className="text-xs font-medium text-[var(--muted)]">
                            Showing <span className="font-semibold text-[var(--foreground)]">{filteredPatients.length}</span> of <span className="font-semibold text-[var(--foreground)]">{patients.length}</span> patients
                        </p>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors" disabled>
                                Previous
                            </button>
                            <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors" disabled>
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

export default function DoctorPatientsPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/30 dark:bg-slate-900/10">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-2xl border-4 border-primary/10 dark:border-indigo-900/30" />
                    <div className="absolute inset-0 rounded-2xl border-4 border-t-primary animate-spin" />
                </div>
                <h3 className="mt-8 text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Sajilo स्वास्थ्य</h3>
                <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Directory...</p>
            </div>
        }>
            <PatientsContent />
        </Suspense>
    );
}