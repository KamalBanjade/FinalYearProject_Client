'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { doctorPatientsApi, PatientListResponseDTO } from '@/lib/api/doctorPatients';
import { useQuery } from '@tanstack/react-query';
import {
    Loader2, User, AlertTriangle, Calendar,
    FileText, Search, Eye, Clock,
    UserCircle, ArrowUpDown, ChevronRight,
    FilePlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { DirectorySkeleton } from '@/components/ui/DirectorySkeleton';

// --- Stat Card ---
const StatCard = ({ icon: Icon, label, value, trend, colorClass, isLoading = false }: {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    value: string | number;
    trend?: string;
    colorClass: string;
    isLoading?: boolean;
}) => {
    const colorStyles: Record<string, string> = {
        primary: 'text-primary bg-primary/10 border-primary/20 shadow-primary/10 group-hover:bg-primary group-hover:text-white',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white',
    };
    const style = colorStyles[colorClass] || colorStyles.primary;

    return (
        <div className="p-6 rounded-[2rem] bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 hover:border-primary/30 transition-all duration-300 group cursor-pointer shadow-xl shadow-slate-200/20 dark:shadow-black/20 hover:-translate-y-1">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${style}`}>
                    <Icon size={22} className="transition-transform group-hover:scale-110" />
                </div>
                {trend && !isLoading && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-100 dark:border-emerald-400/20 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        {trend}
                    </div>
                )}
            </div>
            <div className="mt-6 space-y-1">
                {isLoading ? (
                    <Skeleton className="h-8 w-20 rounded-lg mb-2" />
                ) : (
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{value}</p>
                )}
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

    const initialQuery = searchParams.get('q') || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

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
        staleTime: 1000 * 60 * 5,
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
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            return { key, direction: 'asc' };
        });
    };

    const getSortIcon = (key: string) => (
        sortConfig?.key === key
            ? <ChevronRight className={`w-3 h-3 text-primary ${sortConfig.direction === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
            : <ArrowUpDown className="w-3 h-3 opacity-30" />
    );

    const filteredPatients = useMemo(() => {
        let result = patients.filter(p =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (sortConfig) {
            result = [...result].sort((a, b) => {
                let aVal: any, bVal: any;
                switch (sortConfig.key) {
                    case 'name': aVal = `${a.firstName} ${a.lastName}`.toLowerCase(); bVal = `${b.firstName} ${b.lastName}`.toLowerCase(); break;
                    case 'records': aVal = a.sharedRecordsCount; bVal = b.sharedRecordsCount; break;
                    case 'date': aVal = new Date(a.latestSharedRecordDate || 0).getTime(); bVal = new Date(b.latestSharedRecordDate || 0).getTime(); break;
                    default: return 0;
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [patients, searchQuery, sortConfig]);

    const totalRecords = patients.reduce((sum, p) => sum + (p.sharedRecordsCount || 0), 0);
    const recentPatients = patients.filter(p => {
        if (!p.latestSharedRecordDate) return false;
        return (Date.now() - new Date(p.latestSharedRecordDate).getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }).length;

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-2 pb-12 space-y-6 animate-in fade-in duration-500 flex-1 w-full">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by patient name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => updateSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white h-12 shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                        <UserCircle className="w-4 h-4" />
                        {filteredPatients.length} Patients
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={User} label="Total Patients" value={patients.length} colorClass="primary" isLoading={isLoading} />
                <StatCard icon={FileText} label="Shared Records" value={totalRecords} trend="+12%" colorClass="indigo" isLoading={isLoading} />
                <StatCard icon={Calendar} label="Active This Week" value={recentPatients} colorClass="emerald" isLoading={isLoading} />
                <StatCard icon={AlertTriangle} label="High Activity" value={patients.filter(p => (p.sharedRecordsCount || 0) > 5).length} colorClass="orange" isLoading={isLoading} />
            </div>

            {/* Table */}
            <ResponsiveTable
                loading={isLoading}
                data={filteredPatients}
                keyExtractor={(p) => p.id || p.email}
                emptyState={
                    <div className="px-8 py-16 flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center">
                            <Search className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">No patients found</p>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Try adjusting your search terms</p>
                    </div>
                }
                columns={[
                    {
                        header: 'Patient',
                        accessor: (p) => (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-sm">
                                    {p.firstName?.[0]?.toUpperCase()}{p.lastName?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.firstName} {p.lastName}</p>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{p.email}</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Records',
                        accessor: (p) => (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.sharedRecordsCount}</span>
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">docs</span>
                            </div>
                        )
                    },
                    {
                        header: 'Last Activity',
                        accessor: (p) => (
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{formatDate(p.latestSharedRecordDate)}</p>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Last upload</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Actions',
                        className: 'text-right',
                        accessor: (p) => (
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => router.push(`/doctor/records/new?patientId=${p.id}&source=directory`)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/10 active:scale-[0.98]"
                                >
                                    <FilePlus className="w-3 h-3" />
                                    Record
                                </button>
                                <button
                                    onClick={() => router.push(`/doctor/patients/${p.id}`)}
                                    className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    }
                ]}
                renderMobileCard={(p) => (
                    <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-white text-base">
                                {p.firstName?.[0]}{p.lastName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{p.firstName} {p.lastName}</p>
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">{p.email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Records</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.sharedRecordsCount} Files</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Activity</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatDate(p.latestSharedRecordDate)}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push(`/doctor/records/new?patientId=${p.id}&source=directory`)}
                                className="flex-1 h-11 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                <FilePlus className="w-3.5 h-3.5" />
                                Create Record
                            </button>
                            <button
                                onClick={() => router.push(`/doctor/patients/${p.id}`)}
                                className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                            >
                                <Eye size={17} />
                            </button>
                        </div>
                    </div>
                )}
            />
        </div>
    );
}

export default function DoctorPatientsPage() {
    return (
        <Suspense fallback={<DirectorySkeleton />}>
            <PatientsContent />
        </Suspense>
    );
}