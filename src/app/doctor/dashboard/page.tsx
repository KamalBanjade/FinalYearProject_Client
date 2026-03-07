'use client';

import React, { useState, useEffect } from 'react';
import { DoctorProfile } from '@/components/doctor/DoctorProfile';
import { ClipboardDocumentCheckIcon, ClockIcon, UserGroupIcon, CalendarDaysIcon, UserIcon } from '@heroicons/react/24/solid';
import { medicalRecordsApi, MedicalRecordResponseDTO } from '@/lib/api/medicalRecords';
import { DoctorReviewModal } from '@/components/doctor/DoctorReviewModal';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 transition-transform hover:scale-[1.02]">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-slate-500 text-sm font-semibold">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

export default function DoctorDashboard() {
    const [records, setRecords] = useState<MedicalRecordResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecordResponseDTO | null>(null);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const response = await medicalRecordsApi.getPendingRecords();
            setRecords(response.data || []);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const pendingRecords = records.filter(r => r.state === 1);
    const certifiedCount = records.filter(r => r.state === 2).length;

    // Unique patients based on records
    const patientCount = new Set(records.map(r => r.patientName)).size;

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-2 pb-12 space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Pending Requests" value={loading ? '...' : pendingRecords.length} icon={ClockIcon} color="bg-rose-500" />
                <StatCard title="Today's Consults" value="5" icon={CalendarDaysIcon} color="bg-indigo-500" />
                <StatCard title="Total Verified" value={loading ? '...' : certifiedCount} icon={ClipboardDocumentCheckIcon} color="bg-emerald-500" />
                <StatCard title="Patients Linked" value={loading ? '...' : (patientCount > 0 ? patientCount : 0)} icon={UserGroupIcon} color="bg-blue-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group/queue">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/queue:bg-indigo-500/10 transition-colors"></div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Active Review Queue</h3>
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Clinical Certification Verification</p>
                        </div>
                        <a href="/doctor/pending-records" className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl hover:text-indigo-600 transition-colors border border-slate-100 dark:border-slate-700">View History</a>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center opacity-40">
                                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading records...</p>
                            </div>
                        ) : pendingRecords.length === 0 ? (
                            <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-500 font-medium">No records awaiting your review.</p>
                            </div>
                        ) : (
                            pendingRecords.slice(0, 4).map((record) => (
                                <div key={record.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-all group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-11 h-11 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                            <UserIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-base">{record.patientName || 'Anonymous Patient'} - {record.originalFileName}</p>
                                            <div className="flex items-center space-x-2 mt-0.5">
                                                <span className="text-xs text-slate-500 capitalize">{record.recordType || 'General'}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span className="text-xs text-slate-400">{new Date(record.uploadedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedRecord(record)}
                                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/20"
                                    >
                                        Review
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <DoctorProfile />

                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative">
                        <span className="absolute top-6 right-6 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Phase 5</span>
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Today's Schedule</h3>
                        <div className="space-y-6 opacity-60">
                            {[
                                { time: '10:30 AM', patient: 'Sarah Wilson', type: 'Consultation' },
                                { time: '02:15 PM', patient: 'Robert Chen', type: 'Follow-up' },
                            ].map((app, i) => (
                                <div key={i} className="relative pl-6 border-l-2 border-indigo-100 py-1">
                                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-indigo-600"></div>
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{app.time}</p>
                                    <p className="font-bold text-slate-900 mt-0.5">{app.patient}</p>
                                    <p className="text-slate-500 text-xs">{app.type}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl relative">
                        <h3 className="text-lg font-bold mb-2 pr-16">Digital Signature</h3>
                        <p className="text-emerald-100 text-sm leading-relaxed mb-6">Your digital key is ready for signing records. Ensure your session is secure.</p>
                        <div className="flex items-center space-x-2 text-xs font-mono bg-black/10 p-2 rounded-lg border border-white/10 opacity-70">
                            <span className="opacity-60 font-bold uppercase tracking-widest text-[10px]">RSA-2048-ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            {selectedRecord && (
                <DoctorReviewModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSuccess={fetchRecords}
                />
            )}
        </div>
    );
}
