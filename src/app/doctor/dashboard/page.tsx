'use client';

import React, { useState, Suspense } from 'react';
import { DoctorProfile } from '@/components/doctor/DoctorProfile';
import { useRouter } from 'next/navigation';
import { 
    ClipboardDocumentCheckIcon, 
    ClockIcon, 
    UserGroupIcon, 
    CalendarDaysIcon, 
    UserIcon, 
    ArrowRightIcon 
} from '@heroicons/react/24/solid';
import { medicalRecordsApi, MedicalRecordResponseDTO } from '@/lib/api/medicalRecords';
import { DoctorReviewModal } from '@/components/doctor/DoctorReviewModal';
import { DesktopPairing } from '@/components/scanner/DesktopPairing';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { FadeIn, FadeInStagger } from '@/components/ui/FadeIn';

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => {
    const colorStyles: Record<string, string> = {
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10 group-hover:bg-rose-500 group-hover:text-white',
        primary: 'text-primary bg-primary/10 border-primary/20 shadow-primary/10 group-hover:bg-primary group-hover:text-white',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10 group-hover:bg-blue-500 group-hover:text-white',
    };

    const style = colorStyles[colorClass] || colorStyles.primary;

    return (
        <FadeIn direction="down" distance={10}>
            <div className="bg-white dark:bg-slate-900 px-6 py-7 rounded-[2.5rem] shadow-premium dark:shadow-none border border-slate-200/60 dark:border-slate-800 flex items-center space-x-4 transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden h-full">
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 ${style.split(' ')[0]}`}></div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border shrink-0 ${style}`}>
                    <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-tight mb-1">{title}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter truncate">{value}</p>
                </div>
            </div>
        </FadeIn>
    );
};

function DashboardContent() {
    const router = useRouter();
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecordResponseDTO | null>(null);

    const { data: recordsRes, isLoading, refetch } = useQuery({
        queryKey: ['doctor', 'records', 'pending'],
        queryFn: () => medicalRecordsApi.getPendingRecords(),
        staleTime: 1000 * 60 * 5,
    });

    const records = recordsRes?.data || [];
    const pendingRecords = records.filter(r => r.state === 1);
    const certifiedCount = records.filter(r => r.state === 2).length;

    // Unique patients based on records
    const patientCount = new Set(records.map(r => r.patientName)).size;

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-2 pb-12 space-y-8">
            <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" delay={0.1}>
                <StatCard title="Pending Requests" value={isLoading ? '...' : pendingRecords.length} icon={ClockIcon} colorClass="rose" />
                <StatCard title="Today's Consults" value="5" icon={CalendarDaysIcon} colorClass="primary" />
                <StatCard title="Total Verified" value={isLoading ? '...' : certifiedCount} icon={ClipboardDocumentCheckIcon} colorClass="emerald" />
                <StatCard title="Patients Linked" value={isLoading ? '...' : (patientCount > 0 ? patientCount : 0)} icon={UserGroupIcon} colorClass="blue" />
            </FadeInStagger>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <FadeIn direction="down" delay={0.2} className="h-full">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium dark:shadow-none relative overflow-hidden group/queue h-full">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/queue:bg-primary/10 transition-colors"></div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Active Review Queue</h3>
                                    <p className="text-[10px] font-black text-primary dark:text-primary-light uppercase tracking-[0.2em] opacity-80 mt-1">Clinical Certification Verification</p>
                                </div>
                                <a href="/doctor/pending-records" className="w-full sm:w-auto text-center px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl hover:text-primary transition-all border border-slate-100 dark:border-slate-700">View History</a>
                            </div>

                            <div className="space-y-4 relative z-10">
                                {isLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center opacity-40">
                                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading records...</p>
                                    </div>
                                ) : pendingRecords.length === 0 ? (
                                    <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-500 font-medium">No records awaiting your review.</p>
                                    </div>
                                ) : (
                                    <FadeInStagger className="space-y-4">
                                        {pendingRecords.slice(0, 4).map((record) => (
                                            <FadeIn key={record.id} direction="down" distance={10}>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-11 h-11 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            <UserIcon className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-900 dark:text-white text-base truncate">{record.patientName || 'Anonymous Patient'}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{record.originalFileName}</p>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className="text-[10px] font-black text-primary uppercase tracking-tight">{record.recordType || 'General'}</span>
                                                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{new Date(record.uploadedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedRecord(record)}
                                                        className="w-full sm:w-auto mt-4 sm:mt-0 px-6 py-2.5 bg-primary dark:bg-primary-light dark:text-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 active:scale-95 shrink-0"
                                                    >
                                                        Review
                                                    </button>
                                                </div>
                                            </FadeIn>
                                        ))}
                                    </FadeInStagger>
                                )}
                            </div>
                        </div>
                    </FadeIn>
                </div>

                <div className="space-y-6">
                    <FadeIn direction="down" delay={0.3}>
                        <DoctorProfile />
                    </FadeIn>
                    
                    <FadeIn direction="down" delay={0.4}>
                        <DesktopPairing />
                    </FadeIn>

                    <FadeIn direction="down" delay={0.5}>
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none relative overflow-hidden">
                            <span className="absolute top-6 right-6 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Phase 5</span>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Today's Schedule</h3>
                            <div className="space-y-6 opacity-60">
                                {[
                                    { time: '10:30 AM', patient: 'Sarah Wilson', type: 'Consultation' },
                                    { time: '02:15 PM', patient: 'Robert Chen', type: 'Follow-up' },
                                ].map((app, i) => (
                                    <div key={i} className="relative pl-6 border-l-2 border-primary/20 dark:border-primary/40 py-1">
                                        <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-primary"></div>
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest">{app.time}</p>
                                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">{app.patient}</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs">{app.type}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn direction="down" delay={0.6}>
                        <div className="bg-gradient-to-br from-primary to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/20 dark:shadow-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -mr-12 -mt-12 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                            <h3 className="text-xl font-black uppercase tracking-tight relative z-10">Quick Actions</h3>
                            <p className="text-primary-foreground/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 relative z-10">Efficiency Tools</p>
                            
                            <div className="mt-8 space-y-3 relative z-10">
                                <button 
                                    onClick={() => router.push('/doctor/patients')}
                                    className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white text-white hover:text-primary rounded-2xl border border-white/10 hover:border-white transition-all group/btn"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 group-hover/btn:bg-primary/10 flex items-center justify-center transition-colors">
                                            <UserGroupIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase tracking-wider">Create Record</p>
                                            <p className="text-[10px] font-medium opacity-60 group-hover/btn:opacity-100 transition-opacity">Select patient from directory</p>
                                        </div>
                                    </div>
                                    <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-2 group-hover/btn:translate-x-0" />
                                </button>

                                <button 
                                    onClick={() => router.push('/doctor/appointments')}
                                    className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white text-white hover:text-primary rounded-2xl border border-white/10 hover:border-white transition-all group/btn"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 group-hover/btn:bg-primary/10 flex items-center justify-center transition-colors">
                                            <CalendarDaysIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase tracking-wider">Today's Roster</p>
                                            <p className="text-[10px] font-medium opacity-60 group-hover/btn:opacity-100 transition-opacity">Check upcoming appointments</p>
                                        </div>
                                    </div>
                                    <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-2 group-hover/btn:translate-x-0" />
                                </button>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn direction="down" delay={0.7}>
                        <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-xl rotate-12 -mr-8 -mt-8 opacity-20 shadow-inner group-hover:rotate-45 transition-transform duration-700" />
                            <h3 className="text-lg font-black uppercase tracking-tight mb-2 pr-16 relative z-10">Digital Signature</h3>
                            <p className="text-emerald-100 text-sm font-medium leading-relaxed mb-6 relative z-10">Your cryptographic key is active. All records will be signed with RSA-2048.</p>
                            <div className="flex items-center space-x-2 text-xs font-mono bg-black/10 p-3 rounded-2xl border border-white/10 opacity-70 relative z-10">
                                <span className="opacity-60 font-black uppercase tracking-widest text-[10px]">AUTH-RSA-2048-ACTIVE</span>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>

            {selectedRecord && (
                <DoctorReviewModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSuccess={() => refetch()}
                />
            )}
        </div>
    );
}

export default function DoctorDashboard() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hydrating Dashboard...</p>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
