'use client';

import React, { useState, Suspense } from 'react';
import { medicalRecordsApi, MedicalRecordResponseDTO } from '@/lib/api/medicalRecords';
import { DoctorReviewModal } from '@/components/doctor/DoctorReviewModal';
import {
    ClipboardDocumentCheckIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ChevronRightIcon,
    DocumentTextIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

function PendingRecordsContent() {
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecordResponseDTO | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: recordsRes, isLoading, refetch } = useQuery({
        queryKey: ['doctor', 'records', 'pending'],
        queryFn: () => medicalRecordsApi.getPendingRecords(),
        staleTime: 1000 * 60 * 5,
    });

    const records = recordsRes?.data || [];

    const handleReviewSuccess = () => {
        refetch();
    };

    const filteredRecords = records.filter(r =>
        r.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-2 pb-12 space-y-10 animate-in fade-in duration-500">
            {/* Unified Toolbar */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none">
                <div className="relative flex-1 group w-full">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search records or patients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border border-slate-100 dark:border-slate-700">
                        {filteredRecords.length} Pending
                    </div>
                    <button className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-primary transition-all shadow-sm active:scale-95">
                        <FunnelIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* List Area */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none overflow-hidden">
                {
                    isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-slate-400" >
                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                            <p className="font-bold text-sm uppercase tracking-widest animate-pulse">Scanning Secure Vault...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <ClipboardDocumentCheckIcon className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Queue is Clear</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">All submitted medical records have been certified or reviewed.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Document Name</th>
                                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Patient</th>
                                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Type</th>
                                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Date Received</th>
                                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {filteredRecords.map((record) => (
                                        <tr key={record.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                        <DocumentTextIcon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{record.originalFileName}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">Size: {record.fileSizeFormatted}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                                        <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    </div>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{record.patientName || 'Anonymous Patient'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-transparent dark:border-slate-700">
                                                    {record.recordType || 'Other'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{new Date(record.uploadedAt).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/10 active:scale-95"
                                                >
                                                    <span>Review</span>
                                                    <ChevronRightIcon className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }
            </div>

            {/* Review Modal */}
            {selectedRecord && (
                <DoctorReviewModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSuccess={handleReviewSuccess}
                />
            )}
        </div>
    );
}

export default function PendingRecordsPage() {
    return (
        <Suspense fallback={
            <div className="p-20 flex flex-col items-center justify-center text-slate-400" >
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-sm uppercase tracking-widest animate-pulse">Hydrating Queue...</p>
            </div>
        }>
            <PendingRecordsContent />
        </Suspense>
    );
}
