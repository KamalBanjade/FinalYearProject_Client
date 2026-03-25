'use client';

import React, { useMemo, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { doctorApi } from '@/lib/api';
import { medicalRecordsApi } from '@/lib/api/medicalRecords';
import { 
    Loader2, User, Calendar, FileText, Plus, ChevronLeft, 
    Clock, Activity, Heart, Thermometer, ShieldAlert,
    Phone, Mail, MapPin, Database, Filter, ArrowRight,
    Search, ExternalLink, Download, CheckCircle, Info,
    Stethoscope, ClipboardList, Droplets, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { healthRecordApi } from '@/lib/api/healthRecordApi';
import { appointmentsApi } from '@/lib/api/appointments';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FullScreenRecordModal } from '@/components/ui/FullScreenRecordModal';
import { useQuery } from '@tanstack/react-query';

function ProfileContent() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const patientId = params.id as string;
    
    // URL State Sync
    const currentTab = (searchParams.get('tab') as 'files' | 'consults') || 'files';
    const [searchQuery, setSearchQuery] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewRecord, setPreviewRecord] = useState<any | null>(null);
    const [viewLoading, setViewLoading] = useState<string | null>(null); // recordId

    // Queries
    const { data: patientRes, isLoading: patientLoading } = useQuery({
        queryKey: ['doctor', 'patient', patientId],
        queryFn: () => doctorApi.getPatientInfo(patientId),
        staleTime: 1000 * 60 * 5,
    });

    const { data: medicalRecordsRes, isLoading: medicalLoading } = useQuery({
        queryKey: ['doctor', 'patient', patientId, 'records', 'medical'],
        queryFn: () => medicalRecordsApi.getPatientRecordsForDoctor(patientId),
        staleTime: 1000 * 60 * 5,
    });

    const { data: healthRecordsRes, isLoading: healthLoading } = useQuery({
        queryKey: ['doctor', 'patient', patientId, 'records', 'health'],
        queryFn: () => healthRecordApi.getPatientRecords(patientId),
        staleTime: 1000 * 60 * 5,
    });

    const { data: apptsRes, isLoading: apptsLoading } = useQuery({
        queryKey: ['doctor', 'appointments'],
        queryFn: () => appointmentsApi.getDoctorAppointments(),
        staleTime: 1000 * 60 * 5,
    });

    const patient = patientRes?.success ? patientRes.data : null;
    const isLoading = patientLoading || medicalLoading || healthLoading;

    // Derived Unified Timeline
    const unifiedRecords = useMemo(() => {
        if (!medicalRecordsRes || !healthRecordsRes) return [];
        
        const medicalDataRaw = (medicalRecordsRes as any).data ?? (medicalRecordsRes as any).Data;
        const healthDataRaw = (healthRecordsRes as any).data ?? (healthRecordsRes as any).Data;

        const files = (Array.isArray(medicalDataRaw) ? medicalDataRaw : []).map((r: any) => ({
            ...r,
            type: 'file',
            uploadedBy: r.uploadedBy || r.UploadedBy,
            date: new Date(r.uploadedAt || r.UploadedAt || r.recordDate || r.RecordDate),
            displayType: r.recordType || r.RecordType || 'Diagnostic File'
        }));

        const consults = (Array.isArray(healthDataRaw) ? healthDataRaw : []).map((r: any) => ({
            ...r,
            type: 'consult',
            doctorName: r.doctorName || r.DoctorName,
            date: new Date(r.createdAt || r.CreatedAt),
            displayType: 'Clinical Consultation'
        }));

        return [...files, ...consults].sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [medicalRecordsRes, healthRecordsRes]);

    const appointments = useMemo(() => {
        const data = (apptsRes as any)?.data ?? (apptsRes as any)?.Data;
        return (Array.isArray(data) ? data : []).filter((a: any) => a.patientId === patientId || a.PatientId === patientId);
    }, [apptsRes, patientId]);

    const setActiveTab = (tab: 'files' | 'consults') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`${pathname}?${params.toString()}`);
    };

    const calculateAge = (dobString: string) => {
        const dob = new Date(dobString);
        const diffMs = Date.now() - dob.getTime();
        const ageDT = new Date(diffMs);
        return Math.abs(ageDT.getUTCFullYear() - 1970);
    };

    const handleViewRecord = async (record: any) => {
        if (record.type === 'consult') {
            router.push(`/doctor/records/${record.id}`);
            return;
        }

        try {
            setViewLoading(record.id);
            const url = await medicalRecordsApi.previewRecordForDoctor(record.id);
            setPreviewUrl(url);
            setPreviewRecord(record);
        } catch (error) {
            console.error('Failed to preview record:', error);
        } finally {
            setViewLoading(null);
        }
    };

    if (isLoading && !patient) {
        return <PatientProfileSkeleton />;
    }

    if (!patient && !isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-6">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase">Patient Not Found</h2>
                <Button variant="outline" className="mt-6" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Go Back
                </Button>
            </div>
        );
    }

    const filteredRecords = unifiedRecords.filter(r => {
        const matchesTab = (currentTab === 'consults' && r.type === 'consult') || 
                          (currentTab === 'files' && r.type === 'file');
        const matchesSearch = r.displayType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (r.diagnosis && r.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTab && matchesSearch;
    });

    return (
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-8 space-y-8 animate-in fade-in duration-700">
            {/* ── HEADER ACTION BAR ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 transition-all text-slate-400 hover:text-indigo-600 shadow-sm cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase truncate">Clinical Profile</h1>
                        <nav className="flex items-center gap-2 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            <span className="hidden xs:inline">Patients</span>
                            <ChevronRight size={10} className="hidden xs:inline" />
                            <span className="text-indigo-500 truncate">#{patientId.slice(0, 12)}</span>
                        </nav>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Button 
                        onClick={() => router.push(`/doctor/patients/${patientId}/data`)}
                        variant="outline"
                        className="h-11 sm:h-12 px-4 sm:px-6 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 cursor-pointer transition-all hover:border-indigo-500 hover:text-indigo-600"
                    >
                        <Database size={16} /> View Data
                    </Button>
                    <Button 
                        onClick={() => router.push(`/doctor/records/new?patientId=${patientId}&source=profile`)}
                        className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 dark:shadow-none font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                    >
                        <Plus size={16} /> <span className="hidden xs:inline">New Consultation</span><span className="xs:hidden">New Consult</span>
                    </Button>
                </div>
            </div>

            {/* ── SIMPLIFIED PATIENT IDENTIFICATION ── */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:flex-row">
                {/* Left: Identity Block */}
                <div className="p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row items-center gap-6 lg:border-r border-slate-50 dark:border-slate-800 lg:min-w-[400px]">
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-lg shadow-indigo-100 dark:shadow-none">
                            {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full" />
                    </div>
                    <div className="text-center sm:text-left space-y-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                            {patient.firstName} {patient.lastName}
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] truncate">{patient.email}</p>
                        <div className="pt-2">
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-400/20">
                                Identity Verified
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center: Clinical Snapshot */}
                <div className="flex-1 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 items-center border-y sm:border-y-0 lg:border-y-0 border-slate-50 dark:border-slate-800">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} className="text-indigo-500" /> Patient Age</p>
                        <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white">{calculateAge(patient.dateOfBirth)} Years</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5"><Droplets size={12} /> Blood Group</p>
                        <p className="text-xl sm:text-2xl font-black text-rose-600">{patient.bloodType || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert size={12} /> Known Allergies</p>
                        <p className={`text-[10px] sm:text-xs font-black uppercase tracking-tight line-clamp-2 ${patient.allergies ? 'text-orange-600' : 'text-slate-400'}`}>
                            {patient.allergies ? patient.allergies : 'None Reported'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Phone size={12} className="text-emerald-500" /> Emergency</p>
                        <p className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-200 truncate">{patient.emergencyContactName}</p>
                        <p className="text-[9px] font-black text-indigo-600 tracking-wider">{patient.emergencyContactPhone}</p>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="p-6 sm:p-8 bg-slate-50/30 dark:bg-slate-800/20 flex flex-row lg:flex-col justify-center gap-3">
                    <a href={`mailto:${patient.email}`} className="flex-1 h-12 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all cursor-pointer shadow-sm">
                        <Mail size={14} /> <span className="hidden sm:inline">Message</span>
                    </a>
                    <a href={`tel:${patient.contactNumber}`} className="flex-1 h-12 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer shadow-sm">
                        <Phone size={14} /> <span className="hidden sm:inline">Contact</span>
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ── MAIN TIMELINE (unified) ── */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 sm:p-8 pb-4 border-b border-slate-50 dark:border-slate-800 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Health Timeline</h3>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Unified Record Archive / {filteredRecords.length} Items</p>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                                    {(['files', 'consults'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                                currentTab === tab 
                                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                                                : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {tab === 'files' ? 'Diagnostics' : 'Consultations'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search by diagnosis, document type, or keywords..."
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all dark:text-white"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-5 sm:p-8 max-h-[800px] sm:max-h-[1200px] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                {isLoading && unifiedRecords.length === 0 ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="w-12 h-12 rounded-2xl" />
                                                    <div className="space-y-2 flex-1">
                                                        <Skeleton className="w-1/3 h-5 rounded-lg" />
                                                        <Skeleton className="w-1/4 h-3 rounded-md" />
                                                    </div>
                                                </div>
                                                <Skeleton className="w-full h-16 rounded-xl" />
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredRecords.length === 0 ? (
                                    <div className="py-20 text-center opacity-30">
                                        <Database size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p className="text-[10px] font-black uppercase tracking-widest ">Zero records matching current criteria</p>
                                    </div>
                                ) : (
                                    filteredRecords.map((record, rIdx) => (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: rIdx * 0.05 }}
                                            key={`${record.type}-${record.id}`}
                                            onClick={() => handleViewRecord(record)}
                                            className={`group relative p-5 sm:p-6 rounded-[2rem] border transition-all cursor-pointer ${
                                                record.type === 'consult' 
                                                ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100/50 dark:border-indigo-900/30 hover:border-indigo-300' 
                                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                                                        record.type === 'consult' ? 'bg-indigo-600' : 'bg-slate-700'
                                                    }`}>
                                                        {record.type === 'consult' ? <Stethoscope size={20} /> : <FileText size={20} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{record.displayType}</h4>
                                                            {record.isCertified && (
                                                                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                            <span>{record.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            <span className="hidden xs:inline w-1 h-1 bg-slate-200 rounded-full" />
                                                            <span className="truncate">
                                                                {record.type === 'consult' ? `Dr. ${record.doctorName}` : record.uploadedBy || 'Patient'}
                                                            </span>
                                                        </p>
                                                        
                                                        {record.type === 'consult' && (
                                                            <div className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-indigo-100/30">
                                                                <p className="text-[8px] font-black uppercase text-indigo-500 mb-1">Clinical Impressions</p>
                                                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{record.diagnosis || 'Standard checkup consultation summary.'}</p>
                                                            </div>
                                                        )}
                                                        
                                                        {record.type === 'file' && record.description && (
                                                            <p className="text-[10px] text-slate-500 italic max-w-lg leading-relaxed">{record.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto pt-2 sm:pt-0">
                                                    <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-1 sm:flex-none">
                                                        {record.type === 'file' ? (
                                                            <>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleViewRecord(record); }}
                                                                    disabled={viewLoading === record.id}
                                                                    className="flex-1 sm:flex-none p-2.5 sm:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-500 shadow-sm transition-all"
                                                                >
                                                                    {viewLoading === record.id ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); medicalRecordsApi.downloadRecordForDoctor(record.id); }}
                                                                    className="flex-1 sm:flex-none p-2.5 sm:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-500 shadow-sm transition-all"
                                                                >
                                                                    <Download size={16} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); router.push(`/doctor/records/${record.id}`); }}
                                                                className="flex-1 sm:flex-none p-2.5 sm:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-500 shadow-sm transition-all"
                                                            >
                                                                <ExternalLink size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                        record.type === 'consult' 
                                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                        {record.type === 'consult' ? 'Digital' : 'PDF'}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SIDE COLUMN (appointments & context) ── */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Appointments Summary */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                        
                        <div className="relative">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                                <ClipboardList className="text-indigo-400" />
                                Visit History
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Management Context</p>
                        </div>

                        <div className="space-y-4 relative">
                            {appointments.length === 0 ? (
                                <div className="py-6 text-center bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No matching appointments</p>
                                </div>
                            ) : (
                                appointments.slice(0, 5).map((appt) => (
                                    <div key={appt.id} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                                appt.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                                            }`}>
                                                {appt.status}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-500">{new Date(appt.appointmentDate).toDateString()}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                                            {appt.reasonForVisit || 'Follow-up Consultation'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight italic">By Dr. {appt.doctorName}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full h-11 rounded-xl bg-white/5 text-white/50 text-center font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white"
                        >
                            View All Scheduler Records
                        </Button>
                    </div>

                    {/* Quick Access Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute bottom-0 right-0 opacity-10 translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform">
                            <Activity size={160} />
                        </div>
                        <div className="relative">
                            <h3 className="text-lg font-black uppercase mb-4">Clinical Support</h3>
                            <p className="text-xs font-medium leading-relaxed mb-6 opacity-80">
                                Need to certify a pending record or update patient demographics? Access the rapid tools below.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-center transition-all">
                                    <Database size={20} className="mx-auto mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest block">Update Demog</span>
                                </button>
                                <button className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-center transition-all">
                                    <CheckCircle size={20} className="mx-auto mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest block">Certify Batch</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Preview Modal */}
            {previewUrl && (
                <FullScreenRecordModal 
                    pdfUrl={previewUrl} 
                    onClose={() => {
                        setPreviewUrl(null);
                        setPreviewRecord(null);
                    }} 
                />
            )}
        </div>
    );
}

function PatientProfileSkeleton() {
    return (
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-8 space-y-8 animate-in fade-in duration-700">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="w-48 h-8 rounded-lg" />
                        <Skeleton className="w-32 h-4 rounded-md" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Skeleton className="w-32 h-12 rounded-2xl" />
                    <Skeleton className="w-48 h-12 rounded-2xl" />
                </div>
            </div>

            {/* Profile Bar Skeleton */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 h-auto sm:h-40 overflow-hidden flex flex-col lg:flex-row">
                <div className="p-8 flex items-center gap-6 lg:border-r border-slate-50 dark:border-slate-800 lg:min-w-[400px]">
                    <Skeleton className="w-24 h-24 rounded-3xl" />
                    <div className="space-y-3 flex-1">
                        <Skeleton className="w-3/4 h-8 rounded-lg" />
                        <Skeleton className="w-1/2 h-4 rounded-md" />
                        <Skeleton className="w-1/3 h-5 rounded-full" />
                    </div>
                </div>
                <div className="flex-1 p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="w-16 h-3 rounded-md" />
                            <Skeleton className="w-full h-6 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 space-y-8">
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="w-40 h-8 rounded-lg" />
                                <Skeleton className="w-64 h-3 rounded-md" />
                            </div>
                            <Skeleton className="w-48 h-12 rounded-2xl" />
                        </div>
                        <Skeleton className="w-full h-12 rounded-2xl" />
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="w-full h-32 rounded-[2rem]" />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-4 space-y-8">
                    <Skeleton className="w-full h-80 rounded-[2.5rem]" />
                    <Skeleton className="w-full h-60 rounded-[2.5rem]" />
                </div>
            </div>
        </div>
    );
}

export default function PatientProfilePage() {
    return (
        <Suspense fallback={<PatientProfileSkeleton />}>
            <ProfileContent />
        </Suspense>
    );
}
