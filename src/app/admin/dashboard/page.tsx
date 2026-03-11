'use client';

import React, { useState } from 'react';
import { InviteDoctorModal } from '@/components/admin/InviteDoctorModal';
import {
    UsersIcon,
    ShieldCheckIcon,
    ExclamationCircleIcon,
    ArrowTrendingUpIcon,
    PlusIcon,
    ShieldExclamationIcon,
    ServerStackIcon
} from '@heroicons/react/24/solid';

import { FadeIn, FadeInStagger } from '@/components/ui/FadeIn';

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <FadeIn direction="down" distance={10}>
        <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] shadow-premium dark:shadow-none border border-slate-200/60 dark:border-slate-800 relative overflow-hidden group h-full transition-all hover:scale-[1.02]">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 ${color}`}></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-primary/20 dark:shadow-none`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="mt-8">
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] opacity-60 leading-tight">{title}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
                    {sub && <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center">
                        <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                        {sub}
                    </p>}
                </div>
            </div>
        </div>
    </FadeIn>
);

export default function AdminDashboard() {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    return (
        <div className="max-w-7xl mx-auto space-y-10">
            <FadeIn direction="down" delay={0.1}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-2">
                    <div className="space-y-1 text-center sm:text-left">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Control</h2>
                        <p className="text-xs font-black text-primary uppercase tracking-[0.2em] opacity-80">Infrastructure Management</p>
                    </div>
                    {/* Dashboard Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="w-full sm:w-auto bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-slate-800 transition-all flex items-center justify-center space-x-3 active:scale-95 group"
                        >
                            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>Onboard Doctor</span>
                        </button>
                        <a
                            href="/admin/audit-logs"
                            className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center space-x-3 active:scale-95"
                        >
                            <ShieldCheckIcon className="w-5 h-5 text-primary dark:text-primary-light" />
                            <span>Audit Logs</span>
                        </a>
                    </div>
                </div>
            </FadeIn>

            <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" delay={0.2}>
                <StatCard title="Total Users" value="1,280" sub="+12" icon={UsersIcon} color="bg-slate-900" />
                <StatCard title="Active Doctors" value="84" sub="+2" icon={ShieldCheckIcon} color="bg-indigo-600" />
                <StatCard title="Records Secured" value="45.2k" sub="+8.4%" icon={ServerStackIcon} color="bg-emerald-600" />
                <StatCard title="Threats Blocked" value="0" icon={ShieldExclamationIcon} color="bg-rose-500" />
            </FadeInStagger>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <FadeIn direction="down" delay={0.3}>
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none relative overflow-hidden">
                            <span className="absolute top-6 right-6 px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-full">Phase 6</span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Activity Stream</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 opacity-80">Real-time audit events</p>
                                </div>
                                <span className="w-fit px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light text-[9px] font-black rounded-lg uppercase tracking-widest">MOCK DATA</span>
                            </div>

                            <div className="space-y-8">
                                <FadeInStagger className="space-y-8">
                                    {[
                                        { user: 'Admin', action: 'Created new doctor account', time: '2 mins ago', target: 'dr.anil@pahs.edu.np' },
                                        { user: 'Patient', action: 'Uploaded medical record', time: '15 mins ago', target: 'Lab_Report_Jan.pdf' },
                                        { user: 'Doctor', action: 'Certified medical record', time: '1 hour ago', target: 'REC-9921-X' },
                                    ].map((log, i) => (
                                        <FadeIn key={i} direction="down" distance={10}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-5">
                                                    <div className="w-2 h-2 mt-2 rounded-full bg-primary"></div>
                                                    <div>
                                                        <p className="text-slate-900 dark:text-white font-bold leading-tight">
                                                            <span className="text-primary dark:text-primary-light">{log.user}</span> {log.action}
                                                        </p>
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{log.target}</p>
                                                    </div>
                                                </div>
                                                <span className="text-slate-400 text-xs font-bold whitespace-nowrap">{log.time}</span>
                                            </div>
                                        </FadeIn>
                                    ))}
                                </FadeInStagger>
                            </div>
                        </div>
                    </FadeIn>
                </div>

                <div className="space-y-8">
                    <FadeIn direction="down" delay={0.4}>
                        <div className="bg-indigo-900 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-premium dark:shadow-none relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black uppercase tracking-tight mb-6">System Health</h3>
                                <div className="space-y-6">
                                    {[
                                        { label: 'API Gateway', status: 'Healthy' },
                                        { label: 'Identity Server', status: 'Healthy' },
                                        { label: 'Storage Cluster', status: 'Healthy' },
                                    ].map((svc) => (
                                        <div key={svc.label} className="flex items-center justify-between">
                                            <span className="text-indigo-200 text-sm font-bold">{svc.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">UP</span>
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
                        </div>
                    </FadeIn>

                    <FadeIn direction="down" delay={0.5}>
                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-[2.5rem] p-8 sm:p-10 relative shadow-premium dark:shadow-none">
                            <span className="absolute top-6 right-6 px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-full">Phase 3</span>
                            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 mb-4 pr-16">
                                <ExclamationCircleIcon className="w-6 h-6" />
                                <h3 className="text-lg font-black uppercase tracking-tight">Unverified Doctors</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                There are <strong>4 doctors</strong> awaiting mandatory license verification before they can access medical records.
                            </p>
                            <button className="w-full py-4 bg-rose-600 dark:bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest opacity-50 cursor-not-allowed transition-all shadow-lg shadow-rose-200/50" title="Coming in Phase 3">
                                Review Pending
                            </button>
                        </div>
                    </FadeIn>
                </div>
            </div>

            <InviteDoctorModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />
        </div>
    );
}
