'use client';

import React, { useEffect, useState } from 'react';
import { doctorPatientsApi, PatientListResponseDTO } from '@/lib/api/doctorPatients';
import {
    Loader2, User, Phone, AlertTriangle, Calendar,
    Droplet, FileText, Search, ShieldAlert,
    Eye, ChevronRight, X, Mail, UserCircle, Clock,
    Filter, ArrowUpDown, CheckCircle2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-component: Patient Details Modal ---
interface DetailsModalProps {
    patient: PatientListResponseDTO;
    onClose: () => void;
}

const PatientDetailsModal = ({ patient, onClose }: DetailsModalProps) => {
    const calculateAge = (dobString: string) => {
        const dob = new Date(dobString);
        const diffMs = Date.now() - dob.getTime();
        const ageDT = new Date(diffMs);
        return Math.abs(ageDT.getUTCFullYear() - 1970);
    };

    return (
        <>
            {/* Backdrop */}
            <motion.div
                key="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
                key="modal-content"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
            >
                <div
                    className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden border border-slate-200 dark:border-slate-800 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Background Gradient */}
                    <div className="relative h-40 bg-gradient-to-br from-indigo-600 to-indigo-800 p-8">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-6 mt-4">
                            <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-xl">
                                <div className="w-full h-full rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-3xl">
                                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                                </div>
                            </div>
                            <div className="mt-2 text-white">
                                <h2 className="text-3xl font-black tracking-tight">{patient.firstName} {patient.lastName}</h2>
                                <p className="text-white/70 font-bold text-sm flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {patient.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pt-10 space-y-8">
                        {/* Status & ID */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div className="flex gap-2">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                    Verified Patient
                                </span>
                                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                    Shared Vault
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Patient UID</p>
                                <p className="text-xs font-mono font-bold text-slate-600 uppercase">{patient.id.slice(0, 8)}...</p>
                            </div>
                        </div>

                        {/* Vitals Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Droplet className="w-4 h-4 text-rose-500" />
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Blood Type</span>
                                </div>
                                <p className="text-lg font-black text-slate-900 dark:text-white uppercase">{patient.bloodType || 'N/A'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Gender</span>
                                </div>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{patient.gender}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Age</span>
                                </div>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{calculateAge(patient.dateOfBirth)} yrs</p>
                            </div>
                        </div>

                        {/* Detailed Sections */}
                        <div className="grid grid-cols-2 gap-8">
                            {/* Allergies */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Allergies
                                </h3>
                                <div className={`p-5 rounded-3xl border ${patient.allergies ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/20' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-800'}`}>
                                    <p className={`text-sm font-bold leading-relaxed ${patient.allergies ? 'text-orange-700 dark:text-orange-400' : 'text-slate-500'}`}>
                                        {patient.allergies || 'No known allergies.'}
                                    </p>
                                </div>
                            </div>

                            {/* Emergency */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Emergency Contact
                                </h3>
                                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">{patient.emergencyContactName || 'N/A'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{patient.emergencyContactRelationship || 'N/A'}</p>
                                        </div>
                                        {patient.emergencyContactPhone && (
                                            <a href={`tel:${patient.emergencyContactPhone}`} className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                                                <Phone className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-xs font-mono font-bold text-indigo-600">{patient.emergencyContactPhone || 'No phone provided.'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Record Count Badge */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-tight">Shared Records</p>
                                        <p className="text-xs font-bold text-indigo-600">Patient has granted full access</p>
                                    </div>
                                </div>
                                <span className="text-3xl font-black text-indigo-600">{patient.sharedRecordsCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

// --- Sub-component: Stat Card ---
const StatCard = ({ icon: Icon, label, value, trend, color }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    trend?: string;
    color: string;
}) => (
    <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all duration-200 group">
        <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
            {trend && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    {trend}
                </span>
            )}
        </div>
        <div className="mt-4 space-y-1">
            <p className="text-2xl font-black text-[var(--foreground)] tracking-tight">{value}</p>
            <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{label}</p>
        </div>
    </div>
);

// --- Main Page Component ---
export default function DoctorPatientsPage() {
    const [patients, setPatients] = useState<PatientListResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PatientListResponseDTO | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const data = await doctorPatientsApi.getDoctorPatients();
                setPatients(data);
            } catch (error) {
                console.error('Failed to fetch patients:', error);
                toast.error('Failed to load patient directory');
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

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

    const filteredPatients = React.useMemo(() => {
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

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                >
                    <div className="w-20 h-20 rounded-2xl border-4 border-[var(--border)] border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <User className="w-7 h-7 text-primary" />
                    </div>
                </motion.div>
                <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-sm font-semibold text-[var(--muted)] tracking-wide"
                >
                    Loading patient directory...
                </motion.p>
            </div>
        );
    }

    return (
        <div className="max-w-[1800px] mx-auto px-6 md:px-8 pt-2 pb-12 space-y-8 animate-in fade-in duration-500 flex-1 w-full">
            {/* Unified Toolbar */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by patient name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white h-12 shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                        <UserCircle className="w-4 h-4" />
                        <span>{filteredPatients.length} Active Patients</span>
                    </div>

                    <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-all text-slate-600 dark:text-slate-300 font-bold text-sm shadow-sm active:scale-95">
                        <Filter className="w-4 h-4" />
                        <span>Advanced Filters</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={User}
                    label="Total Patients"
                    value={patients.length}
                    color="bg-primary"
                />
                <StatCard
                    icon={FileText}
                    label="Shared Records"
                    value={totalRecords}
                    trend="+12%"
                    color="bg-indigo-500"
                />
                <StatCard
                    icon={Calendar}
                    label="Active This Week"
                    value={recentPatients}
                    color="bg-emerald-500"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Pending Review"
                    value={patients.filter(p => (p.sharedRecordsCount || 0) > 5).length}
                    color="bg-orange-500"
                />
            </div>

            {/* Table Container */}
            <div className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th
                                    className="px-6 py-4 text-left cursor-pointer group"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Patient</span>
                                        {getSortIndicator('name')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left cursor-pointer group"
                                    onClick={() => handleSort('records')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Records</span>
                                        {getSortIndicator('records')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left cursor-pointer group"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Last Activity</span>
                                        {getSortIndicator('date')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right">
                                    <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center">
                                                <Search className="w-7 h-7 text-[var(--muted)] opacity-60" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[var(--foreground)] font-semibold">No patients found</p>
                                                <p className="text-sm text-[var(--muted)]">Try adjusting your search terms</p>
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
                                            className="group hover:bg-[var(--surface-2)] transition-colors duration-150"
                                        >
                                            {/* Patient Info */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] text-[var(--foreground)] flex items-center justify-center font-bold text-sm border border-[var(--border)] group-hover:border-primary/30 transition-colors">
                                                        {patient.firstName?.[0]?.toUpperCase()}{patient.lastName?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-semibold text-[var(--foreground)] truncate">
                                                            {patient.firstName} {patient.lastName}
                                                        </span>
                                                        <span className="text-xs text-[var(--muted)] truncate">
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
                                                                className="w-6 h-6 rounded-lg bg-primary/10 border-2 border-[var(--surface)] flex items-center justify-center"
                                                            >
                                                                <FileText className="w-3 h-3 text-primary" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-sm font-semibold text-[var(--foreground)]">
                                                        {patient.sharedRecordsCount}
                                                    </span>
                                                    <span className="text-xs text-[var(--muted)]">docs</span>
                                                </div>
                                            </td>

                                            {/* Last Activity */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 rounded-lg bg-[var(--surface-2)]">
                                                        <Clock className="w-4 h-4 text-[var(--muted)]" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-[var(--foreground)]">
                                                            {formatDate(patient.latestSharedRecordDate)}
                                                        </span>
                                                        <span className="text-[10px] text-[var(--muted)]">Last upload</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedPatient(patient)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:border-primary hover:text-primary transition-all font-medium text-sm shadow-sm active:scale-[0.98]"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
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

            {/* Modal */}
            <AnimatePresence>
                {selectedPatient && (
                    <PatientDetailsModal
                        patient={selectedPatient}
                        onClose={() => setSelectedPatient(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}