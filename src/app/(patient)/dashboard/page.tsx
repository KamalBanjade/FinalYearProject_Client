'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PatientProfile } from '@/components/patient/PatientProfile';
import { PlusIcon, DocumentDuplicateIcon, ClockIcon, ClipboardDocumentCheckIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '@/store/authStore';
import { medicalRecordsApi } from '@/lib/api/medicalRecords';
import { useQuery } from '@tanstack/react-query';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white/40 dark:bg-white/5 p-6 rounded-3xl shadow-sm border border-white/10 dark:border-white/5 flex items-center space-x-4 backdrop-blur-sm">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-black/5`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-tight">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

export default function PatientDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();

    const { data: recordsResponse } = useQuery({
        queryKey: ['patient-medical-records'],
        queryFn: () => medicalRecordsApi.getMyRecords(),
    });

    const groupedData = recordsResponse?.data;
    const allRecords = groupedData?.sections.flatMap(section => section.records) || [];

    const stats = {
        total: groupedData?.totalCount || 0,
        certified: allRecords.filter(r => r.isCertified).length,
        pending: allRecords.filter(r => !r.isCertified).length,
    };

    const recentRecords = allRecords.slice(0, 3);

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-2 pb-12 space-y-8 animate-in fade-in duration-500">
            {/* Setup Reminder Banner */}
            {user && !user.totpSetupCompleted && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-2xl shadow-sm animate-in slide-in-from-top duration-500">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-amber-100 p-2 rounded-xl">
                            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Security Setup Incomplete</h3>
                            <p className="text-amber-700 font-medium">
                                You haven't completed your two-factor authentication setup. Complete it now to secure your account and enable record sharing.
                            </p>
                        </div>
                        <div className="ml-6">
                            <button
                                onClick={() => router.push('/complete-setup')}
                                className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
                            >
                                Complete Setup Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Actions Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/50 dark:bg-white/5 backdrop-blur-md p-4 rounded-[2rem] border border-white/10 shadow-sm">
                <div className="flex items-center gap-3 px-4">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Health Monitor</span>
                </div>

                <button
                    onClick={() => router.push('/records/upload')}
                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-primary dark:hover:bg-primary/90 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-indigo-200 dark:shadow-none flex items-center space-x-2 transition-all active:scale-95 group"
                >
                    <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Upload New Medical Record</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Records" value={stats.total} icon={DocumentDuplicateIcon} color="bg-blue-500" />
                <StatCard title="Pending" value={stats.pending} icon={ClockIcon} color="bg-amber-500" />
                <StatCard title="Certified" value={stats.certified} icon={ClipboardDocumentCheckIcon} color="bg-emerald-500" />
                <StatCard title="Upcoming" value="—" icon={PlusIcon} color="bg-indigo-500" />
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <PatientProfile />

                    {/* Recent Records - live data */}
                    <div className="bg-white/40 dark:bg-white/5 rounded-3xl p-8 border border-white/10 dark:border-white/5 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Records</h3>
                            <button
                                onClick={() => router.push('/records')}
                                className="text-indigo-600 dark:text-primary-light text-sm font-semibold flex items-center space-x-1 hover:underline"
                            >
                                <span>View all</span>
                                <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentRecords.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <DocumentDuplicateIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">
                                        No records yet.{' '}
                                        <button
                                            onClick={() => router.push('/records/upload')}
                                            className="text-indigo-600 dark:text-primary-light font-semibold hover:underline"
                                        >
                                            Upload one now.
                                        </button>
                                    </p>
                                </div>
                            ) : recentRecords.map((r) => (
                                <div
                                    key={r.id}
                                    onClick={() => router.push('/records')}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-primary/30 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                                            <DocumentDuplicateIcon className="w-5 h-5 text-indigo-600 dark:text-primary-light" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-xs">{r.originalFileName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{r.recordType} • {new Date(r.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.isCertified ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                        {r.isCertified ? 'Certified' : 'Pending'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* QR Emergency - Phase 4 */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden h-fit">
                    <span className="absolute top-6 right-6 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full z-20">Phase 4</span>
                    <div className="relative z-10 space-y-6">
                        <h3 className="text-xl font-bold">Emergency Quick Access</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed">Download your emergency medical pass for quick identification by medical personnel.</p>
                        <button className="w-full py-3 bg-white/10 opacity-50 cursor-not-allowed rounded-xl font-bold transition-all" title="Coming in Phase 4">
                            Generate QR Code
                        </button>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>
            </div>
        </div>
    );
}
