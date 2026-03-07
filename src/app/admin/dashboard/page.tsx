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

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 ${color}`}></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-indigo-100`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="mt-8">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{title}</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
                {sub && <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center">
                    <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                    {sub}
                </p>}
            </div>
        </div>
    </div>
);

export default function AdminDashboard() {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    return (
        <div className="max-w-7xl mx-auto space-y-10">
            <div className="flex items-center justify-between">
                {/* Dashboard Stats */}
                <div className="flex space-x-4">
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center space-x-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Onboard Doctor</span>
                    </button>
                    <a
                        href="/admin/audit-logs"
                        className="bg-white text-slate-900 border-2 border-slate-100 px-6 py-3 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center space-x-2"
                    >
                        <ShieldCheckIcon className="w-5 h-5 text-indigo-600" />
                        <span>Audit Logs</span>
                    </a>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Total Users" value="1,280" sub="+12" icon={UsersIcon} color="bg-slate-900" />
                <StatCard title="Active Doctors" value="84" sub="+2" icon={ShieldCheckIcon} color="bg-indigo-600" />
                <StatCard title="Records Secured" value="45.2k" sub="+8.4%" icon={ServerStackIcon} color="bg-emerald-600" />
                <StatCard title="Threats Blocked" value="0" icon={ShieldExclamationIcon} color="bg-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative">
                        <span className="absolute top-6 right-6 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Phase 6</span>
                        <div className="flex items-center justify-between mb-10 pr-20">
                            <h3 className="text-2xl font-black text-slate-900">User Activity Stream</h3>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-lg">MOCK DATA</span>
                        </div>

                        <div className="space-y-8">
                            {[
                                { user: 'Admin', action: 'Created new doctor account', time: '2 mins ago', target: 'dr.anil@pahs.edu.np' },
                                { user: 'Patient', action: 'Uploaded medical record', time: '15 mins ago', target: 'Lab_Report_Jan.pdf' },
                                { user: 'Doctor', action: 'Certified medical record', time: '1 hour ago', target: 'REC-9921-X' },
                            ].map((log, i) => (
                                <div key={i} className="flex items-start justify-between">
                                    <div className="flex items-start space-x-5">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-indigo-600"></div>
                                        <div>
                                            <p className="text-slate-900 font-bold leading-tight">
                                                <span className="text-indigo-600">{log.user}</span> {log.action}
                                            </p>
                                            <p className="text-slate-500 text-sm mt-1">{log.target}</p>
                                        </div>
                                    </div>
                                    <span className="text-slate-400 text-xs font-bold whitespace-nowrap">{log.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-6">System Health</h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'API Gateway', status: 'Healthy' },
                                    { label: 'Identity Server', status: 'Healthy' },
                                    { label: 'Storage Cluster', status: 'Healthy' },
                                ].map((svc) => (
                                    <div key={svc.label} className="flex items-center justify-between">
                                        <span className="text-indigo-200 text-sm font-semibold">{svc.label}</span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
                    </div>

                    <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 relative">
                        <span className="absolute top-6 right-6 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Phase 3</span>
                        <div className="flex items-center space-x-3 text-rose-600 mb-4 pr-16">
                            <ExclamationCircleIcon className="w-6 h-6" />
                            <h3 className="text-lg font-bold">Unverified Doctors</h3>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed mb-6">
                            There are <strong>4 doctors</strong> awaiting mandatory license verification before they can access medical records.
                        </p>
                        <button className="w-full py-3 bg-rose-600/50 text-white rounded-2xl font-bold cursor-not-allowed transition-all shadow-lg shadow-rose-200" title="Coming in Phase 3">
                            Review Pending
                        </button>
                    </div>
                </div>
            </div>
            <InviteDoctorModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />
        </div>
    );
}
